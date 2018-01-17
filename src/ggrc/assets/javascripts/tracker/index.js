/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {FOCUS_AREAS, USER_JOURNEY_KEYS, USER_ACTIONS} from './actions';
import AnalyticsStrategy from './analytics';
import LocalStrategy from './local';

/**
 * Custom tracker strategy MUST implement method 'timing' from BaseStrategy
 */
let trackerStrategy;

const pendingTimings = {};

/**
 * Initialization of tracker strategy.
 */
const init = () => {
  if (GOOGLE_ANALYTICS_ID) {
    trackerStrategy = new AnalyticsStrategy();
  }

  if (!GOOGLE_ANALYTICS_ID && DEV_MODE) {
    trackerStrategy = new LocalStrategy();
  }
};

const start = (category, action, label) => {
  let stopFn = () => {};
  let key = `${category}:${action}:${label}`;

  if (!pendingTimings[key] && trackerStrategy) {
    pendingTimings[key] = Date.now();

    stopFn = () => {
      stop(category, action, label);
    };
  }

  return stopFn;
};

const stop = (category, action, label) => {
  let key = `${category}:${action}:${label}`;

  if (pendingTimings[key]) {
    let time = Date.now() - pendingTimings[key];

    trackerStrategy.timing(category, action, label, time);

    delete pendingTimings[key];
  }
};

init();

export default {
  start,
  stop,
  FOCUS_AREAS,
  USER_JOURNEY_KEYS,
  USER_ACTIONS,
};
