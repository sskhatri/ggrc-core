/*
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  peopleWithRoleName,
} from '../../plugins/utils/acl-utils';

describe('ACL utils peopleWithRoleName() method', () => {
  let instance;
  let origRoleList;

  beforeAll(() => {
    origRoleList = GGRC.access_control_roles;
    GGRC.access_control_roles = [
      {id: 5, name: 'Role A', object_type: 'Market'},
      {id: 9, name: 'Role A', object_type: 'Audit'},
      {id: 1, name: 'Role B', object_type: 'Market'},
      {id: 7, name: 'Role A', object_type: 'Policy'},
      {id: 3, name: 'Role B', object_type: 'Audit'},
      {id: 2, name: 'Role B', object_type: 'Policy'},
    ];
  });

  afterAll(() => {
    GGRC.access_control_roles = origRoleList;
  });

  beforeEach(() => {
    const acl = [
      {person: {id: 3}, ac_role_id: 1},
      {person: {id: 5}, ac_role_id: 3},
      {person: {id: 6}, ac_role_id: 9},
      {person: {id: 2}, ac_role_id: 3},
      {person: {id: 7}, ac_role_id: 9},
      {person: {id: 5}, ac_role_id: 2},
      {person: {id: 9}, ac_role_id: 9},
    ];

    instance = new can.Map({
      id: 42,
      type: 'Audit',
      'class': {model_singular: 'Audit'},
      access_control_list: acl,
    });
  });

  it('returns users that have a role granted on a particular instance', () => {
      const result = peopleWithRoleName(instance, 'Role B');
      expect(can.makeArray(result.map((person) => person.id).sort()))
        .toEqual([2, 5]);
    }
  );

  it('returns empty array if role name not found', () => {
    const result = peopleWithRoleName(instance, 'Role X');
    expect(can.makeArray(result)).toEqual([]);
  });

  it('returns empty array if no users are granted a particular role', () => {
      let result;

      instance.attr('type', 'Policy');
      instance.attr('class.model_singular', 'Policy');

      result = peopleWithRoleName(instance, 'Role A');

      expect(can.makeArray(result)).toEqual([]);
    }
  );
});
