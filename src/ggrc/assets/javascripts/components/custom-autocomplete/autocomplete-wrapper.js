/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

// Base viewModel for custom autocomplete. Must be extended into component.
// Provides component-wrapper for custom autocomplete.
// Must contain 'autocomplete-results' and 'autocomplete-input' components.

import {
  buildRelevantIdsQuery,
  makeRequest,
} from '../../plugins/utils/query-api-utils';
import RefreshQueue from '../../models/refresh_queue';

export default can.Map.extend({
  currentValue: '',
  model: null,
  result: [],
  objectsToExclude: [],
  showResults: false,
  showNewValue: false,
  queryField: 'title',
  getResult: function (event) {
    let that = this;
    this.requestItems(event.value)
      .then(that.getStubs.bind(that))
      .then(that.filterResult.bind(that))
      .then(that.getFullObjects.bind(that))
      .then((result) => {
        that.attr('currentValue',
          event.value);
        that.attr('result', result);
        that.attr('showNewValue', that.isCurrentValueUnique(result));
        that.attr('showResults', true);
      });
  },
  // Gets ids of items using QueryAPI
  requestItems: function (value) {
    let queryField = this.attr('queryField');
    let objName = this.attr('model');
    let filter = {expression: {
      left: queryField,
      op: {name: '~'},
      right: value,
    }};
    let query = buildRelevantIdsQuery(objName, {}, null, filter);

    return makeRequest({data: [query]});
  },
  getStubs: function (responseArr) {
    let objName = this.attr('model');
    let ids = responseArr[0][objName].ids;
    let model = CMS.Models[objName];

    let res = can.map(ids, function (id) {
      return CMS.Models.get_instance(model.shortName, id);
    });

    return new can.Deferred().resolve(res);
  },
  getFullObjects: function (result) {
    let defer = new can.Deferred();
    var queue = new RefreshQueue();

    can.each(result, (object) => {
      queue.enqueue(object);
    });

    queue.trigger().then((objs) => {
      defer.resolve(objs);
    });

    return defer;
  },
  filterResult: function (result) {
    let objects = this.attr('objectsToExclude');

    result = result.filter((item) => {
      return !_.some(objects, (object) => item.id === object.id);
    });

    return result;
  },
  isCurrentValueUnique: function (result) {
    let objects = this.attr('objectsToExclude').concat(result);
    let currentValue = this.attr('currentValue').toLowerCase();

    return !_.some(objects, (object) =>
      object.name.toLowerCase() === currentValue);
  },
});
