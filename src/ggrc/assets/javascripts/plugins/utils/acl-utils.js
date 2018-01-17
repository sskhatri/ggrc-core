/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

/**
 * Compute a list of people IDs that have `roleName` granted on `instance`.
 *
 * @param {CMS.Models.Cacheable} instance - a model instance
 * @param {String} roleName - the name of the custom role
 *
 * @return {Array} - list of people
 */
function peopleWithRoleName(instance, roleName) {
  let modelRoles;
  let peopleIds;
  let roleId;

  // get role ID by roleName
  modelRoles = _.filter(
    GGRC.access_control_roles,
    {object_type: instance.class.model_singular, name: roleName});

  if (modelRoles.length === 0) {
    console.warn('peopleWithRole: role not found for instance type');
    return new can.List([]);
  } else if (modelRoles.length > 1) {
    console.warn('peopleWithRole: found more than a single role');
    // We do not exit, as we have a reasonable fallback - picking
    // the first match.
  }

  roleId = modelRoles[0].id;

  peopleIds = instance.attr('access_control_list')
    .filter((item) => item.ac_role_id === roleId)
    .map((aclItem) => {
      return {
        id: aclItem.person.id,
        type: aclItem.person.type,
        href: aclItem.person.href,
        name: aclItem.person_name,
        email: aclItem.person_email,
      };
    });

  return peopleIds;
}

export {
  peopleWithRoleName,
};
