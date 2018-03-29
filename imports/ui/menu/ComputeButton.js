import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import { gh_issues } from '../../data_fetch/LoadIssues.js'
import { gh_repositories } from '../../data_fetch/LoadRepos.js'
import { gh_organizations } from '../../data_fetch/LoadOrgs.js'

import Button from 'material-ui/Button';

import DailyStats from '../../data/DailyStats';
import Aggregates from '../../data/Aggregates';

import {LoadOrgs} from '../../data_fetch/LoadOrgs.js'

export default class CalculateButton extends Component {

    computeData(globalState) {
        Aggregates(globalState)
        DailyStats()
    }
    render() {
        const globalState = this.props.globalState;

        return (
            <Button variant="raised" color="primary" onClick={this.computeData.bind(this, globalState)} >
                (re)Compute
            </Button>
        );
    }
}
