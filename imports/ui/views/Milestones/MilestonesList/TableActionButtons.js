import _ from 'lodash';
import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import {connect} from "react-redux";

import Button from '@material-ui/core/Button';
import Snackbar from "@material-ui/core/Snackbar";

const styles = theme => ({
    root: {
        textAlign: 'right'
    },
});
class TableActionButtons extends Component {
    constructor (props) {
        super(props);
        this.state = {};
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { loadSuccess, setLoadSuccess } = this.props;
        if (prevProps.loadSuccess === false && loadSuccess === true) {
            //Set timer to actually set back success to false (and remove snackbar)
            setTimeout(() => {
                setLoadSuccess(false);
            }, 2000);
        }
    };

    closeSprint = () => {
        console.log('closeSprint');
        const { milestonesdata, setStageFlag, setVerifFlag, setMilestones, setAction, setVerifying } = this.props;
        setMilestones(milestonesdata.milestones.filter(m => m.state.toLowerCase() !== 'closed'));
        setAction('close');
        setVerifying(true);
        setStageFlag(true);
        setVerifFlag(true);
    };

    deleteClosedEmpty = () => {
        console.log('deleteClosedEmpty');
        const { milestonesdata, setStageFlag, setVerifFlag, setMilestones, setAction, setVerifying } = this.props;
        setMilestones(milestonesdata.milestones.filter(m => m.state.toLowerCase() === 'closed').filter(m => m.issues.totalCount === 0));
        setAction('deleteClosedEmpty');
        setVerifying(true);
        setStageFlag(true);
        setVerifFlag(true);
    };

    render() {
        const { classes, loadSuccess, milestonesdata } = this.props;
        console.log(milestonesdata);
        return (
            <div className={classes.root}>
                {milestonesdata.states.length > 1 &&
                <Button variant="raised" color="primary" className={classes.button} onClick={this.closeSprint}>
                    Close All
                </Button>
                }
                {milestonesdata.closedNoIssues.length > 0 &&
                <Button variant="raised" color="primary" className={classes.button} onClick={this.deleteClosedEmpty}>
                    Delete Empty
                </Button>
                }
            </div>
        );
    };
}

TableActionButtons.propTypes = {
    classes: PropTypes.object.isRequired,
};

const mapState = state => ({
    loadSuccess: state.milestonesEdit.loadSuccess,
});

const mapDispatch = dispatch => ({
    setStageFlag: dispatch.milestonesEdit.setStageFlag,
    setVerifFlag: dispatch.milestonesEdit.setVerifFlag,
    setVerifying: dispatch.milestonesEdit.setVerifying,
    setLoading: dispatch.milestonesEdit.setLoading,
    setLoadSuccess: dispatch.milestonesEdit.setLoadSuccess,

    setMilestones: dispatch.milestonesEdit.setMilestones,
    setAction: dispatch.milestonesEdit.setAction,

    setLoadedCount: dispatch.milestonesEdit.setLoadedCount,
});

export default connect(mapState, mapDispatch)(withStyles(styles)(TableActionButtons));