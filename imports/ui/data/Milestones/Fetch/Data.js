import { Component } from 'react'

import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { withApollo } from 'react-apollo';

import GET_GITHUB_MILESTONES from '../../../../graphql/getMilestones.graphql';

import { cfgSources } from '../../Minimongo.js';
import { cfgMilestones } from '../../Minimongo.js';

import calculateQueryIncrement from '../../utils/calculateQueryIncrement.js';

class Data extends Component {
    constructor (props) {
        super(props);
        this.errorRetry = 0;
        this.milestonesCount = 0;
    }

    componentDidUpdate = (prevProps) => {
        const { setLoadFlag, loadFlag, loading } = this.props;
        // Only trigger load if loadFlag transitioned from false to true
        if (loadFlag === true && prevProps.loadFlag === false && loading === false) {
            setLoadFlag(false);
            this.load();
        }
    };

    sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    load = async () => {
        const {
            setLoading,
            setLoadingMsgAlt,
            setLoadingIterateTotal,
            incLoadingIterateCurrent,
            setLoadingIterateCurrent,
            setLoadingSuccessMsg,
            setLoadingSuccess,
            log,
            loadRepos,
            onSuccess
        } = this.props;

        //Check if there if we are loading everything or just data for a subset of repositories
        let reposQuery = {};
        if (loadRepos.length > 0) {
            reposQuery = {"id":{"$in":loadRepos}}
        }

        let allRepos = cfgSources.find(reposQuery).fetch();
        setLoading(true);
        setLoadingIterateTotal(allRepos.filter(repo => repo.active === true).length);
        setLoadingIterateCurrent(0);
        await this.sleep(100); // This 100ms sleep allow for change of state for this.props.loading

        for (let repo of allRepos) {
            if (repo.active === false) {
                //If repo is inactive, delete any milestones attached to this repo (if any)
                log.info('Repo ' + repo.name + ' (' + repo.id + ') is inactive, removing: ' + cfgMilestones.find({'repo.id': repo.id}).count() + ' milestones ');
                await cfgMilestones.remove({'repo.id': repo.id});
            } else if (repo.active === true) {
                log.info('Processing repo: ' + repo.name + ' - Is active, should have ' + repo.milestones.totalCount + ' milestones');
                setLoadingMsgAlt('Fetching milestones from ' + repo.org.login + '/' + repo.name);
                await this.getMilestonesPagination(null, 5, repo);
                incLoadingIterateCurrent(1);
                setLoadingSuccessMsg('Fetched ' + this.milestonesCount + ' milestones');
            }
        }

        log.info('Will be deleting ' + cfgMilestones.find({active: false}).count() + ' milestones attached to disabled repositories');
        await cfgMilestones.remove({active: false});

        log.info('Load completed: There is a total of ' + cfgMilestones.find({}).count() + ' milestones in memory');
        setLoadingSuccess(true);
        setLoading(false);          // Set to false to indicate labels are done loading.
        this.milestonesCount = 0;
        onSuccess();
    };

    // TODO- There is a big issue with the way the query increment is calculated, if remote has 100 milestones, but local only has 99
    // Query increment should not be just 1 since if the missing milestones is far down, this will generate a large number of calls
    getMilestonesPagination = async (cursor, increment, repoObj) => {
        const { client, setLoading, log } = this.props;
        if (this.props.loading) {
            if (this.errorRetry <= 3) {
                let data = {};
                try {
                    data = await client.query({
                        query: GET_GITHUB_MILESTONES,
                        variables: {repo_cursor: cursor, increment: increment, org_name: repoObj.org.login, repo_name: repoObj.name},
                        fetchPolicy: 'no-cache',
                        errorPolicy: 'ignore',
                    });
                }
                catch (error) {
                    log.info(error);
                }
                log.info(repoObj);
                if (data.data !== undefined && data.data !== null) {
                    this.errorRetry = 0;
                    this.props.updateChip(data.data.rateLimit);
                    // Check if the repository actually exist and milestones were returned
                    if (data.data.repository !== null && data.data.repository.milestones.edges.length > 0) {
                        //data.data.repository.milestones.totalCount;
                        // Refresh the repository with the updated milestones count
                        cfgSources.update({'id': repoObj.id}, {$set: {'milestones.totalCount': data.data.repository.milestones.totalCount}});

                        let lastCursor = await this.ingestMilestones(data, repoObj);
                        let loadedMilestonesCount = cfgMilestones.find({'repo.id': repoObj.id, 'refreshed': true}).count();
                        let queryIncrement = calculateQueryIncrement(loadedMilestonesCount, data.data.repository.milestones.totalCount);
                        log.info('Loading milestones for repo:  ' + repoObj.name + ' - Query Increment: ' + queryIncrement + ' - Local Count: ' + loadedMilestonesCount + ' - Remote Count: ' + data.data.repository.milestones.totalCount);
                        if (queryIncrement > 0 && lastCursor !== null) {
                            //Start recurring call, to load all milestones from a repository
                            await this.getMilestonesPagination(lastCursor, queryIncrement, repoObj);
                        }
                    }
                } else {
                    this.errorRetry = this.errorRetry + 1;
                    log.info('Error loading content, current count: ' + this.errorRetry)
                    await this.getMilestonesPagination(cursor, increment, repoObj);
                }
            } else {
                log.info('Got too many load errors, stopping');
                setLoading(false);
            }
        }
    };

    ingestMilestones = async (data, repoObj) => {
        const {
            setLoadingMsg,
            log
        } = this.props;
        let lastCursor = null;
        let stopLoad = false;
        log.info(data);
        for (var currentMilestone of data.data.repository.milestones.edges) {
            log.info('Loading milestone: ' + currentMilestone.node.title);
            let existNode = cfgMilestones.findOne({id: currentMilestone.node.id});
            let exitsNodeUpdateAt = null;
            if (existNode !== undefined) {
                exitsNodeUpdateAt = existNode.updatedAt;
            }
            if (new Date(currentMilestone.node.updatedAt).getTime() === new Date(exitsNodeUpdateAt).getTime()) {
                log.info('Milestone already loaded, skipping');
                // Milestones are loaded from newest to oldest, when it gets to a point where updated date of a loaded milestone
                // is equal to updated date of a local milestone, it means there is no "new" content, but there might still be
                // milestones that were not loaded for any reason. So the system only stops loaded if totalCount remote is equal
                //  to the total number of milestones locally
                if (data.data.repository.milestones.totalCount === cfgMilestones.find({'repo.id': repoObj.id}).count()) {
                    stopLoad = true;
                }
            } else {
                log.info('New or updated milestone');
                let milestoneObj = JSON.parse(JSON.stringify(currentMilestone.node)); //TODO - Replace this with something better to copy object ?
                milestoneObj['repo'] = repoObj;
                milestoneObj['org'] = repoObj.org;
                milestoneObj['refreshed'] = true;
                milestoneObj['active'] = true;

                await cfgMilestones.remove({'id': milestoneObj.id});
                await cfgMilestones.upsert({
                    id: milestoneObj.id
                }, {
                    $set: milestoneObj
                });
            }
            this.milestonesCount = this.milestonesCount + 1;
            setLoadingMsg(this.milestonesCount + ' milestones loaded');
            lastCursor = currentMilestone.cursor;
        }
        if (lastCursor === null) {
            log.info('=> No more updates to load, will not be making another GraphQL call for this repository');
        }
        if (stopLoad === true) {
            lastCursor = null;
        }
        return lastCursor;
    };

    render() {
        return null;
    }
}

Data.propTypes = {
    loadFlag: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired,
    loadRepos: PropTypes.array,

    setLoadFlag: PropTypes.func.isRequired,

    log: PropTypes.object.isRequired,
    client: PropTypes.object.isRequired,

    setLoading: PropTypes.func.isRequired,
    setLoadingMsg: PropTypes.func.isRequired,
    setLoadingMsgAlt: PropTypes.func.isRequired,
    setLoadingModal: PropTypes.func.isRequired,
    setLoadingIterateCurrent: PropTypes.func.isRequired,
    incLoadingIterateCurrent: PropTypes.func.isRequired,
    setLoadingIterateTotal: PropTypes.func.isRequired,
    setLoadingSuccess: PropTypes.func.isRequired,
    setLoadingSuccessMsg: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,

    updateChip: PropTypes.func.isRequired,
};

const mapState = state => ({
    loadFlag: state.milestonesFetch.loadFlag,
    loadRepos: state.milestonesFetch.loadRepos,

    log: state.global.log,

    loading: state.loading.loading,
    onSuccess: state.loading.onSuccess,
});

const mapDispatch = dispatch => ({
    setLoadFlag: dispatch.milestonesFetch.setLoadFlag,

    setLoading: dispatch.loading.setLoading,
    setLoadingMsg: dispatch.loading.setLoadingMsg,
    setLoadingMsgAlt: dispatch.loading.setLoadingMsgAlt,
    setLoadingModal: dispatch.loading.setLoadingModal,
    setLoadingIterateCurrent: dispatch.loading.setLoadingIterateCurrent,
    incLoadingIterateCurrent: dispatch.loading.incLoadingIterateCurrent,
    setLoadingIterateTotal: dispatch.loading.setLoadingIterateTotal,
    setLoadingSuccess: dispatch.loading.setLoadingSuccess,
    setLoadingSuccessMsg: dispatch.loading.setLoadingSuccessMsg,

    updateChip: dispatch.chip.updateChip,
});

export default connect(mapState, mapDispatch)(withApollo(Data));