import _ from 'lodash';
import { Meteor } from 'meteor/meteor';

import { cfgIssues, cfgQueries, cfgSources } from '../../../data/Minimongo.js';

import { refreshBurndown } from '../../../utils/burndown/index.js';
import { buildFacets } from '../../../utils/facets/issues.js';
import { refreshVelocity } from '../../../utils/velocity/index.js';
import {
    refreshAssigneesContributions,
    refreshMilestonesContributions,
    refreshProjectsContributions,
    refreshAreasContributions
} from '../../../utils/contributions/index.js';

import { getAssigneesRepartition } from '../../../utils/repartition/index.js';

import subDays from 'date-fns/subDays';
import { addRemoveDateFromQuery } from "../../../utils/query/index.js";

import { fetchGraphIssues } from '../../../utils/graph/index.js';

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export default {
    state: {
        issues: [],
        issuesTotalCount: 0,
        issuesTotalGitHubCount: 0,
        issuesFirstUpdate: {},
        issuesLastUpdate: {},

        issuesGraph: [],
        maxIssuesGraph: 200,
        maxDistanceGraph: 5,
        maxDistanceGraphCeiling: 10,
        graphUpdateTimeoutId: {},
        graphUpdating: false,
        graphNodeSelected: {},
        graphNodeSelectedDialog: false,
        graphNode: {},
        graphPathStart: {},
        graphPathEnd: {},

        filteredIssues: [],
        filteredIssuesSearch: '',
        facets: [],
        queries: [],

        selectedTab: 'stats',           // Selected tab to be displayed
        tabStatsQuery: null,            // This stores the current query, used to identify if data refresh is needed
        tabWorkQuery: null,             // This stores the current query, used to identify if data refresh is needed
        tabContributionsQuery: null,    // This stores the current query, used to identify if data refresh is needed
        tabGraphQuery: null,            // This stores the current query, used to identify if data refresh is needed

        query: {},

        defaultPoints: true,    // Default display to points, otherwise issues count

        burndown: {},
        shouldBurndownDataReload: false,  // We don't want to reload the burndown data automatically when issues are changed

        velocity: {},
        shouldVelocityDataReload: false,  // We don't want to reload the velocity data automatically when issues are changed

        remainingWorkRepos: [],                  // List repos with open issues
        remainingWorkAssignees: [],              // List assignees with open issues
        shouldSummaryDataReload: false,

        statsOpenedDuring: [],
        statsCreatedSince: [],
        statsUpdatedSince: [],
        statsProjectsCount: [],
        statsMilestonesCount: [],
        statsPointsCount: [],
        statsAssigneesCount: [],
        statsMilestonesPastDue: [],

        contributionsAssignees: [],
        contributionsMilestones: [],
        contributionsProjects: [],
        contributionsAreas: [],

        showTimeModal: false,
        timeFields: [{idx: 'createdAt', name: 'Created'}, {idx: 'updatedAt', name: 'Updated'}, {idx: 'closedAt', name: 'Closed'}],
    },
    reducers: {
        setIssues(state, payload) {return { ...state, issues: payload };},
        setIssuesTotalCount(state, payload) {return { ...state, issuesTotalCount: payload };},
        setIssuesTotalGitHubCount(state, payload) {return { ...state, issuesTotalGitHubCount: payload };},
        setIssuesFirstUpdate(state, payload) {return { ...state, issuesFirstUpdate: JSON.parse(JSON.stringify(payload)) };},
        setIssuesLastUpdate(state, payload) {return { ...state, issuesLastUpdate: JSON.parse(JSON.stringify(payload)) };},
        setIssuesGraph(state, payload) {return { ...state, issuesGraph: payload };},
        setGraphNode(state, payload) {return { ...state, graphNode: payload };},
        setGraphNodeSelected(state, payload) {return { ...state, graphNodeSelected: payload };},
        setGraphNodeSelectedDialog(state, payload) {return { ...state, graphNodeSelectedDialog: payload };},
        setMaxDistanceGraph(state, payload) {return { ...state, maxDistanceGraph: payload };},
        setMaxDistanceGraphCeiling(state, payload) {return { ...state, maxDistanceGraphCeiling: payload };},
        setGraphUpdateTimeoutId(state, payload) {return { ...state, graphUpdateTimeoutId: payload };},
        setGraphUpdating(state, payload) {return { ...state, graphUpdating: payload };},
        setGraphPathStart(state, payload) {return { ...state, graphPathStart: payload };},
        setGraphPathEnd(state, payload) {return { ...state, graphPathEnd: payload };},

        setFilteredIssues(state, payload) {return { ...state, filteredIssues: payload };},
        setFilteredIssuesSearch(state, payload) {return { ...state, filteredIssuesSearch: payload };},
        setFacets(state, payload) {return { ...state, facets: payload };},
        setQueries(state, payload) {return { ...state, queries: payload };},
        setSelectedTab(state, payload) {return { ...state, selectedTab: payload };},
        setTabStatsQuery(state, payload) {return { ...state, tabStatsQuery: payload };},
        setTabWorkQuery(state, payload) {return { ...state, tabWorkQuery: payload };},
        setTabContributionsQuery(state, payload) {return { ...state, tabContributionsQuery: payload };},
        setTabGraphQuery(state, payload) {return { ...state, tabGraphQuery: payload };},

        setQuery(state, payload) {return { ...state, query: JSON.parse(JSON.stringify(payload)) };},

        setDefaultPoints(state, payload) {return { ...state, defaultPoints: payload };},

        setShouldBurndownDataReload(state, payload) {return { ...state, shouldBurndownDataReload: payload };},
        setBurndown(state, payload) {return { ...state, burndown: JSON.parse(JSON.stringify(payload)) };},

        setShouldVelocityDataReload(state, payload) {return { ...state, shouldVelocityDataReload: payload };},
        setVelocity(state, payload) {return { ...state, velocity: JSON.parse(JSON.stringify(payload)) };},

        setShouldSummaryDataReload(state, payload) {return { ...state, shouldSummaryDataReload: payload };},
        setRemainingWorkRepos(state, payload) {return { ...state, remainingWorkRepos: payload };},
        setRemainingWorkAssignees(state, payload) {return { ...state, remainingWorkAssignees: payload };},

        setStatsOpenedDuring(state, payload) {return { ...state, statsOpenedDuring: payload };},
        setStatsCreatedSince(state, payload) {return { ...state, statsCreatedSince: payload };},
        setStatsUpdatedSince(state, payload) {return { ...state, statsUpdatedSince: payload };},
        setStatsProjectsCount(state, payload) {return { ...state, statsProjectsCount: payload };},
        setStatsMilestonesCount(state, payload) {return { ...state, statsMilestonesCount: payload };},
        setStatsPointsCount(state, payload) {return { ...state, statsPointsCount: payload };},
        setStatsAssigneesCount(state, payload) {return { ...state, statsAssigneesCount: payload };},
        setStatsMilestonesPastDue(state, payload) {return { ...state, statsMilestonesPastDue: payload };},

        setShowTimeModal(state, payload) {return { ...state, showTimeModal: payload };},
        setTimeFields(state, payload) {return { ...state, timeFields: payload };},

        setContributionsAssignees(state, payload) {return { ...state, contributionsAssignees: JSON.parse(JSON.stringify(payload)) };},
        setContributionsMilestones(state, payload) {return { ...state, contributionsMilestones: JSON.parse(JSON.stringify(payload)) };},
        setContributionsProjects(state, payload) {return { ...state, contributionsProjects: JSON.parse(JSON.stringify(payload)) };},
        setContributionsAreas(state, payload) {return { ...state, contributionsAreas: JSON.parse(JSON.stringify(payload)) };},


    },
    effects: {
        async updateQuery(query) {
            if (query === null) {
                this.setQuery({});
            } else {
                this.setQuery(query);
            }

            // Check if the query doesn't return any issues with points, set default back to issues count.
            const pointsQuery = {...query, points: {$gt: 0}};
            if (cfgIssues.find(pointsQuery).count() === 0) {
                this.setDefaultPoints(false);
            }

            this.updateView();
        },

        async clearIssues() {
            cfgIssues.remove({});
            this.setIssues([]);
            this.setQuery({});
            this.updateView();
        },

        async updateView(payload, rootState) {
            const log = rootState.global.log;
            log.info("Triggered updateView()");

            this.refreshQueries();
            this.refreshFacets();
            this.refreshIssues();

            this.updateStats();
            this.updateWork();
            this.updateContributions();
            this.updateGraph();
        },

        async updateSelectedTab(payload, rootState) {
            const log = rootState.global.log;
            log.info("Triggered updateSelectedTab() - " + payload);
            this.setSelectedTab(payload);
            if (payload === 'stats' && !_.isEqual(rootState.issuesView.query, rootState.issuesView.tabStatsQuery)) {
                this.updateStats();
            } else if ((payload === 'work' || payload === 'burndown' || payload === 'velocity') && !_.isEqual(rootState.issuesView.query, rootState.issuesView.tabWorkQuery)) {
                this.updateWork();
            } else if ((payload === 'contributions') && !_.isEqual(rootState.issuesView.query, rootState.issuesView.tabContributionsQuery)) {
                this.updateContributions();
            } else if ((payload === 'graph') && !_.isEqual(rootState.issuesView.query, rootState.issuesView.tabGraphQuery)) {
                this.updateGraph();
            }
        },

        async updateStats(payload, rootState) {
            if (rootState.issuesView.selectedTab === 'stats') {
                this.refreshBins();
                this.refreshProjects();
                this.refreshMilestones();
                this.refreshPoints();
                this.refreshAssignees();
                this.refreshPastDue();
                this.setTabStatsQuery(rootState.issuesView.query);
            }
        },

        async updateWork(payload, rootState) {
            if (rootState.issuesView.selectedTab === 'work' || rootState.issuesView.selectedTab === 'burndown' || rootState.issuesView.selectedTab === 'velocity') {
                this.setShouldBurndownDataReload(true);
                this.refreshSummary();
                this.refreshVelocity();
                this.setTabWorkQuery(rootState.issuesView.query);
            }
        },

        async updateContributions(payload, rootState) {
            if (rootState.issuesView.selectedTab === 'contributions') {
                this.refreshContributions();
                this.setTabContributionsQuery(rootState.issuesView.query);
            }
        },

        // Basic idea here is that moving the slider doesn't directly trigger change
        async updateGraphDistance(payload, rootState) {
            // Cancel any previous timeout
            clearTimeout(rootState.issuesView.graphUpdateTimeoutId);

            // Create new timeout
            const timeoutId = setTimeout(async () => {
                this.setGraphUpdating(true);
                await sleep(100);
                this.updateGraph();
            }, 500);
            this.setGraphUpdateTimeoutId(timeoutId);
            this.setMaxDistanceGraph(payload);
//            await sleep(100);
//            this.updateGraph();
        },

        async updateGraph(payload, rootState) {
            if (rootState.issuesView.selectedTab === 'graph') {
                this.setTabGraphQuery(rootState.issuesView.query);

                const log = rootState.global.log;
                let t0 = performance.now();

                const sourceIssues = fetchGraphIssues(rootState.issuesView.issues.slice(0, rootState.issuesView.maxIssuesGraph), cfgIssues);
                let highestDistance = 10;
                if (sourceIssues.length > 0) {
                    highestDistance = sourceIssues.map(i => i.data.distance).reduce((a, b) => Math.max(a, b));
                }
                this.setMaxDistanceGraphCeiling(highestDistance);

                if (rootState.issuesView.maxDistanceGraph > highestDistance) {
                    this.setMaxDistanceGraph(highestDistance);
                }

                // Filter based on current max distance
                let maxDistance = rootState.issuesView.maxDistanceGraph;
                if (maxDistance > highestDistance) {
                    maxDistance = highestDistance;
                }

                const filteredIssue = sourceIssues.filter(i => i.data.distance <= maxDistance);

                this.initGraphData(filteredIssue);
                var t1 = performance.now();

                this.setGraphUpdating(false);
                log.info("updateGraph - took " + (t1 - t0) + " milliseconds.");
            }
        },

        clearGraphPath(payload, rootState) {
            this.setGraphPathStart({});
            this.setGraphPathEnd({});
            const cy = rootState.issuesView.graphNode;
            cy.elements().removeClass('path not-path start end');
        },

        //https://github.com/cytoscape/cytoscape.js/blob/master/documentation/demos/tokyo-railways/tokyo-railways.js
        buildGraphPath(payload, rootState) {
            const cy = rootState.issuesView.graphNode;
            setTimeout(() => {
                var aStar = cy.elements().aStar({
                    root: rootState.issuesView.graphPathStart,
                    goal: rootState.issuesView.graphPathEnd,
                    weight: function( e ){
                        if( e.data('is_walking') ){
                            return 0.25; // assume very little time to walk inside stn
                        }
                        return e.data('is_bullet') ? 1 : 3; // assume bullet is ~3x faster
                    }
                });

                if( !aStar.found ){
                    this.clearGraphPath();
                    cy.endBatch();
                    return;
                }
                cy.elements().not( aStar.path ).addClass('not-path');
                aStar.path.addClass('path');
                cy.endBatch();
            }, 300);
        },

        async initGraphData(graphIssues) {
            const graphData = [...graphIssues];
            graphData.forEach((issue) => {
                if (issue.data.linkedIssues !== undefined) {
                    if (issue.data.linkedIssues.target.length > 0) {
                        issue.data.linkedIssues.target.forEach((target) => {
                            if (_.findIndex(graphIssues, {id: target.id}) !== -1) {
                                graphData.push({
                                    data: {group: 'edges', target: target.id, source: issue.id}
                                });
                            }
                        })
                    }
                    if (issue.data.linkedIssues.source.length > 0) {
                        issue.data.linkedIssues.source.forEach((source) => {
                            if (_.findIndex(graphIssues, {id: source.id}) !== -1) {
                                graphData.push({
                                    data: {group: 'edges', target: issue.id, source: source.id}
                                });
                            }
                        })
                    }
                }
            });
            this.setIssuesGraph(graphData);
        },

        async refreshContributions(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();

            //This section builds a view of assignees contributions to various projects & milestones
            //Implemented by: project, milestone, area
            const modifiedQuery = addRemoveDateFromQuery('closedAt', 'after', subDays(new Date(), 28).toISOString(), rootState.issuesView.query);
            const issues = cfgIssues.find(modifiedQuery).fetch();

            const assigneesContributions = refreshAssigneesContributions(issues, Meteor.settings.public.labels.area_prefix);
            //console.log(contributions);
            this.setContributionsAssignees(assigneesContributions);

            const milestonesContributions = refreshMilestonesContributions(issues);
            this.setContributionsMilestones(milestonesContributions);

            const projectsContributions = refreshProjectsContributions(issues);
            this.setContributionsProjects(projectsContributions);

            const areasContributions = refreshAreasContributions(issues, Meteor.settings.public.labels.area_prefix);
            this.setContributionsAreas(areasContributions);

            var t1 = performance.now();
            log.info("refreshContributions - took " + (t1 - t0) + " milliseconds.");
        },

        async deleteQuery(query) {
            await cfgQueries.remove({'_id': query._id});
            this.refreshQueries();
        },

        async refreshQueries() {
            this.setQueries(cfgQueries.find({}).fetch());
        },

        async saveQuery(queryName, rootState) {
            if (cfgQueries.find({filters: JSON.stringify(rootState.issuesView.query)}).count() === 0) {
                await cfgQueries.insert({
                    name: queryName,
                    filters: JSON.stringify(rootState.issuesView.query),
                });
            }
            this.refreshQueries();
        },

        async refreshIssues(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();

            let issues = cfgIssues.find(rootState.issuesView.query).fetch();
            const firstUpdate = cfgIssues.findOne(rootState.issuesView.query, {sort: {updatedAt: 1},reactive: false,transform: null});
            const lastUpdate = cfgIssues.findOne(rootState.issuesView.query, {sort: {updatedAt: -1},reactive: false,transform: null});

            if (issues.length > 0) {
                this.setIssuesFirstUpdate(firstUpdate);
                this.setIssuesLastUpdate(lastUpdate);
            }
            this.setIssuesTotalCount(cfgIssues.find({}).count());
            this.setIssuesTotalGitHubCount(cfgSources.find({active: true}).fetch().map(repo => repo.issues.totalCount).reduce((acc, count) => acc + count, 0));

            this.setIssues(issues);
            this.setFilteredIssues(issues);
            this.setFilteredIssuesSearch('');

            var t1 = performance.now();
            log.info("refreshIssues - took " + (t1 - t0) + " milliseconds.");
        },

        async searchIssues(searchString, rootState) {
            let issues = rootState.issuesView.issues;
            this.setFilteredIssues(issues.filter((issue) => {
                if (issue.repo.name === searchString) {
                    return true;
                } else {
                    return false;
                }
            }));
            this.setFilteredIssuesSearch(searchString);
        },

        async refreshSummary(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();

            let query = rootState.issuesView.query;
            let openedIssuesFilter = {...query, ...{'state':{$in:['OPEN']}}};
            let openedIssues = cfgIssues.find(openedIssuesFilter).fetch();

            let repos = [];
            let statesGroup = _.groupBy(openedIssues, 'repo.name');
            Object.keys(statesGroup).forEach(function(key) {
                repos.push({
                    count: statesGroup[key].length,
                    name: key,
                    issues: statesGroup[key],
                    points: statesGroup[key].map(i => i.points).reduce((acc, points) => acc + points, 0)
                });
            });
            this.setRemainingWorkRepos(repos);

            const assignees = getAssigneesRepartition(openedIssues).map((assignee) => {
                let name = assignee.login;
                if (assignee.name !== undefined && assignee.name !== '' && assignee.name !== null) {name = assignee.name;}
                return {
                    name: name,
                    count: assignee.issues.list.length,
                    points: assignee.issues.points,
                    issues: assignee.issues.list,
                }
            });
            this.setRemainingWorkAssignees(assignees);

            var t1 = performance.now();
            log.info("refreshSummary - took " + (t1 - t0) + " milliseconds.");
        },

        async refreshFacets(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();

            let updatedFacets = buildFacets(JSON.parse(JSON.stringify(rootState.issuesView.query)), cfgIssues);
            this.setFacets(updatedFacets);

            var t1 = performance.now();
            log.info("refreshFacets - took " + (t1 - t0) + " milliseconds.");
        },

        async refreshBurndown(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();

            this.setShouldBurndownDataReload(false);

            let burndownData = await refreshBurndown(JSON.parse(JSON.stringify(rootState.issuesView.query)), cfgIssues);

            this.setBurndown(burndownData);

            var t1 = performance.now();
            log.info("refreshBurndown - took " + (t1 - t0) + " milliseconds.");
        },

        async refreshVelocity(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();

            this.setShouldVelocityDataReload(false);

            let velocityData = await refreshVelocity(JSON.parse(JSON.stringify(rootState.issuesView.query)), cfgIssues);

            this.setVelocity(velocityData);

            var t1 = performance.now();
            log.info("refreshVelocity - took " + (t1 - t0) + " milliseconds.");
        },

        async refreshBins(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();
            const query = rootState.issuesView.query;

            const openedDuring = [{
                label: '0 - 1 d',
                issues: cfgIssues.find({...query, ...{'state':{$in:['CLOSED']}, 'stats.openedDuring':{ $gte :  0, $lte : 1}}}).fetch()
            }, {
                label: '1 - 7 d',
                issues: cfgIssues.find({...query, ...{'state':{$in:['CLOSED']}, 'stats.openedDuring':{ $gt :  1, $lte : 7}}}).fetch()
            }, {
                label: '1 - 2 wks',
                issues: cfgIssues.find({...query, ...{'state':{$in:['CLOSED']}, 'stats.openedDuring':{ $gt :  7, $lte : 14}}}).fetch()
            }, {
                label: '2 - 4 wks',
                issues: cfgIssues.find({...query, ...{'state':{$in:['CLOSED']}, 'stats.openedDuring':{ $gt :  14, $lte : 30}}}).fetch()
            }, {
                label: '1 - 3 mths',
                issues: cfgIssues.find({...query, ...{'state':{$in:['CLOSED']}, 'stats.openedDuring':{ $gt :  30, $lte : 90}}}).fetch()
            }, {
                label: '3 - 6 mths',
                issues: cfgIssues.find({...query, ...{'state':{$in:['CLOSED']}, 'stats.openedDuring':{ $gt :  90, $lte : 120}}}).fetch()
            }, {
                label: '6 - 12 mths',
                issues: cfgIssues.find({...query, ...{'state':{$in:['CLOSED']}, 'stats.openedDuring':{ $gte :  120, $lte : 365}}}).fetch()
            }, {
                label: '1 yr+',
                issues: cfgIssues.find({...query, ...{'state':{$in:['CLOSED']}, 'stats.openedDuring':{ $gt :  365}}}).fetch()
            }];
            this.setStatsOpenedDuring(openedDuring);

            const createdSince = [{
                label: '0 - 1 d',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'createdAt':{ $gt : subDays(new Date(), 1).toISOString()}}}).fetch()
            }, {
                label: '1 - 7 d',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'createdAt':{ $gt :  subDays(new Date(), 7).toISOString(), $lte : subDays(new Date(), 1).toISOString()}}}).fetch()
            }, {
                label: '1 - 2 wks',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'createdAt':{ $gt :  subDays(new Date(), 14).toISOString(), $lte : subDays(new Date(), 7).toISOString()}}}).fetch()
            }, {
                label: '2 - 4 wks',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'createdAt':{ $gt :  subDays(new Date(), 30).toISOString(), $lte : subDays(new Date(), 14).toISOString()}}}).fetch()
            }, {
                label: '1 - 3 mths',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'createdAt':{ $gt :  subDays(new Date(), 90).toISOString(), $lte : subDays(new Date(), 30).toISOString()}}}).fetch()
            }, {
                label: '3 - 6 mths',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'createdAt':{ $gt :  subDays(new Date(), 120).toISOString(), $lte : subDays(new Date(), 90).toISOString()}}}).fetch()
            }, {
                label: '6 - 12 mths',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'createdAt':{ $gt :  subDays(new Date(), 365).toISOString(), $lte : subDays(new Date(), 120).toISOString()}}}).fetch()
            }, {
                label: '1 yr+',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'createdAt':{ $lt :  subDays(new Date(), 365).toISOString()}}}).fetch()
            }];
            this.setStatsCreatedSince(createdSince);

            const updatedSince = [{
                label: '0 - 1 d',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'updatedAt':{ $gt : subDays(new Date(), 1).toISOString()}}}).fetch()
            }, {
                label: '1 - 7 d',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'updatedAt':{ $gt :  subDays(new Date(), 7).toISOString(), $lte : subDays(new Date(), 1).toISOString()}}}).fetch()
            }, {
                label: '1 - 2 wks',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'updatedAt':{ $gt :  subDays(new Date(), 14).toISOString(), $lte : subDays(new Date(), 7).toISOString()}}}).fetch()
            }, {
                label: '2 - 4 wks',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'updatedAt':{ $gt :  subDays(new Date(), 30).toISOString(), $lte : subDays(new Date(), 14).toISOString()}}}).fetch()
            }, {
                label: '1 - 3 mths',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'updatedAt':{ $gt :  subDays(new Date(), 90).toISOString(), $lte : subDays(new Date(), 30).toISOString()}}}).fetch()
            }, {
                label: '3 - 6 mths',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'updatedAt':{ $gt :  subDays(new Date(), 120).toISOString(), $lte : subDays(new Date(), 90).toISOString()}}}).fetch()
            }, {
                label: '6 - 12 mths',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'updatedAt':{ $gt :  subDays(new Date(), 365).toISOString(), $lte : subDays(new Date(), 120).toISOString()}}}).fetch()
            }, {
                label: '1 yr+',
                issues: cfgIssues.find({...query, ...{'state':{$in:['OPEN']}, 'updatedAt':{ $lt :  subDays(new Date(), 365).toISOString()}}}).fetch()
            }];
            this.setStatsUpdatedSince(updatedSince);

            var t1 = performance.now();
            log.info("refreshBins - took " + (t1 - t0) + " milliseconds.");
        },

        async refreshProjects(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();
            const query = rootState.issuesView.query;

            const projectsCount = [{
                name: 'Populated',
                color: '#2196f3',
                issues: cfgIssues.find({...query, ...{'projectCards.totalCount':{ $gt : 0}}}).fetch()
            }, {
                name: 'Empty',
                color: '#e0e0e0',
                issues: cfgIssues.find({...query, ...{'projectCards.totalCount':{ $eq : 0}}}).fetch()
            }];
            this.setStatsProjectsCount(projectsCount);

            var t1 = performance.now();
            log.info("refreshProjects - took " + (t1 - t0) + " milliseconds.");
        },

        async refreshMilestones(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();
            const query = rootState.issuesView.query;

            const milestonesCount = [{
                name: 'Populated',
                color: '#2196f3',
                issues: cfgIssues.find({...query, ...{'milestone':{ $ne : null}}}).fetch()
            }, {
                name: 'Empty',
                color: '#e0e0e0',
                issues: cfgIssues.find({...query, ...{'milestone':null}}).fetch()
            }];
            this.setStatsMilestonesCount(milestonesCount);

            var t1 = performance.now();
            log.info("refreshMilestones - took " + (t1 - t0) + " milliseconds.");
        },

        async refreshPoints(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();
            const query = rootState.issuesView.query;

            const pointsCount = [{
                name: 'Populated',
                color: '#2196f3',
                issues: cfgIssues.find({...query, ...{'points':{ $ne : null}}}).fetch()
            }, {
                name: 'Empty',
                color: '#e0e0e0',
                issues: cfgIssues.find({...query, ...{'points':null}}).fetch()
            }];
            this.setStatsPointsCount(pointsCount);

            var t1 = performance.now();
            log.info("refreshPoints - took " + (t1 - t0) + " milliseconds.");
        },

        async refreshAssignees(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();
            const query = rootState.issuesView.query;

            const assigneesCount = [{
                name: 'Populated',
                color: '#2196f3',
                issues: cfgIssues.find({...query, ...{'assignees.totalCount':{ $gt : 0}}}).fetch()
            }, {
                name: 'Empty',
                color: '#e0e0e0',
                issues: cfgIssues.find({...query, ...{'assignees.totalCount':{ $eq : 0}}}).fetch()
            }];
            this.setStatsAssigneesCount(assigneesCount);

            var t1 = performance.now();
            log.info("refreshAssignees - took " + (t1 - t0) + " milliseconds.");
        },

        async refreshPastDue(payload, rootState) {
            const log = rootState.global.log;
            let t0 = performance.now();
            const query = rootState.issuesView.query;

            const milestonesGroup = _.groupBy(cfgIssues.find({...query, ...{'milestone.state':{$in:['OPEN', 'CLOSED']}, 'state':{$in:['OPEN']}, 'milestone.dueOn':{ $lt : new Date().toISOString()}}}).map((issue) => {
                return {
                    ...issue,
                    milestoneTitle: issue.milestone.title
                }
            }), 'milestoneTitle');

            const milestonesPastDue = Object.entries(milestonesGroup)
                .map(([name, content]) => {
                    return {
                        name: name,
                        //issues: Object.values(content),
                        count: Object.values(content).length,
                        points: Object.values(content)
                            .filter(issue => issue.points !== null)
                            .map(issue => issue.points)
                            .reduce((acc, points) => acc + points, 0),
                        issues: Object.values(content)
                    }
                });

            this.setStatsMilestonesPastDue(milestonesPastDue);

            var t1 = performance.now();
            log.info("refreshPastDue - took " + (t1 - t0) + " milliseconds.");
        },
    }
};
