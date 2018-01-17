/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import RefreshQueue from './refresh_queue';

(function (ns, can) {
  can.Model.Cacheable('CMS.Models.Person', {
    root_object: 'person',
    root_collection: 'people',
    category: 'entities',
    findAll: 'GET /api/people',
    findOne: 'GET /api/people/{id}',
    create: 'POST /api/people',
    update: 'PUT /api/people/{id}',
    destroy: 'DELETE /api/people/{id}',
    search: function (request, response) {
      return can.ajax({
        type: 'get',
        url: '/api/people',
        dataType: 'json',
        data: {s: request.term},
        success: function (data) {
          response(can.$.map(data, function (item) {
            return can.extend({}, item.person, {
              label: item.person.email,
              value: item.person.id
            });
          }));
        }
      });
    },
    is_custom_attributable: true,
    attributes: {
      context: 'CMS.Models.Context.stub',
      modified_by: 'CMS.Models.Person.stub',
      object_people: 'CMS.Models.ObjectPerson.stubs',
      language: 'CMS.Models.Option.stub',
      user_roles: 'CMS.Models.UserRole.stubs',
      name: 'trimmed',
      email: 'trimmedLower',
      custom_attribute_values: 'CMS.Models.CustomAttributeValue.stubs'
    },
    mixins: ['ca_update'],
    defaults: {
      name: '',
      email: '',
      contact: null,
      owners: null
    },
    convert: {
      trimmed: function (val) {
        return (val && val.trim) ? val.trim() : val;
      },
      trimmedLower: function (val) {
        return ((val && val.trim) ? val.trim() : val).toLowerCase();
      }
    },
    serialize: {
      trimmed: function (val) {
        return (val && val.trim) ? val.trim() : val;
      },
      trimmedLower: function (val) {
        return ((val && val.trim) ? val.trim() : val).toLowerCase();
      }
    },
    findInCacheById: function (id) {
      return this.store[id] || this.cache ? this.cache[id] : null;
    },
    findInCacheByEmail: function (email) {
      var result = null;
      var cache = this.store || this.cache || {};
      can.each(Object.keys(cache), function (k) {
        if (cache[k].email === email) {
          result = cache[k];
          return false;
        }
      });
      return result;
    },
    tree_view_options: {
      attr_view: GGRC.mustache_path + '/people/tree-item-attr.mustache',
      add_item_view: GGRC.mustache_path + '/people/tree_add_item.mustache',
      attr_list: [{
        attr_title: 'Name',
        attr_name: 'title',
      }, {
        attr_title: 'Email',
        attr_name: 'email',
      }, {
        attr_title: 'Authorizations',
        attr_name: 'authorizations',
      }, {
        attr_title: 'Last Updated',
        attr_name: 'updated_at',
      }],
      display_attr_names: ['title', 'email', 'authorizations', 'updated_at'],
      disable_columns_configuration: true,
    },
    list_view_options: {
      find_params: {__sort: 'name,email'}
    },
    sub_tree_view_options: {
      default_filter: ['Program', 'Control', 'Risk', 'Assessment'],
    },
    init: function () {
      var rEmail =
        /^[-!#$%&*+\\.\/0-9=?A-Z^_`{|}~]+@([-0-9A-Z]+\.)+([0-9A-Z]){2,4}$/i;
      this._super.apply(this, arguments);

      this.validateNonBlank('email');
      this.validateFormatOf('email', rEmail);
      this.validateNonBlank('name');
    },

    /**
     * @description
     * Retrieves user roles for the person according to
     * instance or/and specific object contexts
     *
     * @param  {Object} instance - Instance object
     * @param  {CMS.Models.Person} person - Person object
     * @param  {String} specificObject - Property of instance object
     * @return {Promise.<Object[]>} - Returns promise with person's user roles
     */

    getUserRoles: function (instance, person, specificObject) {
      var result = $.Deferred();
      var refreshQueue = new RefreshQueue();
      var userRoles;

      can.each(person.user_roles, function (ur) {
        refreshQueue.enqueue(ur.getInstance());
      });

      refreshQueue.trigger().then(function (roles) {
        var object;
        var objectInstance;
        var objectContextId;

        userRoles = _.filter(roles, function (role) {
          return instance.context && role.context &&
            role.context.id === instance.context.id;
        });

        if (_.isEmpty(userRoles) && !_.isEmpty(specificObject)) {
          object = _.get(instance, specificObject);
          objectInstance = _.result(object, 'getInstance');
          objectContextId = _.get(objectInstance, 'context_id');

          userRoles = _.filter(roles, function (role) {
            return role.context && role.context.id === objectContextId;
          });
        }

        result.resolve(userRoles);
      });
      return result.promise();
    },
    getPersonMappings: function (instance, person, specificObject) {
      var result = $.Deferred();
      var mappingObject = instance[specificObject];
      var mappingsRQ = new RefreshQueue();
      var userRolesRQ = new RefreshQueue();

      can.each(mappingObject, function (obj) {
        mappingsRQ.enqueue(obj);
      });

      mappingsRQ.trigger().then(function (objects) {
        var userRoles;
        var objectPeopleFiltered = _.filter(objects, function (item) {
          return item.person && item.person.id === person.id;
        });

        userRoles = _.filter(person.user_roles, function (item) {
          item = item.getInstance();
          return instance.context && item.context_id === instance.context.id;
        }).map(function (item) {
          return item.reify();
        });

        userRoles = userRoles.concat(objectPeopleFiltered);

        can.each(userRoles, function (obj) {
          userRolesRQ.enqueue(obj);
        });

        return userRolesRQ.trigger();
      }).then(function (userRoles) {
        result.resolve(userRoles);
      });
      return result.promise();
    }
  }, {
    display_name: function () {
      return this.email;
    },
    autocomplete_label: function () {
      return this.name ?
      this.name + '<span class="url-link">' + this.email + '</span>' :
        this.email;
    },
    getWidgetCountForMyWorkPage: function () {
      let url = `/api/people/${this.attr('id')}/my_work_count`;
      return $.get(url);
    },
    getWidgetCountForAllObjectPage: function () {
      let url = `/api/people/${this.attr('id')}/all_objects_count`;
      return $.get(url);
    },
    getTasksCount: function () {
      let url = `/api/people/${this.attr('id')}/task_count`;
      return $.get(url)
        .fail(() => console.warn(`Request on '${url}' failed!`));
    },
  });
})(window, can);
