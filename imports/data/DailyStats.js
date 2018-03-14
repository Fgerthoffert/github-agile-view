import React, { Component } from 'react';
import { gh_issues } from '../data_fetch/LoadIssues.js'
import {gh_organizations} from "../data_fetch/LoadOrgs";

export const stats_issues_per_day = new Mongo.Collection('stats_issues_per_day', {connection: null});
export let array_issues_per_day = [];

const formatDate = (dateString) => {
    day = new Date(dateString);
    day.setUTCHours(0);
    day.setUTCMinutes(0);
    day.setUTCSeconds(0);
    return day
}

// Build a collection of days between 2 dates
const buildArrayInterval = (startDate, endDate) => {
    //let array_issues_per_day = [];
    var currentDate = startDate;
    while(currentDate < endDate) {
        currentDate.setDate(currentDate.getDate() + 1);
        array_issues_per_day[currentDate.toJSON().slice(0, 10)] = {date: currentDate.toJSON(), createdCount: 0, closedCount: 0}
    }
    return array_issues_per_day;
}

//Very basic non-optimized initial implementation
const DailyStats = () => {

    // Start by clearing the cache
//    stats_issues_per_day.remove({});

    // Define first and last date
    let firstDay = formatDate(gh_issues.findOne({}, { sort: { createdAt: 1 }, reactive: false, transform: null }).createdAt);
    let lastDay = formatDate(gh_issues.findOne({}, { sort: { createdAt: -1 }, reactive: false, transform: null }).updatedAt);

    //Small trick to avoid timezone issues, start the dates array one day earlier.
    firstDay.setDate(firstDay.getDate() - 1);
    console.log("First Day: " + firstDay.toDateString() + " - Last Day: " + lastDay.toDateString());

    // Trying to see if this is faster
    array_issues_per_day = buildArrayInterval(firstDay, lastDay);
    console.log("Number of days in the interval: " + Object.keys(array_issues_per_day).length);
    gh_issues.find({}).forEach((issue) => {
        array_issues_per_day[issue.createdAt.slice(0, 10)]['createdCount']++;
        if (issue.closedAt !== null) {
            array_issues_per_day[issue.closedAt.slice(0, 10)]['closedCount']++;
        }
    });

    console.log(array_issues_per_day);
    Object.keys(array_issues_per_day).forEach(function(key) {
        console.log(key, array_issues_per_day[key]);
        window.dailyIssuesCountStore.dispatch(window.addDailyIssueCount(array_issues_per_day[key]));
    });

//    window.dailyIssuesCountStore

//    stats_issues_per_day.insert({issues_per_day: array_issues_per_day})
//    console.log(array_issues_per_day)

}

export default DailyStats;