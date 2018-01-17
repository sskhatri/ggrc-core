/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import component from '../workflow-activate';
import helpers from '../workflow-helpers';
import * as CurrentPageUtils from '../../../../../ggrc/assets/javascripts/plugins/utils/current-page-utils';

describe('GGRC.WorkflowActivate', function () {
  var scope;

  beforeAll(function () {
    scope = component.prototype.scope;
  });

  describe('_activate() method', function () {
    var method;
    var workflow;
    var scopeMock;
    var refreshDfd;
    var saveDfd;
    var saveCycleDfd;
    var initCountsDfd;
    var refreshAllDfd;
    var generateDfd;
    var workflowExtension = {
      countsMap: {
        activeCycles: 'active cycles',
      },
    };
    var cycleMock;

    beforeEach(function () {
      scopeMock = jasmine.createSpyObj('scope',
        ['attr', '_restore_button']);
      method = scope._activate.bind(scopeMock);
      refreshDfd = can.Deferred();
      saveDfd = can.Deferred();
      initCountsDfd = can.Deferred();
      refreshAllDfd = can.Deferred();
      generateDfd = can.Deferred();
      saveCycleDfd = can.Deferred();

      cycleMock = jasmine.createSpyObj('cycle', {
        save: saveCycleDfd,
      });

      workflow = new CMS.Models.Workflow({
        type: 'Workflow',
        unit: 'month',
        context: new CMS.Models.Context({id: 3}),
        next_cycle_start_date: moment(),
      });

      spyOn(workflow, 'refresh')
        .and.returnValue(refreshDfd);
      spyOn(workflow, 'refresh_all')
        .and.returnValue(refreshAllDfd);
      spyOn(workflow, 'save')
        .and.returnValue(saveDfd);

      spyOn(GGRC, 'page_instance')
        .and.returnValue(workflow);
      spyOn(_, 'find')
        .and.returnValue(workflowExtension);
      spyOn(CurrentPageUtils, 'initCounts')
        .and.returnValue(initCountsDfd);
      spyOn(helpers, 'generateCycle')
        .and.returnValue(generateDfd);
      spyOn(CMS.Models, 'Cycle')
        .and.returnValue(cycleMock);
    });

    describe('for recurrent workflow', function () {
      beforeEach(function () {
        method();
      });

      it('should be in waiting state while refresh is in progress',
        function () {
          expect(scopeMock.attr)
            .toHaveBeenCalledWith('waiting', true);
          expect(workflow.refresh)
            .toHaveBeenCalled();
        });

      it('should try to save Workflow as active object after refreshing',
        function () {
          refreshDfd.resolve();
          expect(workflow.attr('recurrences'))
            .toBeTruthy();
          expect(workflow.attr('status'))
            .toBe('Active');
          expect(workflow.save)
            .toHaveBeenCalled();
        });

      it('should try to save Cycle after updating this day Workflow',
        function () {
          refreshDfd.resolve();
          saveDfd.resolve(workflow);

          expect(cycleMock.save)
            .toHaveBeenCalled();
        });

      it('shouldn\'t try to save Cycle after updating this day Workflow',
      function () {
        refreshDfd.resolve();
        workflow.attr('next_cycle_start_date',
          moment().add(1, 'day'));
        saveDfd.resolve(workflow);

        expect(cycleMock.save)
          .not.toHaveBeenCalled();
      });

      it('should try to init counts for active cycles tab after cycle saving',
        function () {
          refreshDfd.resolve();
          saveDfd.resolve(workflow);
          saveCycleDfd.resolve();

          expect(CurrentPageUtils.initCounts)
            .toHaveBeenCalledWith([
              workflowExtension.countsMap.activeCycles,
            ], workflow.type, workflow.id);
        });

      it('should try to refresh TGT after updating counts for active cycles',
        function () {
          refreshDfd.resolve();
          saveDfd.resolve(workflow);
          saveCycleDfd.resolve();
          initCountsDfd.resolve();

          expect(workflow.refresh_all)
            .toHaveBeenCalledWith('task_groups', 'task_group_tasks');
        });

      it('should restore button after TGT refresh', function () {
        refreshDfd.resolve();
        saveDfd.resolve(workflow);
        saveCycleDfd.resolve();
        initCountsDfd.resolve();
        refreshAllDfd.resolve();

        expect(scopeMock._restore_button)
          .toHaveBeenCalled();
      });

      it('should restore button when workflow refresh fails', function () {
        refreshDfd.reject();
        expect(workflow.attr('recurrences'))
          .toBeFalsy();
        expect(workflow.attr('status'))
          .not.toBe('Active');
        expect(scopeMock._restore_button)
          .toHaveBeenCalled();
      });

      it('should restore button when workflow saving fails', function () {
        refreshDfd.resolve();
        saveDfd.reject();
        expect(scopeMock._restore_button)
          .toHaveBeenCalled();
      });

      it('should restore button when cycle generation fails', function () {
        refreshDfd.resolve();
        saveDfd.resolve(workflow);
        saveCycleDfd.reject();
        expect(scopeMock._restore_button)
          .toHaveBeenCalled();
      });

      it('should restore button when counts init fails', function () {
        refreshDfd.resolve();
        saveDfd.resolve(workflow);
        saveCycleDfd.resolve();
        initCountsDfd.reject();
        expect(scopeMock._restore_button)
          .toHaveBeenCalled();
      });

      it('should restore button when counts init fails', function () {
        refreshDfd.resolve();
        saveDfd.resolve(workflow);
        saveCycleDfd.resolve();
        initCountsDfd.resolve();
        refreshAllDfd.reject();
        expect(scopeMock._restore_button)
          .toHaveBeenCalled();
      });
    });

    describe('for one-time workflow', function () {
      beforeEach(function () {
        workflow.attr('unit', null);
        method();
      });

      it('should be in waiting state while cycle generation starts',
        function () {
          expect(scopeMock.attr)
            .toHaveBeenCalledWith('waiting', true);
          expect(helpers.generateCycle)
            .toHaveBeenCalled();
        });

      it('should try to refresh workflow after cycle generation',
        function () {
          generateDfd.resolve();
          expect(workflow.refresh)
            .toHaveBeenCalled();
        });

      it('should try to save workflow as active object after refreshing',
        function () {
          generateDfd.resolve();
          refreshDfd.resolve(workflow);

          expect(workflow.attr('status'))
            .toBe('Active');
          expect(workflow.save)
            .toHaveBeenCalled();
        });

      it('should restore button after workflow saving', function () {
        generateDfd.resolve();
        refreshDfd.resolve(workflow);
        saveDfd.resolve();

        expect(scopeMock._restore_button)
          .toHaveBeenCalled();
      });

      it('should restore button when cycle generation fails', function () {
        generateDfd.reject();
        expect(scopeMock._restore_button)
          .toHaveBeenCalled();
      });

      it('should restore button when workflow refresh fails', function () {
        generateDfd.resolve(workflow);
        refreshDfd.reject();

        expect(scopeMock._restore_button)
          .toHaveBeenCalled();
      });

      it('should restore button when saving fails', function () {
        generateDfd.resolve(workflow);
        refreshDfd.resolve(workflow);
        saveDfd.reject();

        expect(scopeMock._restore_button)
          .toHaveBeenCalled();
      });
    });
  });

  describe('_can_activate_def() method', function () {
    var refreshAllDfd;
    var scopeMock;
    var method;
    var workflow;
    var taskGroups;

    beforeEach(function () {
      taskGroups = new can.List([]);
      scopeMock = jasmine.createSpyObj('scope',
        ['attr']);
      refreshAllDfd = can.Deferred();
      method = scope._can_activate_def.bind(scopeMock);
      workflow = {
        type: 'Workflow',
        refresh_all: jasmine.createSpy('refreshAll')
          .and.returnValue(refreshAllDfd),
        attr: jasmine.createSpy('attr'),
        task_groups: {
          reify: jasmine.createSpy('reify')
            .and.returnValue(taskGroups),
        },
      };

      spyOn(GGRC, 'page_instance')
        .and.returnValue(workflow);
    });

    it('should be in waiting state while refresh is in progress',
      function () {
        method();

        expect(scopeMock.attr)
          .toHaveBeenCalledWith('waiting', true);
        expect(workflow.refresh_all)
          .toHaveBeenCalled();
      });

    it('should allow activation when TGTs for all TGs exist', function () {
      taskGroups.push({
        task_group_tasks: [{id: 1}],
      });

      method();

      refreshAllDfd.resolve();

      expect(scopeMock.attr)
        .toHaveBeenCalledWith('can_activate', 1);
      expect(scopeMock.attr)
        .toHaveBeenCalledWith('waiting', false);
    });

    it('shouldn\'t allow activation when TGTs for all TGs exist', function () {
      taskGroups.push({
        task_group_tasks: [{id: 1}],
      });
      taskGroups.push({
        task_group_tasks: [],
      });

      method();

      refreshAllDfd.resolve();

      expect(scopeMock.attr)
        .toHaveBeenCalledWith('can_activate', false);
      expect(scopeMock.attr)
        .toHaveBeenCalledWith('waiting', false);
    });

    it('should log an error when refresh fails', function () {
      spyOn(console, 'warn');

      method();

      refreshAllDfd.reject({message: 'error occurred'});

      expect(console.warn)
        .toHaveBeenCalledWith('Workflow activate error', 'error occurred');
    });
  });
});
