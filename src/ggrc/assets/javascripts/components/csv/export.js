/*
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import './csv-template';
import '../relevant_filters';
import exportPanelTemplate from './templates/export-panel.mustache';
import exportGroupTemplate from './templates/export-group.mustache';
import csvExportTemplate from './templates/csv-export.mustache';
import {confirm} from '../../plugins/utils/modals';

var url = can.route.deparam(window.location.search.substr(1));
var filterModel = can.Map({
  model_name: 'Program',
  value: '',
  filter: {},
});
var panelModel = can.Map({
  models: null,
  type: 'Program',
  filter: '',
  relevant: can.compute(function () {
    return new can.List();
  }),
  attributes: new can.List(),
  localAttributes: new can.List(),
  mappings: new can.List(),
});
var panelsModel = can.Map({
  items: new can.List()
});
var exportModel = can.Map({
  panels: new panelsModel(),
  loading: false,
  url: '/_service/export_csv',
  type: url.model_type || 'Program',
  only_relevant: false,
  filename: 'export_objects.csv',
  format: 'gdrive'
});
var exportGroup;
var exportPanel;

GGRC.Components('csvExport', {
  tag: 'csv-export',
  template: csvExportTemplate,
  viewModel: {
    isFilterActive: false,
    'export': new exportModel()
  },
  events: {
    toggleIndicator: function (currentFilter) {
      var isExpression =
          !!currentFilter &&
          !!currentFilter.expression.op &&
          currentFilter.expression.op.name !== 'text_search' &&
          currentFilter.expression.op.name !== 'exclude_text_search';
      this.viewModel.attr('isFilterActive', isExpression);
    },
    '.tree-filter__expression-holder input keyup': function (el, ev) {
      this.toggleIndicator(GGRC.query_parser.parse(el.val()));
    },
    '.option-type-selector change': function (el, ev) {
      this.viewModel.attr('isFilterActive', false);
    },
    getObjectsForExport: function () {
      var panels = this.viewModel.attr('export.panels.items');

      return _.map(panels, function (panel, index) {
        var relevantFilter;
        var predicates;
        var allItems = panel.attr('attributes')
          .concat(panel.attr('mappings'))
          .concat(panel.attr('localAttributes'));

        predicates = _.map(panel.attr('relevant'), function (el) {
          var id = el.model_name === '__previous__' ?
            index - 1 : el.filter.id;
          return id ? '#' + el.model_name + ',' + id + '#' : null;
        });
        if (panel.attr('snapshot_type')) {
          predicates.push(
            ' child_type = ' + panel.attr('snapshot_type') + ' '
          );
        }
        relevantFilter = _.reduce(predicates, function (p1, p2) {
          return p1 + ' AND ' + p2;
        });
        return {
          object_name: panel.type,
          fields: allItems
            .filter((item) => item.isSelected)
            .map((item) => item.key).serialize(),
          filters: GGRC.query_parser.join_queries(
            GGRC.query_parser.parse(relevantFilter || ''),
            GGRC.query_parser.parse(panel.filter || '')
          )
        };
      });
    },
    '#export-csv-button click': function (el, ev) {
      this.viewModel.attr('export.loading', true);

      GGRC.Utils.export_request({
        data: {
          objects: this.getObjectsForExport(),
          export_to: this.viewModel.attr('export.chosenFormat')
        }
      }).then(function (data) {
        var link;

        if (this.viewModel.attr('export.chosenFormat') === 'gdrive') {
          link = 'https://docs.google.com/spreadsheets/d/' + data.id;

          confirm({
            modal_title: 'Export Completed',
            modal_description: 'File is exported successfully. ' +
            'You can view the file here: ' +
            '<a href="' + link + '" target="_blank">' + link + '</a>',
            button_view: GGRC.mustache_path + '/modals/close_buttons.mustache'
          });
        } else {
          GGRC.Utils.download(this.viewModel.attr('export.filename'), data);
        }
      }.bind(this))
      .always(function () {
        this.viewModel.attr('export.loading', false);
      }.bind(this));
    },
    '#addAnotherObjectType click': function (el, ev) {
      ev.preventDefault();
      this.viewModel.attr('export').dispatch('addPanel');
    }
  }
});

exportGroup = GGRC.Components('exportGroup', {
  tag: 'export-group',
  template: exportGroupTemplate,
  viewModel: {
    index: 0,
    'export': '@'
  },
  events: {
    inserted: function () {
      this.addPanel({
        type: url.model_type || 'Program',
        isSnapshots: url.isSnapshots
      });
    },
    addPanel: function (data) {
      var index = this.viewModel.attr('index') + 1;

      data = data || {};
      if (!data.type) {
        data.type = 'Program';
      } else if (data.isSnapshots === 'true') {
        data.snapshot_type = data.type;
        data.type = 'Snapshot';
      }

      this.viewModel.attr('index', index);
      return this.viewModel.attr('panels.items')
        .push(new panelModel(data));
    },
    getIndex: function (el) {
      return Number($(el.closest('export-panel'))
        .viewModel().attr('panel_number'));
    },
    '.remove_filter_group click': function (el, ev) {
      var index = this.getIndex(el);

      ev.preventDefault();
      this.viewModel.attr('panels.items').splice(index, 1);
    },
    '{viewModel.export} addPanel': function () {
      this.addPanel();
    }
  }
});

exportPanel = GGRC.Components('exportPanel', {
  tag: 'export-panel',
  template: exportPanelTemplate,
  viewModel: {
    define: {
      first_panel: {
        type: 'boolean',
        get: function () {
          return Number(this.attr('panel_number')) === 0;
        },
      },
      showAttributes: {
        set: function (newValue, setValue) {
          this.updateIsSelected(
            this.attr('item.attributes'), newValue);

          setValue(newValue);
        },
      },
      showMappings: {
        set: function (newValue, setValue) {
          this.updateIsSelected(
            this.attr('item.mappings'), newValue);

          setValue(newValue);
        },
      },
      showLocalAttributes: {
        set: function (newValue, setValue) {
          this.updateIsSelected(
            this.attr('item.localAttributes'), newValue);

          setValue(newValue);
        },
      },
    },
    exportable: GGRC.Bootstrap.exportable,
    snapshotable_objects: GGRC.config.snapshotable_objects,
    panel_number: '@',
    has_parent: false,
    fetch_relevant_data: function (id, type) {
      var dfd = CMS.Models[type].findOne({id: id});
      dfd.then(function (result) {
        this.attr('item.relevant').push(new filterModel({
          model_name: url.relevant_type,
          value: url.relevant_id,
          filter: result,
        }));
      }.bind(this));
    },
    getModelAttributeDefenitions: function (type) {
      return GGRC.model_attr_defs[type];
    },
    useLocalAttribute: function () {
      return this.attr('item.type') === 'Assessment';
    },
    filterModelAttributes: function (attr, predicate) {
      return predicate &&
        !attr.import_only &&
        attr.display_name.indexOf('unmap:') === -1;
    },
    refreshItems: function () {
      var currentPanel = this.attr('item');
      var definitions = this
        .getModelAttributeDefenitions(currentPanel.attr('type'));
      var localAttributes;

      var attributes = _.filter(definitions, function (el) {
        return this.filterModelAttributes(el,
          el.type !== 'mapping' && el.type !== 'object_custom');
      }.bind(this));

      var mappings = _.filter(definitions, function (el) {
        return this.filterModelAttributes(el, el.type === 'mapping');
      }.bind(this));

      currentPanel.attr('attributes', attributes);
      currentPanel.attr('mappings', mappings);

      if (this.useLocalAttribute()) {
        localAttributes = _.filter(definitions, function (el) {
          return this.filterModelAttributes(el, el.type === 'object_custom');
        }.bind(this));

        currentPanel.attr('localAttributes', localAttributes);
      }
    },
    updateIsSelected: function (items, isSelected) {
      items.forEach(function (item) {
        item.attr('isSelected', isSelected);
      });
    },
    setSelected: function () {
      this.attr('showMappings', true);
      this.attr('showAttributes', true);

      if (this.useLocalAttribute()) {
        this.attr('showLocalAttributes', true);
      }
    },
  },
  events: {
    inserted: function () {
      var panelNumber = Number(this.viewModel.attr('panel_number'));

      if (!panelNumber && url.relevant_id && url.relevant_type) {
        this.viewModel.fetch_relevant_data(url.relevant_id, url.relevant_type);
      }
      this.viewModel.refreshItems();
      this.viewModel.setSelected();
    },
    '[data-action=select_toggle] click': function (el, ev) {
      var type = el.data('type');
      var value = el.data('value');
      var targetList;

      switch (type) {
        case 'local_attributes': {
          targetList = this.viewModel.attr('item.localAttributes');
          break;
        }
        case 'attributes': {
          targetList = this.viewModel.attr('item.attributes');
          break;
        }
        default: {
          targetList = this.viewModel.attr('item.mappings');
        }
      }

      this.viewModel.updateIsSelected(targetList, value);
    },
    '{viewModel.item} type': function () {
      this.viewModel.attr('item.relevant', []);
      this.viewModel.attr('item.filter', '');
      this.viewModel.attr('item.snapshot_type', '');
      this.viewModel.attr('item.has_parent', false);

      if (this.viewModel.attr('item.type') === 'Snapshot') {
        this.viewModel.attr('item.snapshot_type', 'Control');
      }

      this.viewModel.refreshItems();
      this.viewModel.setSelected();
    },
  },
});

export {exportGroup, exportPanel};
