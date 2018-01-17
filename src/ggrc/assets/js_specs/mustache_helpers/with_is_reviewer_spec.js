/* !
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Permission from '../../javascripts/permission';

describe('can.mustache.helper.with_is_reviewer', function () {
  var fakeOptions;
  var helper;
  var assigneeRole;

  beforeAll(function () {
    fakeOptions = {
      fn: jasmine.createSpy(),
      contexts: {
        add: jasmine.createSpy(),
      },
    };

    helper = can.Mustache._helpers['with_is_reviewer'].fn;

    assigneeRole = {
      id: -1,
    };
    spyOn(_, 'find').and.returnValue(assigneeRole);
  });

  describe('calls options.contexts.add with specified value', function () {
    it('is {is_reviewer: false} when review_task is not set',
      function () {
        helper(false, fakeOptions);
        expect(fakeOptions.contexts.add)
          .toHaveBeenCalledWith({is_reviewer: false});
      }
    );

    it('is {is_reviewer: true} when user is Admin',
      function () {
        spyOn(Permission, 'is_allowed').and.returnValue(true);
        helper({contact: {id: 12345}}, fakeOptions);
        expect(fakeOptions.contexts.add)
          .toHaveBeenCalledWith({is_reviewer: true});
      }
    );

    it('is {is_reviewer: false} when ACL person does not match current user',
      function () {
        var instance = [{
          access_control_list: {
            ac_role_id: assigneeRole.id,
            person: {
              id: 12345,
            },
          },
        }];
        spyOn(Permission, 'is_allowed').and.returnValue(false);
        helper(instance, fakeOptions);
        expect(fakeOptions.contexts.add)
          .toHaveBeenCalledWith({is_reviewer: false});
      }
    );

    it('is {is_reviewer: false} when ACL role non-Task Assignees for user',
      function () {
        var instance = [{
          access_control_list: {
            ac_role_id: 12,
            person: {
              id: 12345,
            },
          },
        }];
        spyOn(Permission, 'is_allowed').and.returnValue(false);
        helper(instance, fakeOptions);
        expect(fakeOptions.contexts.add)
          .toHaveBeenCalledWith({is_reviewer: false});
      }
    );

    it('is {is_reviewer: true} when ACL person role matches current user',
      function () {
        var instance = [{
          access_control_list: {
            ac_role_id: assigneeRole.id,
            person: {
              id: 1,
            },
          },
        }];
        spyOn(Permission, 'is_allowed').and.returnValue(false);
        // GGRC.current_user.id is 1 in testing environment
        helper(instance, fakeOptions);
        expect(fakeOptions.contexts.add)
          .toHaveBeenCalledWith({is_reviewer: true});
      }
    );
  });
});
