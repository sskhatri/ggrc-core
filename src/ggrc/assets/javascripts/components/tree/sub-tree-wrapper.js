/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {DESTINATION_UNMAPPED} from '../../events/eventTypes';
import template from './templates/sub-tree-wrapper.mustache';
import * as TreeViewUtils from '../../plugins/utils/tree-view-utils';
import {
  isObjectContextPage,
  getPageType,
} from '../../plugins/utils/current-page-utils';
import childModelsMap from './child-models-map';

(function (can, GGRC) {
  'use strict';

  var viewModel = can.Map.extend({
    define: {
      parentModel: {
        type: String,
        get: function () {
          return this.attr('parent').type;
        }
      },
      parentId: {
        type: Number,
        get: function () {
          return this.attr('parent').id;
        }
      },
      showAllRelatedLink: {
        type: String,
        get: function () {
          return this.attr('parent') ? this.attr('parent').viewLink : '';
        }
      },
      loading: {
        type: Boolean,
        value: false
      },
      notDirectlyExpanded: {
        type: Boolean,
        value: false
      },
      needToSplit: {
        type: Boolean,
        get: function () {
          return isObjectContextPage() &&
            getPageType() !== 'Workflow' &&
            this.attr('notDirectlyItems').length;
        },
      },
      notResult: {
        type: Boolean,
        value: false
      },
      drawRelated: {
        type: Boolean,
        value: false
      },
      /**
       *
       */
      showMore: {
        type: Boolean,
        value: false
      },
      isOpen: {
        type: Boolean,
        set: function (newValue, setValue) {
          var isReady = this.attr('dataIsReady');

          if (!isReady && newValue) {
            if (!this.attr('childModels')) {
              this.initializeChildModels();
            }
            this.loadItems().then(function () {
              setValue(newValue);
            });
          } else {
            setValue(newValue);
          }
        }
      },
      childModels: {
        type: '*',
        set: function (models, setResult) {
          if (!this.attr('dataIsReady')) {
            setResult(models);
          } else if (this.attr('dataIsReady') && !this.attr('isOpen')) {
            this.attr('dataIsReady', false);
            setResult(models);
          } else {
            this.loadItems(models).then(function () {
              setResult(models);
            });
          }
        }
      },
      cssClasses: {
        type: String,
        get: function () {
          var classes = [];

          if (this.attr('loading')) {
            classes.push('loading');
          }

          return classes.join(' ');
        }
      }
    },
    dataIsReady: false,
    limitDepthTree: 0,
    depthFilter: '',
    parent: null,
    directlyItems: [],
    notDirectlyItems: [],
    _loader: null,
    _collapseAfterUnmapCallBack: null,
    initializeChildModels: function () {
      var parentModel = this.attr('parentModel');
      var savedModels = childModelsMap.getModels(parentModel);
      var defaultModels = TreeViewUtils.getModelsForSubTier(parentModel);

      this.attr('childModels', savedModels || defaultModels.selected);

      childModelsMap.attr('container').bind(parentModel, function (ev) {
        this.attr('childModels',
          childModelsMap.getModels(parentModel) || defaultModels.selected);
      }.bind(this));
    },
    expandNotDirectlyRelated: function () {
      var isExpanded = this.attr('notDirectlyExpanded');
      this.attr('notDirectlyExpanded', !isExpanded);
    },
    /**
     *
     * @param {Array} [models] -
     * @return {*}
     */
    loadItems: function (models) {
      var parentType = this.attr('parentModel');
      var parentId = this.attr('parentId');
      var filter = this.getDepthFilter();

      models = models || this.attr('childModels') || [];
      models = can.makeArray(models);

      if (!models.length) {
        this.attr('directlyItems', []);
        this.attr('notDirectlyItems', []);
        return can.Deferred().resolve();
      }

      this.attr('loading', true);

      return TreeViewUtils
        .loadItemsForSubTier(models, parentType, parentId, filter)
        .then(function (result) {
          this.attr('loading', false);
          this.attr('directlyItems', result.directlyItems);
          this.attr('notDirectlyItems', result.notDirectlyItems);
          this.attr('dataIsReady', true);
          this.attr('showMore', result.showMore);

          if (!result.directlyItems.length && !result.notDirectlyItems.length) {
            this.attr('notResult', true);
          }

          // bind 'destinationUnmapped' event
          this.attr('directlyItems').forEach((item) => {
            if (item) {
              item.bind(DESTINATION_UNMAPPED.type,
                this.attr('_collapseAfterUnmapCallBack'));
            }
          });
        }.bind(this));
    },
    collapseAfterUnmap: function () {
      // unbind 'destinationUnmapped' event
      this.attr('directlyItems').forEach((item) => {
        if (item) {
          item.unbind(DESTINATION_UNMAPPED.type,
            this.attr('_collapseAfterUnmapCallBack'));
        }
      });

      this.attr('dataIsReady', false);
      this.attr('isOpen', false);
      this.dispatch('collapseSubtree');
    },
    init: function () {
      this.attr('_collapseAfterUnmapCallBack',
        this.collapseAfterUnmap.bind(this));
    },
  });

  /**
   *
   */
  GGRC.Components('subTreeWrapper', {
    tag: 'sub-tree-wrapper',
    template: template,
    viewModel: viewModel,
  });
})(window.can, window.GGRC);
