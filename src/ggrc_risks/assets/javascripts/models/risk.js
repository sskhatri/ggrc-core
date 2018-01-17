/*
 * Copyright (C) 2017 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can) {
  'use strict';

  can.Model.Cacheable('CMS.Models.Risk', {
    root_object: 'risk',
    root_collection: 'risks',
    category: 'risk',
    findAll: 'GET /api/risks',
    findOne: 'GET /api/risks/{id}',
    create: 'POST /api/risks',
    update: 'PUT /api/risks/{id}',
    destroy: 'DELETE /api/risks/{id}',
    mixins: [
      'unique_title',
      'ca_update',
      'accessControlList',
      'base-notifications',
    ],
    is_custom_attributable: true,
    isRoleable: true,
    attributes: {
      context: 'CMS.Models.Context.stub',
      modified_by: 'CMS.Models.Person.stub',
      objects: 'CMS.Models.get_stubs',
      risk_objects: 'CMS.Models.RiskObject.stubs',
      custom_attribute_values: 'CMS.Models.CustomAttributeValue.stubs',
    },
    tree_view_options: {
      add_item_view:
        GGRC.mustache_path + '/base_objects/tree_add_item.mustache',
      attr_view: GGRC.mustache_path + '/base_objects/tree-item-attr.mustache',
      attr_list: can.Model.Cacheable.attr_list.concat([
        {attr_title: 'Reference URL', attr_name: 'reference_url'},
        {attr_title: 'Last Deprecated Date', attr_name: 'end_date'}
      ])
    },
    sub_tree_view_options: {
      default_filter: ['Control'],
    },
    defaults: {
      status: 'Draft'
    },
    statuses: ['Draft', 'Deprecated', 'Active'],
    init: function () {
      var reqFields = ['title', 'description'];
      if (this._super) {
        this._super.apply(this, arguments);
      }
      reqFields.forEach(function (reqField) {
        this.validatePresenceOf(reqField);
      }.bind(this));
    }
  }, {});
})(window.can);
