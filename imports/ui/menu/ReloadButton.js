import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import { gh_issues } from '../../data_fetch/LoadIssues.js'
import { gh_repositories } from '../../data_fetch/LoadRepos.js'
import { gh_organizations } from '../../data_fetch/LoadOrgs.js'

import Button from 'material-ui/Button';

import {LoadOrgs} from '../../data_fetch/LoadOrgs.js'

export default class ReloadButton extends Component {
    reloadData() {
        console.log("Empty all data and reload");
        gh_issues.remove({});
        gh_repositories.remove({});
        gh_organizations.remove({});
        window.store_autoupdate = true;
        LoadOrgs(window.client);
    }
    render() {
        return (
            <Button variant="raised" color="primary" onClick={this.reloadData.bind(this)} >
                (re)Load data
            </Button>
        );
    }
}