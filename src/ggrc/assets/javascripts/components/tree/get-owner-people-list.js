/*
  Copyright (C) 2017 Google Inc., authors, and contributors <see AUTHORS file>
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const viewModel = can.Map.extend({
  role: '',
  define: {
    allOwners: {
      get: function () {
        const roleId = GGRC.roles
          .find((item) => item.name == this.role).id;
        return this.data
          .filter((item) =>
            item.instance.role && item.instance.role.id == roleId)
          .map((item) => item.instance.person);
      },
    },
  },
});

export default can.Component.extend('getOwnerPeopleList', {
  tag: 'get-owner-people-list',
  template: '<tree-field {source}="allOwners" {field}="\'email\'"/>',
  viewModel,
});
