import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { withTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
//import { Roles } from 'meteor/alanning:roles';
import { SnackbarProvider } from "notistack";
import Button from "@material-ui/core/Button";

import PropTypes from "prop-types";
import autoBind from "react-autobind";
import { connect } from "react-redux";

import Login from "./views/Login/index.js";
import Wizard from "./views/Wizard/index.js";
import Sprints from "./views/Sprints/index.js";
import Settings from "./views/Settings/index.js";
import Labels from "./views/Labels/index.js";

import Milestones from "./views/Milestones/index.js";
import Milestone from "./views/Milestone/index.js";
import Projects from "./views/Projects/index.js";
import Project from "./views/Project/index.js";
//import MilestoneEdit from './views/Milestones/Edit/index.js';
import Repositories from "./views/Repositories/index.js";
import Issues from "./views/Issues/index.js";
import Pullrequests from "./views/Pullrequests/index.js";
import Roadmap from "./views/Roadmap/index.js";
import Terms from "./views/Terms/index.js";
import About from "./views/About/index.js";

import Index from "./Index.js";

import Public from "./components/Public/Public.js";
import Authenticated from "./components/Authenticated/Authenticated.js";

import ApolloProviderGithub from "./services/ApolloProviderGithub.js";

import UsersFetch from "./data/Users/Fetch/index.js";
import Startup from "./components/Startup/index.js";
import Loading from "./components/Loading/index.js";

import Outdated from "./components/Outdated/index.js";

import ErrorBoundary from "./ErrorBoundary.js";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { afterLoginPath: null };
    autoBind(this);
  }

  componentDidMount() {
    const { initApp } = this.props;
    initApp();
  }

  setAfterLoginPath(afterLoginPath) {
    this.setState({ afterLoginPath });
  }

  render() {
    const { props, state, setAfterLoginPath } = this;
    const {
      loadedIssues,
      loadedSources,
      loadedLabels,
      loadedQueries,
      loadedMilestones,
      loadedProjects,
      loadedRepositories,
      loadedTeams
    } = this.props;
    if (
      (loadedIssues === null ||
        loadedSources === null ||
        loadedLabels === null ||
        loadedQueries === null ||
        loadedMilestones === null ||
        loadedProjects === null ||
        loadedRepositories === null ||
        loadedTeams === null) &&
      Meteor.user() !== null
    ) {
      return (
        <div>
          <Startup />
        </div>
      );
    } else {
      return (
        <ApolloProviderGithub>
          <UsersFetch />
          <Loading />
          <Outdated />
          <SnackbarProvider
            maxSnack={3}
            action={[
              <Button variant="outlined" size="small" key="notif-dismiss">
                {"Dismiss"}
              </Button>
            ]}
          >
            <div className="App">
              <ErrorBoundary>
                <Router>
                  <Switch>
                    <Route exact name="index" path="/" component={Index} />
                    <Public
                      path="/login"
                      component={Login}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/wizard"
                      component={Wizard}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/settings"
                      component={Settings}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/sprints"
                      component={Sprints}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/labels"
                      component={Labels}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/projects"
                      component={Projects}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/project"
                      component={Project}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/milestones"
                      component={Milestones}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/milestone"
                      component={Milestone}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/repositories"
                      component={Repositories}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/repositories/:tab"
                      component={Repositories}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/issues"
                      component={Issues}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/issues/:tab"
                      component={Issues}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/pullrequests"
                      component={Pullrequests}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Authenticated
                      exact
                      path="/roadmap"
                      component={Roadmap}
                      setAfterLoginPath={setAfterLoginPath}
                      {...props}
                      {...state}
                    />
                    <Public
                      exact
                      path="/terms"
                      component={Terms}
                      {...props}
                      {...state}
                    />
                    <Public
                      exact
                      path="/about"
                      component={About}
                      {...props}
                      {...state}
                    />
                  </Switch>
                </Router>
              </ErrorBoundary>
            </div>
          </SnackbarProvider>
        </ApolloProviderGithub>
      );
    }
  }
}

App.defaultProps = {
  userId: "",
  emailAddress: ""
};

App.propTypes = {
  userId: PropTypes.string,
  emailAddress: PropTypes.string,
  emailVerified: PropTypes.bool.isRequired,
  authenticated: PropTypes.bool.isRequired,
  initApp: PropTypes.func.isRequired,

  loadedIssues: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  loadedSources: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  loadedLabels: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  loadedQueries: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  loadedMilestones: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  loadedProjects: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  loadedRepositories: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  loadedTeams: PropTypes.oneOfType([PropTypes.number, PropTypes.bool])
};

const getUserName = name =>
  ({
    string: name,
    object: `${name.first} ${name.last}`
  }[typeof name]);

const mapState = state => ({
  loadedIssues: state.startup.loadedIssues,
  loadedSources: state.startup.loadedSources,
  loadedLabels: state.startup.loadedLabels,
  loadedQueries: state.startup.loadedQueries,
  loadedMilestones: state.startup.loadedMilestones,
  loadedProjects: state.startup.loadedProjects,
  loadedRepositories: state.startup.loadedRepositories,
  loadedTeams: state.startup.loadedTeams
});

const mapDispatch = dispatch => ({
  initApp: dispatch.global.initApp
});

export default connect(
  mapState,
  mapDispatch
)(
  withTracker(() => {
    const loggingIn = Meteor.loggingIn();
    const user = Meteor.user();
    const userId = Meteor.userId();
    const name =
      user &&
      user.profile &&
      user.profile.name &&
      getUserName(user.profile.name);
    const emailAddress = user && user.emails && user.emails[0].address;

    return {
      loggingIn,
      authenticated: !loggingIn && !!userId,
      name: name || emailAddress,
      userId,
      emailAddress,
      emailVerified:
        user && user.emails
          ? user && user.emails && user.emails[0].verified
          : true
    };
  })(App)
);
