/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/sub-tree-models.mustache';
import childModelsMap from '../tree/child-models-map';
import {
  getModelsForSubTier,
} from '../../plugins/utils/tree-view-utils';
import {
  getWidgetConfig,
} from '../../plugins/utils/object-versions-utils';

var viewModel = can.Map.extend({
  define: {
    isActive: {
      type: Boolean,
      value: false,
    },
    uniqueModelsList: {
      get: function () {
        return this.attr('modelsList').map(function (model) {
          model.attr('inputId', 'stm-' +
            (Date.now() * Math.random()).toFixed());
          return model;
        });
      },
    },
    selectedModels: {
      set: function (newModels) {
        var modelsList = this.attr('modelsList') || [];

        modelsList.forEach(function (item) {
          item.attr('display', newModels.indexOf(item.name) !== -1);
        });
        return newModels;
      },
    },
  },
  init: function () {
    var modelName = this.attr('type');
    var defaultModels = getModelsForSubTier(modelName).selected;
    this.attr('modelsList', this.getDisplayModels(modelName));

    // list of models can be changed in others tree-items
    childModelsMap.attr('container').bind(modelName, function (ev) {
      this.attr('selectedModels',
        childModelsMap.getModels(modelName) || defaultModels);
    }.bind(this));
  },
  type: null,
  modelsList: null,
  title: null,
  activate: function () {
    this.attr('isActive', true);
  },
  // is called when "Set Visibility" button is clicked
  setVisibility: function (ev) {
    var selectedModels = this.getSelectedModels();

    childModelsMap.setModels(this.attr('type'), selectedModels);

    this.attr('isActive', false);
    ev.stopPropagation();
  },
  getDisplayModels: function (parentType) {
    var savedModels = childModelsMap.getModels(parentType);
    var defaultModels = getModelsForSubTier(parentType);
    var selectedModels = savedModels || defaultModels.selected;
    var displayList;

    displayList = defaultModels.available.map(function (model) {
      return {
        widgetName: getWidgetConfig(model).widgetName,
        name: model,
        display: selectedModels.indexOf(model) !== -1,
      };
    });
    return displayList;
  },
  getSelectedModels: function () {
    return this.attr('modelsList').filter((model) => model.display)
      .map((model) => model.name);
  },
  selectAll: function (ev) {
    ev.stopPropagation();
    this.attr('modelsList').forEach(function (item) {
      item.attr('display', true);
    });
  },
  selectNone: function (ev) {
    ev.stopPropagation();
    this.attr('modelsList').forEach(function (item) {
      item.attr('display', false);
    });
  },
});

var events = {
  '.sub-tree-models mouseleave': function () {
    this.viewModel.attr('isActive', false);
  },
};

can.Component.extend({
  tag: 'sub-tree-models',
  template: template,
  viewModel: viewModel,
  events: events,
});

export {
  viewModel,
  events,
};
