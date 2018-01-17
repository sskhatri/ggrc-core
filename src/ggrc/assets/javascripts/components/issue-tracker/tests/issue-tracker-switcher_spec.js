/* !
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../issue-tracker-switcher';

describe('GGRC.Components.issueTrackerSwitcher', () => {
  let viewModel;
  
  beforeAll(() => {
    viewModel = new (can.Map.extend(Component.prototype.viewModel));
  });

  describe('"convertToBool" method', () => {
    let convertToBoolMethod;
    
    beforeAll(() => {
      convertToBoolMethod = viewModel.convertToBool;
    });

    it('should convert empty string to FALSE', () => {
      let result = convertToBoolMethod('');
      expect(result).toBeFalsy();
    });

    it('should convert "false" string to FALSE', () => {
      let result = convertToBoolMethod('false');
      expect(result).toBeFalsy();
    });

    it('should not convert boolean. FALSE', () => {
      let result = convertToBoolMethod(false);
      expect(result).toBeFalsy();
    });

    it('should not convert boolean. TRUE', () => {
      let result = convertToBoolMethod(true);
      expect(result).toBeTruthy();
    });

    it('should convert "true" string to TRUE', () => {
      let result = convertToBoolMethod('true');
      expect(result).toBeTruthy();
    });

    it('should convert non empty string to TRUE', () => {
      let result = convertToBoolMethod('hello world');
      expect(result).toBeTruthy();
    });
  });

  describe('"setDefaultIssueTitle" method', () => {
    let setDefaultIssueTitle;
    let instance;
    let issueTracker;
    
    beforeEach(() => {
      instance = {
        issue_tracker: {
          enabled: true,
          title: '',
        },
        title: 'My Assessment',
        type: 'Assessment'
      };

      setDefaultIssueTitle = viewModel.setDefaultIssueTitle
        .bind(viewModel);
    });

    it('should set value from instance. issue title is empty', () => {
      viewModel.attr('instance', instance);
      setDefaultIssueTitle();

      expect(viewModel.attr('instance.issue_tracker.title'))
        .toEqual(viewModel.attr('instance.title'));
    });

    it('should not set value from instance. issue title is not empty',
      () => {
        let issueTitle = 'my title';
        instance.issue_tracker.title = issueTitle;
        viewModel.attr('instance', instance);

        setDefaultIssueTitle();

        expect(viewModel.attr('instance.issue_tracker.title'))
          .toEqual(issueTitle);
      }
    );

    it('should set value from "defaultTitle". issue title is empty', () => {
      viewModel.attr('instance', instance);
      setDefaultIssueTitle();

      expect(viewModel.attr('instance.issue_tracker.title'))
        .toEqual(viewModel.attr('instance.title'));
    });

    it('should set value from "defaultTitle". issue title is not empty',
      () => {
        let issueTitle = 'my title';
        instance.issue_tracker.title = issueTitle;
        viewModel.attr('instance', instance);

        setDefaultIssueTitle();

        expect(viewModel.attr('instance.issue_tracker.title'))
          .toEqual(issueTitle);
      }
    );
  });
});
