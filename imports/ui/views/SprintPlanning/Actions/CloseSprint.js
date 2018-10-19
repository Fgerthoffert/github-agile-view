import _ from 'lodash';
import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import {connect} from "react-redux";

import Button from '@material-ui/core/Button';
import Snackbar from "@material-ui/core/Snackbar";

import {buildMongoSelector} from "../../../utils/mongo";

import {cfgIssues} from "../../../data/Minimongo";
import {cfgMilestones} from "../../../data/Minimongo";

const styles = theme => ({
    root: {
        textAlign: 'right'
    },
});
class CloseSprint extends Component {
    constructor (props) {
        super(props);
        this.state = {};
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { loadSuccess, setLoadSuccess, loadedCount, setLoadedCount, updateAvailableSprints, updateSelectedSprint } = this.props;
        if (prevProps.loadSuccess === false && loadSuccess === true) {
            //Set timer to actually set back success to false (and remove snackbar)
            setTimeout(() => {
                setLoadSuccess(false);
                setLoadedCount(0);
            }, 2000);
            if (loadedCount > 0) {
                updateAvailableSprints();
                updateSelectedSprint(null);
            }
        }
    };

    closeSprint = () => {
        console.log('closeSprint');
        const { milestones, setLoadFlag, setMilestones, setAction } = this.props;
        setMilestones(milestones);
        setAction('close');
        setLoadFlag(true);
    };

    render() {
        const { classes, loading, loadSuccess, loadedCount, milestones } = this.props;

        if (milestones.length === 0) {
            return null;
        } else {
            return (
                <div className={classes.root}>
                    {!loading &&
                    <div>
                        <Button variant="raised" color="primary" className={classes.button} onClick={this.closeSprint}>
                            Close Sprint
                        </Button>
                    </div>
                    }
                    <Snackbar
                        anchorOrigin={{vertical: 'top', horizontal: 'center'}}
                        open={loadSuccess}
                        ContentProps={{
                            'aria-describedby': 'message-id',
                        }}
                        message={<span id="message-id">Updated {loadedCount} milestones</span>}
                    />
                </div>
            )
        }
    };
}

CloseSprint.propTypes = {
    classes: PropTypes.object.isRequired,
};

const mapState = state => ({
    loading: state.milestonesEdit.loading,
    loadSuccess: state.milestonesEdit.loadSuccess,

    loadedCount: state.milestonesEdit.loadedCount,

    repositories: state.sprintsView.repositories,

    milestones: state.sprintsView.milestones,
});

const mapDispatch = dispatch => ({
    setLoadFlag: dispatch.milestonesEdit.setLoadFlag,
    setLoading: dispatch.milestonesEdit.setLoading,
    setLoadSuccess: dispatch.milestonesEdit.setLoadSuccess,

    setMilestones: dispatch.milestonesEdit.setMilestones,
    setAction: dispatch.milestonesEdit.setAction,

    setLoadedCount: dispatch.milestonesEdit.setLoadedCount,

    updateAvailableSprints: dispatch.sprintsView.updateAvailableSprints,
    updateSelectedSprint: dispatch.sprintsView.updateSelectedSprint,

});


export default connect(mapState, mapDispatch)(withStyles(styles)(CloseSprint));