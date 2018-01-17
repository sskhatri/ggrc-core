/* !
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {ApprovalWorkflow as Model} from '../approval-workflow-modal';

describe('ApprovalWorkflow', function () {
  describe('save() method', function () {
    var method;
    var originalObject;
    var awsDfd;
    var acrOldValues;
    var userOldValue;
    var currentUser;
    var assigneeRole;

    beforeAll(function () {
      assigneeRole = {
        object_type: 'TaskGroupTask',
        name: 'Task Assignees',
        id: -10,
      };
      currentUser = new can.Map({
        email: 'test@example.com',
        name: 'Test User',
        id: -11,
      });

      acrOldValues = GGRC.access_control_roles;
      GGRC.access_control_roles = [assigneeRole];

      userOldValue = GGRC.current_user;
      GGRC.current_user = currentUser;
    });

    afterAll(function () {
      GGRC.access_control_roles = acrOldValues;
      GGRC.current_user = userOldValue;
    });

    beforeEach(function () {
      var awBinding;
      var instance;

      awsDfd = new can.Deferred();
      awBinding = {
        refresh_list: jasmine.createSpy().and.returnValue(awsDfd),
      };
      originalObject = {
        get_binding: jasmine.createSpy().and.returnValue(awBinding),
        refresh: jasmine.createSpy(),
      };

      instance = new Model({
        original_object: originalObject,
        contact: currentUser,
      });
      spyOn(instance.original_object, 'reify');

      method = Model.prototype.save.bind(instance);
    });

    describe('no approval Workflow', function () {
      var saveWfDfd;
      var saveTgDfd;
      var saveTgtDfd;
      var saveTgoDfd;
      var saveCycleDfd;

      beforeEach(function () {
        saveWfDfd = new can.Deferred();
        saveTgDfd = new can.Deferred();
        saveTgtDfd = new can.Deferred();
        saveTgoDfd = new can.Deferred();
        saveCycleDfd = new can.Deferred();

        spyOn(CMS.Models, 'Workflow')
          .and.returnValue({
            save: jasmine.createSpy().and.returnValue(saveWfDfd),
          });
        spyOn(CMS.Models, 'TaskGroup')
          .and.returnValue({
            save: jasmine.createSpy().and.returnValue(saveTgDfd),
          });
        spyOn(CMS.Models, 'TaskGroupTask')
          .and.returnValue({
            save: jasmine.createSpy().and.returnValue(saveTgDfd),
          });
        spyOn(CMS.Models, 'TaskGroupObject')
          .and.returnValue({
            save: jasmine.createSpy().and.returnValue(saveTgoDfd),
          });
        spyOn(CMS.Models, 'Cycle')
          .and.returnValue({
            save: jasmine.createSpy().and.returnValue(saveCycleDfd),
          });

        method();
        awsDfd.resolve([]);
      });

      it('creates an appropriate Workflow', function () {
        expect(CMS.Models.Workflow).toHaveBeenCalledWith({
          unit: null,
          status: 'Active',
          title: jasmine.any(String),
          object_approval: true,
          notify_on_change: true,
          notify_custom_message: jasmine.any(String),
          context: undefined,
        });
      });

      it('creates an appropriate TaskGroup', function () {
        var wf = {};

        saveWfDfd.resolve(wf);

        expect(CMS.Models.TaskGroup).toHaveBeenCalledWith({
          workflow: wf,
          title: jasmine.any(String),
          contact: currentUser,
          context: undefined,
        });
      });

      it('creates an appropriate TaskGroupTask', function () {
        var wf = {};
        var tg = {};

        saveWfDfd.resolve(wf);
        saveTgDfd.resolve(tg);

        expect(CMS.Models.TaskGroupTask).toHaveBeenCalledWith({
          task_group: tg,
          start_date: jasmine.any(String),
          end_date: undefined,
          object_approval: true,
          sort_index: jasmine.any(String),
          access_control_list: [{
            ac_role_id: assigneeRole.id,
            person: {
              id: currentUser.id,
              type: 'Person',
            },
          }],
          context: undefined,
          task_type: 'text',
          title: jasmine.any(String),
        });
      });

      it('creates an appropriate TaskGroupObject', function () {
        var tg = {};
        var wf = new can.Map({
          context: {},
        });

        saveWfDfd.resolve(wf);
        saveTgDfd.resolve(tg);

        expect(CMS.Models.TaskGroupObject).toHaveBeenCalledWith({
          task_group: tg,
          object: jasmine.any(Object),
          context: wf.context,
        });
      });

      it('creates an appropriate Cycle', function () {
        var tg = {};
        var wf = {
          context: {},
        };

        saveWfDfd.resolve(wf);
        saveTgDfd.resolve(tg);
        saveTgtDfd.resolve({});
        saveTgoDfd.resolve({});

        expect(CMS.Models.Cycle).toHaveBeenCalledWith({
          workflow: wf,
          autogenerate: true,
          context: wf.context,
        });
      });

      it('reloads original object', function () {
        var tg = {};
        var wf = {
          context: {},
        };

        saveWfDfd.resolve(wf);
        saveTgDfd.resolve(tg);
        saveTgtDfd.resolve();
        saveTgoDfd.resolve();
        saveCycleDfd.resolve();

        expect(originalObject.refresh).toHaveBeenCalled();
      });
    });

    describe('couple of approval Workflows', function () {
      var aws;
      var tgt;
      var tg;
      var saveTgDfd;
      var saveTgtDfd;
      var refreshTgtDfd;
      var saveCycleDfd;
      var awInstance;

      beforeEach(function () {
        saveTgDfd = can.Deferred();
        saveTgtDfd = can.Deferred();
        refreshTgtDfd = can.Deferred();
        saveCycleDfd = can.Deferred();

        tgt = new can.Map({
          refresh: null,
          save: null,
        });
        spyOn(tgt, 'refresh').and.returnValue(refreshTgtDfd);
        spyOn(tgt, 'save').and.returnValue(saveTgtDfd);

        tg = new can.Map({
          task_group_tasks: {
            reify: null,
          },
          save: null,
          refresh: null,
        });
        spyOn(tg, 'refresh').and.returnValue(tg);
        spyOn(tg, 'save').and.returnValue(saveTgDfd);
        spyOn(tg.task_group_tasks, 'reify').and.returnValue([tgt]);

        awInstance = {
          refresh: null,
          task_groups: {
            reify: jasmine.createSpy().and.returnValue([tg]),
          },
        };
        spyOn(awInstance, 'refresh').and.returnValue(awInstance);

        aws = [{
          instance: awInstance,
        }, {
          instance: {
            refresh: jasmine.createSpy(),
          },
        }];

        spyOn(CMS.Models, 'Cycle')
          .and.returnValue({
            save: jasmine.createSpy().and.returnValue(saveCycleDfd),
          });

        method();
        awsDfd.resolve(aws);
      });

      it('refreshes first Approval WF and TGs only', function () {
        expect(aws[0].instance.refresh).toHaveBeenCalled();
        expect(aws[0].instance.task_groups.reify).toHaveBeenCalled();
        expect(tg.refresh).toHaveBeenCalled();
        expect(aws[1].instance.refresh).not.toHaveBeenCalled();
      });

      it('updates contact for TGs', function () {
        expect(tg.attr('contact')).toEqual(currentUser);
      });

      it('updates TGs contact', function () {
        expect(tg.attr('contact')).toEqual(currentUser);
      });

      it('updates TGTs ACL', function () {
        saveTgDfd.resolve(tg);
        refreshTgtDfd.resolve(tgt);

        expect(tgt.attr('access_control_list.0.ac_role_id'))
          .toEqual(assigneeRole.id);
        expect(tgt.attr('access_control_list.0.person.id'))
          .toEqual(currentUser.id);
        expect(tgt.attr('access_control_list.0.person.type'))
          .toEqual('Person');
      });

      it('creates an appropriate Cycle', function () {
        saveTgDfd.resolve(tg);
        refreshTgtDfd.resolve(tgt);
        saveTgtDfd.resolve();

        expect(CMS.Models.Cycle).toHaveBeenCalledWith({
          workflow: awInstance,
          autogenerate: true,
          context: undefined,
        });
      });

      it('reloads original object', function () {
        saveTgDfd.resolve(tg);
        refreshTgtDfd.resolve(tgt);
        saveTgtDfd.resolve();
        saveCycleDfd.resolve();

        expect(originalObject.refresh).toHaveBeenCalled();
      });
    });
  });
});
