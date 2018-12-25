import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {connect} from "react-redux";

import Snackbar from "@material-ui/core/Snackbar";

const styles = {
    root: {
        textAlign: 'right'
    },
};
class LoadButton extends Component {
    constructor (props) {
        super(props);
    }

    componentDidUpdate(prevProps) {
        const { loadSuccess, setLoadSuccess } = this.props;
        if (prevProps.loadSuccess === false && loadSuccess === true) {
            //Set timer to actually set back success to false (and remove snackbar)
            setTimeout(() => {
                setLoadSuccess(false);
            }, 2000);
        }
    }

    render() {
        const { classes, loadSuccess, loadedCount } = this.props;
        return (
            <div className={classes.root}>
                <Snackbar
                    anchorOrigin={{vertical: 'top', horizontal: 'center'}}
                    open={loadSuccess}
                    ContentProps={{
                        'aria-describedby': 'message-id',
                    }}
                    message={<span id="message-id">Loaded or updated {loadedCount} milestones</span>}
                />
            </div>
        );
    }
}

LoadButton.propTypes = {
    classes: PropTypes.object.isRequired,
    loadedCount: PropTypes.number.isRequired,
    loadSuccess: PropTypes.bool.isRequired,
    setLoadSuccess: PropTypes.func.isRequired,
};

const mapState = state => ({
    loadedCount: state.milestonesEdit.loadedCount,
    loadSuccess: state.milestonesEdit.loadSuccess,
});

const mapDispatch = dispatch => ({
    setLoadSuccess: dispatch.milestonesEdit.setLoadSuccess,
});

export default connect(mapState, mapDispatch)(withStyles(styles)(LoadButton));
