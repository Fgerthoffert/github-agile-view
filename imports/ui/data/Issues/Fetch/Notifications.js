import _ from 'lodash';
import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import {connect} from "react-redux";

import Snackbar from "@material-ui/core/Snackbar";

const styles = theme => ({
    root: {
        textAlign: 'right'
    },
});
class LoadButton extends Component {
    constructor (props) {
        super(props);
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
                    message={<span id="message-id">Loaded or updated {loadedCount} issues</span>}
                />
            </div>
        );
    };
}

LoadButton.propTypes = {
    classes: PropTypes.object.isRequired,
};

const mapState = state => ({
    loadSuccess: state.issuesFetch.loadSuccess,
    loadedCount: state.issuesFetch.loadedCount,
});

const mapDispatch = dispatch => ({
    setLoadSuccess: dispatch.issuesFetch.setLoadSuccess,
});

export default connect(mapState, mapDispatch)(withStyles(styles)(LoadButton));
