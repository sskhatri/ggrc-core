/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import RefreshQueue from '../refresh_queue';

describe('CMS.Models.Person', function () {
  'use strict';

  describe('getUserRoles() method', function () {
    var method;
    var person;
    var fakeUserRole1;
    var fakeUserRole2;
    var fakeUserRoleInstace1;
    var fakeUserRoleInstace2;
    var instance;
    var refreshedUserRoles = [];
    var fakeProgramInstance;

    beforeEach(function () {
      fakeProgramInstance = jasmine.createSpyObj(
        'fakeProgramInstance', ['getInstance']
      );
      fakeProgramInstance.getInstance.and.returnValue({
        context_id: 666
      });
      instance = {
        context: {
          id: 444
        },
        program: fakeProgramInstance
      };
      person = new CMS.Models.Person();
      method = CMS.Models.Person.getUserRoles;
      fakeUserRole1 = jasmine.createSpyObj('fakeUserRole', ['getInstance']);
      fakeUserRole2 = jasmine.createSpyObj('fakeUserRole', ['getInstance']);
      fakeUserRoleInstace1 = {id: 1};
      fakeUserRoleInstace2 = {id: 2};
      fakeUserRole1.getInstance.and.returnValue(fakeUserRoleInstace1);
      fakeUserRole2.getInstance.and.returnValue(fakeUserRoleInstace2);
      person.user_roles = [fakeUserRole1, fakeUserRole2];
    });

    it('should enqueue user roles instances for refresh', function () {
      var dfd = $.when();
      spyOn(RefreshQueue.prototype, 'enqueue');
      spyOn(RefreshQueue.prototype, 'trigger').and.returnValue(dfd);
      method(instance, person);
      expect(RefreshQueue.prototype.enqueue.calls.count()).toEqual(2);
      expect(RefreshQueue.prototype.enqueue)
        .toHaveBeenCalledWith(fakeUserRoleInstace1);
      expect(RefreshQueue.prototype.enqueue)
        .toHaveBeenCalledWith(fakeUserRoleInstace2);
    });

    it('should apply a filter to user roles based on ' +
      'the instance and role contexts after refresh',
      function (done) {
        var dfd;
        refreshedUserRoles = [{
          context: {
            id: 444
          }
        }, {
          context: {
            id: 555
          }
        }];
        dfd = $.when(refreshedUserRoles);
        spyOn(RefreshQueue.prototype, 'enqueue');
        spyOn(RefreshQueue.prototype, 'trigger').and.returnValue(dfd);
        method(instance, person).then(function (roles) {
          expect(roles).toEqual([refreshedUserRoles[0]]);
          done();
        });
      }
    );

    describe('when specificObject is passed', function () {
      var specificObject;

      beforeEach(function () {
        specificObject = 'program';
        refreshedUserRoles = [{
          context: {
            id: 555
          }
        }, {
          context: {
            id: 666
          }
        }];
      });

      it('should apply a filter to user roles based on ' +
        'the specificObject and role contexts after refresh' +
        'if all user roles were rejected for the instance context',
        function (done) {
          var dfd = $.when(refreshedUserRoles);
          var validateExpectation = function (roles) {
            expect(roles).toEqual([refreshedUserRoles[1]]);
            done();
          };
          spyOn(RefreshQueue.prototype, 'enqueue');
          spyOn(RefreshQueue.prototype, 'trigger').and.returnValue(dfd);
          method(instance, person, specificObject).then(validateExpectation);
        }
      );
    });
  });
});
