/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getModelByType} from '../../plugins/utils/models-utils';
import * as businessModels from '../business-models';
import Permission from '../../permission';

/*
  class Mappings
  represents everything known about how GGRC objects connect to each other.

  a Mappings instance contains the set of known mappings.
  The set of all Mappings instances is used throughout the
  system to build widgets, map and unmap objects, etc.
*/
export default can.Construct.extend({
  config: null,
  getTypeGroups: function () {
    return {
      entities: {
        name: 'People/Groups',
        items: [],
      },
      scope: {
        name: 'Scope',
        items: [],
      },
      governance: {
        name: 'Governance',
        items: [],
      },
    };
  },

  /**
   * Return list of allowed for mapping models.
   * Performs checks for
   * @param {String} type - base model type
   * @param {Array} include - array of included models
   * @param {Array} exclude - array of excluded models
   * @return {Array} - list of allowed for mapping Models
   */
  getMappingList: function (type) {
    if (!type) {
      return [];
    }

    let allowedToMap = this.getAllowedToMapModels(type);
    let externalMap = this.getExternalMapModels(type);

    return _.keys(Object.assign({}, allowedToMap, externalMap));
  },
  /**
   * Determine if two types of models can be mapped
   *
   * @param {String} target - the target type of model
   * @param {String} source - the source type of model
   *
   * @return {Boolean} - true if mapping is allowed, false otherwise
   */
  isMappableType: function (target, source) {
    if (!target || !source) {
      return false;
    }
    let result = this.getMappingList(target);
    return _.includes(result, source);
  },
  /**
   * Determine if `target` is allowed to be mapped to `source`.
   *
   * @param {Object} source - the source object the mapping
   * @param {Object} target - the target object of the mapping
   * @param {Object} options - the options objects, similar to the one that is
   *   passed as an argument to helpers
   *
   * @return {Boolean} - true if mapping is allowed, false otherwise
   */
  allowedToMap: function (source, target, options) {
    let targetType = this._getType(target);
    let sourceType = this._getType(source);

    // special check for snapshot:
    if (options &&
      options.context &&
      options.context.parent_instance &&
      options.context.parent_instance.snapshot) {
      // Avoid add mapping for snapshot
      return false;
    }

    if (!this.isMappableType(sourceType, targetType)) {
      return false;
    }

    let targetContext = _.exists(target, 'context.id');
    let sourceContext = _.exists(source, 'context.id');
    let createContexts = _.exists(
      GGRC, 'permissions.create.Relationship.contexts');

    let canMap = Permission.is_allowed_for('update', source) ||
      _.includes(createContexts, sourceContext) ||
      // Also allow mapping to source if the source is about to be created.
      _.isUndefined(source.created_at);

    if (target instanceof can.Map && targetType) {
      canMap = canMap &&
        (Permission.is_allowed_for('update', target) ||
          _.includes(createContexts, targetContext));
    }
    return canMap;
  },
  /**
   * Determine if `target` is allowed to be unmapped from `source`.
   *
   * @param {Object} source - the source object the mapping
   * @param {Object} target - the target object of the mapping
   *
   * @return {Boolean} - true if unmapping is allowed, false otherwise
   */
  allowedToUnmap: function (source, target) {
    let sourceType = this._getType(source);
    let targetType = this._getType(target);

    let unmappableTypes = _.keys(this.getAllowedToUnmapModels(sourceType));
    if (!_.includes(unmappableTypes, targetType)) {
      return false;
    }

    let canUnmap = Permission.is_allowed_for('update', source);

    if (target instanceof can.Map && targetType) {
      canUnmap = canUnmap && Permission.is_allowed_for('update', target);
    }
    return canUnmap;
  },
  _getType: function (object) {
    let type;

    if (object instanceof can.Model) {
      type = object.constructor.model_singular;
    } else {
      type = object.type || object;
    }

    if (type === 'Snapshot') {
      type = object.child_type; // check Snapshot original object type
    }

    return type;
  },
  /**
   * Return list of allowed for mapping types.
   * Performs checks for
   * @param {String} type - base model type
   * @return {Array} - list of allowed for mapping Models
   */
  getMappingTypes: function (type) {
    let list = this.getMappingList(type);
    return this.groupTypes(list);
  },
  /**
   * Return allowed for mapping type in appropriate group.
   * @param {String} type - base model type
   * @return {Array} - object with one allowed for mapping Model
   */
  getMappingType: function (type) {
    return this.groupTypes([type]);
  },
  /**
   * Returns the list of allowed direct mapping models
   * with possible related mapping models
   * @param {String} type - base model type
   * @return {Array} - list of available mappings
   */
  getAvailableMappings(type) {
    let allowedToMap = this.getAllowedToMapModels(type);
    let related = this.getIndirectlyMappedModels(type);
    let externalMap = this.getExternalMapModels(type);

    return Object.assign({}, allowedToMap, related, externalMap);
  },
  /**
   * Return grouped types.
   * @param {Array} types - array of base model types
   * @return {Array} - object with one allowed for mapping Model
   */
  groupTypes(types) {
    let groups = this.getTypeGroups();

    types.forEach((modelName) => {
      return this._addFormattedType(modelName, groups);
    });

    _.forEach(groups, (group) => {
      group.items = _.sortBy(group.items, 'name');
    });

    return groups;
  },
  /**
   * Returns cmsModel fields in required format.
   * @param {can.Model} cmsModel - cms model
   * @return {object} - cms model in required format
   */
  _prepareCorrectTypeFormat: function (cmsModel) {
    return {
      category: cmsModel.category,
      name: cmsModel.title_plural,
      value: cmsModel.model_singular,
    };
  },
  /**
   * Adds model to correct group.
   * @param {string} modelName - model name
   * @param {object} groups - type groups
   */
  _addFormattedType: function (modelName, groups) {
    let cmsModel = getModelByType(modelName);
    if (!cmsModel || !cmsModel.title_singular) {
      return;
    }
    let type = this._prepareCorrectTypeFormat(cmsModel);
    let group = !groups[type.category] ?
      groups.governance :
      groups[type.category];

    group.items.push(type);
  },
  /*
    return all mappings for an object type.
    object - a string representing the object type's shortName

    return: a keyed object of all mappings (instances of GGRC.ListLoaders.BaseListLoader) by mapping name
    Example: Mappings.getMappingsFor('Program')
  */
  getMappingsFor: function (object) {
    let mappings = {};
    let objectConfig = this.config[object];
    if (objectConfig && objectConfig.mappers) {
      _.forEach(objectConfig.mappers, function (mapping, mappingName) {
        mappings[mappingName] = mapping;
      });
    }
    return mappings;
  },
  /*
    return all allowed mappings (suitable for joining) for an object type.
    object - a string representing the object type's shortName

    return: a keyed object of all mappings (instances of Cacheable)
  */
  getAllowedToMapModels: function (object) {
    return this._getModelsFromConfig(object, 'map');
  },
  /**
   * Returns collection of models allowed for unmapping
   * @param {String} object - the object type's shortName
   * @return {Object} a keyed object of allowed for unmapping models
   */
  getAllowedToUnmapModels(object) {
    return this._getModelsFromConfig(object, 'unmap');
  },
  _getModelsFromConfig(object, prop) {
    let mappings = {};
    let config = this.config;
    if (config[object] && config[object][prop]) {
      _.forEach(config[object][prop],
        (model) => {
          mappings[model] = businessModels[model];
        });
    }
    return mappings;
  },
  getMapper: function (mappingName, type) {
    let mappers = this.getMappingsFor(type);
    if (mappers) {
      return mappers[mappingName];
    }
  },
  _getBindingAttr: function (mapper) {
    if (typeof (mapper) === 'string') {
      return '_' + mapper + '_binding';
    }
  },
  getBinding: function (mapper, model) {
    let binding;
    let bindingAttr = this._getBindingAttr(mapper);

    if (bindingAttr) {
      binding = model[bindingAttr];
    }

    if (!binding) {
      if (typeof (mapper) === 'string') {
      // Lookup and attach named mapper
        let mapping = this.getMapper(mapper, model.constructor.model_singular);
        if (!mapping) {
          console.warn(
            `No such mapper: ${model.constructor.model_singular}.${mapper}`);
        } else {
          binding = mapping.attach(model);
        }
      } else if (mapper instanceof GGRC.ListLoaders.BaseListLoader) {
      // Loader directly provided, so just attach
        binding = mapper.attach(model);
      } else {
        console.warn(`Invalid mapper specified: ${mapper}`);
      }
      if (binding && bindingAttr) {
        model[bindingAttr] = binding;
        binding.name = model.constructor.model_singular + '.' + mapper;
      }
    }
    return binding;
  },
  /*
    return all possible indirectly mapped models for an object type.
    object - a string representing the object type's shortName

    return: a keyed object of all related mappings (instances of Cacheable)
  */
  getIndirectlyMappedModels(object) {
    return this._getModelsFromConfig(object, 'indirectMappings');
  },
  /**
   * Returns object with models which can be mapped externally only
   * @param {string} object model name
   * @return {Object} allowed for external mapping models
   */
  getExternalMapModels(object) {
    return this._getModelsFromConfig(object, 'externalMap');
  },
  shouldBeMappedExternally(source, destination) {
    let externalMappings = this.getExternalMapModels(source);
    return _.keys(externalMappings).includes(destination);
  },
}, {
  init: function (definitions) {
    if (this.constructor.config) {
      throw new Error('Mappings are already initialized.');
    }

    this.constructor.config = definitions;
  },
});
