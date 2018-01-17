/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../../collapsible-panel/collapsible-panel';
import '../../object-list-item/business-object-list-item';
import '../../object-list-item/detailed-business-object-list-item';
import './mapped-control-related-objects';
import {
  prepareCustomAttributes,
  convertToFormViewField,
} from '../../../plugins/utils/ca-utils';
import {
  buildParam,
  makeRequest,
} from '../../../plugins/utils/query-api-utils';
import {
  toObject,
  transformQuery,
} from '../../../plugins/utils/snapshot-utils';
import template from './templates/mapped-controls.mustache';

const tag = 'assessment-mapped-controls';

/*
  Default Response Object
  */
const defaultResponseArr = [{
  Snapshot: {
    values: [],
  },
}, {
  Snapshot: {
    values: [],
  },
}];
/**
 * ViewModel for Assessment Mapped Controls Popover.
 * @type {can.Map}
 */
const viewModel = {
  define: {
    /**
     * Private Attribute defining array of requested Objects, Types and Fields of Objects
     * @type {Array}
     * @private
     */
    queries: {
      type: '*',
      value: [
        {
          type: 'objectives',
          objName: 'Objective',
          fields: ['child_id', 'child_type', 'revision', 'parent'],
        },
        {
          type: 'regulations',
          objName: 'Regulation',
          fields: ['child_id', 'child_type', 'revision', 'parent'],
        },
      ],
    },
    /**
     * Attribute to indicate loading state
     * @private
     */
    isLoading: {
      type: 'boolean',
      value: false,
    },
    objectives: {
      value: [],
    },
    regulations: {
      value: [],
    },
    customAttributes: {
      value: [],
    },
    state: {
      value: {},
    },
    mappedItems: {
      set(newArr) {
        return newArr.map((item) => {
          return {
            isSelected: false,
            instance: item,
          };
        });
      },
    },
  },
  titleText: '@',
  mapping: '@',
  mappingType: '@',
  selectedItem: {},
  snapshot: {},
  assessmentType: '@',
  withoutDetails: false,
  /**
   * Generate params required for Query API
   * @param {Number} id - Id of Control's Snapshot
   * @return {Object} request query object
   */
  getParams(id) {
    const params = {};
    // Right now we load only Snapshots of related Objectives and Regulations
    const relevant = {
      type: 'Snapshot',
      id: id,
      operation: 'relevant',
    };
    params.data = this.attr('queries')
      .map((query) => {
        const resultingQuery =
          buildParam(query.objName, {}, relevant, query.fields);
        return transformQuery(resultingQuery);
      });
    return params;
  },
  /**
   * Parse raw response data from Query API and set appropriate properties
   * @param {Array} responseArr - Raw Array of Data requested from Query API
   */
  setItems(responseArr) {
    responseArr.forEach((item, i) => {
      // Order of items in Queries Object is the same as order of Requested Queries
      const type = this.attr('queries')[i].type;
      this.attr(type).replace(item.Snapshot.values
        .map((item) => {
          return toObject(item);
        }));
    });
  },
  loadItems() {
    const id = this.attr('selectedItem.data.id');
    let params;

    if (!id) {
      this.setItems(defaultResponseArr);
      return;
    }
    params = this.getParams(id);

    this.attr('isLoading', true);

    makeRequest(params)
      .done(this.setItems.bind(this))
      .fail(() => {
        $(document.body).trigger('ajax:flash',
          {
            error: 'Failed to fetch related objects.',
          });
        this.setItems(defaultResponseArr);
      })
      .always(() => {
        this.attr('isLoading', false);
      });
  },
  attributesToFormFields(snapshot) {
    const attributes = prepareCustomAttributes(
      snapshot.custom_attribute_definitions,
      snapshot.custom_attribute_values)
      .map(convertToFormViewField);
    return attributes;
  },
};
/**
 * Assessment specific mapped controls view component
 */
export default can.Component.extend({
  template,
  tag,
  viewModel: viewModel,
  events: {
    '{viewModel} selectedItem.data'() {
      const item = this.viewModel.attr('selectedItem.data');
      let attributes;
      if (item) {
        if (!this.viewModel.attr('withoutDetails')) {
          this.viewModel.loadItems();
        }
        attributes = this.viewModel.attributesToFormFields(
          item.attr('revision.content'));
        this.viewModel.attr('customAttributes', attributes);
        this.viewModel.attr('snapshot',
          toObject(item));
        this.viewModel.attr('state.open', true);
      }
    },
  },
});
