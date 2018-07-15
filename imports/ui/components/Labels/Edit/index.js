import _ from 'lodash';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import { withApollo } from 'react-apollo';
import { connect } from "react-redux";

import { Link } from 'react-router-dom';

import Button from '@material-ui/core/Button';

const styles = theme => ({
    root: {

    },

});

class LabelsEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    componentDidMount() {
        console.log('componentDidMount');

    }

    render() {
        const { classes } = this.props;
        const { labels, colors, descriptions, orgs } = this.state;
        return (
            <div className={classes.root}>
                <h1>Edit Single label</h1>
            </div>
        );
    }
}

LabelsEdit.propTypes = {
    classes: PropTypes.object.isRequired,

};

const mapState = state => ({

});

const mapDispatch = dispatch => ({

});

export default connect(mapState, mapDispatch)(withStyles(styles)(withApollo(LabelsEdit)));