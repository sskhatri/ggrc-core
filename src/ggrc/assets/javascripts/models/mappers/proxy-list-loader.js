/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import RefreshQueue from '../refresh_queue';

(function (GGRC, can) {
  /*  ProxyListLoader
   *  - handles relationships across join tables
   *
   *  - listens to:
   *      - join_model.created
   *      - join_model.destroyed
   *      - not implemented:
   *        - join_instance.change(object_attr)
   *        - join_instance.change(option_attr)
   */
  GGRC.ListLoaders.BaseListLoader('GGRC.ListLoaders.ProxyListLoader', {}, {
    init: function (modelName, objectAttr, optionAttr, objectJoinAttr,
                    optionModelName) {
      this._super();

      this.model_name = modelName;
      this.object_attr = objectAttr;
      this.option_attr = optionAttr;
      this.object_join_attr = objectJoinAttr;
      this.option_model_name = optionModelName;
    },
    init_listeners: function (binding) {
      var self = this;
      var model = CMS.Models[this.model_name];
      var objectJoinValue = binding.instance[this.object_join_attr];

      binding.instance.bind(this.object_join_attr, function (ev, _new, _old) {
        if (binding._refresh_stubs_deferred &&
          binding._refresh_stubs_deferred.state() !== 'pending') {
          self._refresh_stubs(binding);
        }
      });

      if (objectJoinValue) {
        objectJoinValue.bind('length', function (ev, _new, _old) {
          self._refresh_stubs(binding);
        });
      }

      model.bind('created', function (ev, mapping) {
        if (mapping instanceof model)
          self.filter_and_insert_instances_from_mappings(binding, [mapping]);
      });

      model.bind('destroyed', function (ev, mapping) {
        if (mapping instanceof model)
          self.remove_instance_from_mapping(binding, mapping);
      });

      //  FIXME: This is only needed in DirectListLoader, right?
      model.bind('orphaned', function (ev, mapping) {
        if (mapping instanceof model)
          self.remove_instance_from_mapping(binding, mapping);
      });
    },
    is_valid_mapping: function (binding, mapping) {
      var model = CMS.Models[this.model_name];
      var objectModel = binding.instance.constructor;
      var optionModel = CMS.Models[this.option_model_name];

      return (mapping.constructor === model && mapping[this.object_attr] &&
      (mapping[this.object_attr].reify() === binding.instance ||
      (mapping[this.object_attr].reify().constructor === objectModel &&
      mapping[this.object_attr].id === binding.instance.id)) &&
      (!optionModel || (mapping[this.option_attr] &&
      mapping[this.option_attr].reify() instanceof optionModel)));
    },
    filter_and_insert_instances_from_mappings: function (binding, mappings) {
      var self = this;
      var matchingMappings;

      matchingMappings = can.map(can.makeArray(mappings), function (mapping) {
        if (self.is_valid_mapping(binding, mapping))
          return mapping;
      });
      return this.insert_instances_from_mappings(binding, matchingMappings);
    },
    insert_instances_from_mappings: function (binding, mappings) {
      var self = this;
      var newResults;

      newResults = can.map(can.makeArray(mappings), function (mapping) {
        return self.get_result_from_mapping(binding, mapping);
      });
      this.insert_results(binding, newResults);
    },
    remove_instance_from_mapping: function (binding, mapping) {
      var instance;
      var result;
      if (this.is_valid_mapping(binding, mapping)) {
        instance = this.get_instance_from_mapping(binding, mapping);
        result = this.find_result_from_mapping(binding, mapping);
        if (instance)
          this.remove_instance(binding, instance, result);
      }
    },
    get_result_from_mapping: function (binding, mapping) {
      return this.make_result({
        instance: mapping[this.option_attr].reify(),
        mappings: [{
          instance: mapping,
          mappings: [{
            instance: true,
            mappings: [],
            binding: binding
          }],
          binding: binding
        }]
      });
    },
    get_instance_from_mapping: function (binding, mapping) {
      return mapping[this.option_attr] && mapping[this.option_attr].reify();
    },
    find_result_from_mapping: function (binding, mapping) {
      var mapInd;
      var result;
      var resultInd;
      var mappingResult;

      for (resultInd = 0; resultInd < binding.list.length; resultInd++) {
        result = binding.list[resultInd];
        for (mapInd = 0; mapInd < result.mappings.length; mapInd++) {
          mappingResult = result.mappings[mapInd];
          if (mappingResult.instance === mapping)
            return mappingResult;
        }
      }
    },
    _refresh_stubs: function (binding) {
      var model = CMS.Models[this.model_name];
      var refreshQueue = new RefreshQueue();
      var objectJoinAttr = this.object_join_attr || model.table_plural;

      // These properties only exist if the user has read access
      if (binding.instance[objectJoinAttr]) {
        can.each(binding.instance[objectJoinAttr].reify(), function (mapping) {
          refreshQueue.enqueue(mapping);
        });
      }

      return refreshQueue.trigger()
        .then(this.proxy('filter_for_valid_mappings', binding))
        .then(this.proxy('insert_instances_from_mappings', binding));
    },
    filter_for_valid_mappings: function (binding, mappings) {
      // Remove incomplete mappings, including those not in our context
      //   (which the server refused to provide).
      var i;
      var validMappings = [];

      for (i = 0; i < mappings.length; i++) {
        if (mappings[i][this.option_attr])
          validMappings.push(mappings[i]);
      }
      return validMappings;
    }
  });
})(window.GGRC, window.can);
