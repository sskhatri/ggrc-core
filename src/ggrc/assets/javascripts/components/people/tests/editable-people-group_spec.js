/*
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../editable-people-group';

describe('GGRC.Components.editablePeopleGroup', function () {
  'use strict';

  var viewModel;
  var peopleItems = [
    {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6},
  ];

  beforeEach(function () {
    viewModel = new Component.prototype.viewModel;
    viewModel.attr('editableMode', false);
  });

  describe('"showSeeMoreLink" property', function () {
    it(`"showSeeMoreLink" should be FALSE.
        edit mode is true, can edit is true`,
    function () {
      viewModel.attr('people', peopleItems);
      viewModel.attr('canEdit', true);
      viewModel.attr('editableMode', true);
      expect(viewModel.attr('showSeeMoreLink')).toBe(false);
    });

    it(`"showSeeMoreLink" should be TRUE.
        edit mode is false, can edit is true`,
    function () {
      viewModel.attr('people', peopleItems);
      viewModel.attr('canEdit', true);
      expect(viewModel.attr('showSeeMoreLink')).toBe(true);
    });

    it(`"showSeeMoreLink" should be FALSE.
        edit mode is false, can edit is false, saving is not in progress`,
    function () {
      viewModel.attr('people', peopleItems);
      viewModel.attr('canEdit', false);
      viewModel.attr('updatableGroupId', null);
      expect(viewModel.attr('showSeeMoreLink')).toBe(false);
    });

    it('"showSeeMoreLink" should be FALSE. People length less than 5',
      function () {
        // get 4 persons
        var people = peopleItems.slice(0, 4);
        viewModel.attr('people', people);
        viewModel.attr('canEdit', true);

        expect(viewModel.attr('showSeeMoreLink')).toBe(false);
      }
    );
  });

  describe('"showPeopleGroupModal" property', function () {
    it('"showPeopleGroupModal" should be FALSE. People length less than 5',
      function () {
        // get 4 persons
        var people = peopleItems.slice(0, 4);
        viewModel.attr('people', people);

        // trigger editableMode setter
        viewModel.attr('editableMode', true);

        expect(viewModel.attr('showPeopleGroupModal')).toBe(false);
      }
    );

    it('"showPeopleGroupModal" should be TRUE',
      function () {
        viewModel.attr('people', peopleItems);

        // trigger editableMode setter
        viewModel.attr('editableMode', true);

        expect(viewModel.attr('showPeopleGroupModal')).toBe(true);
      }
    );
  });

  describe('"isReadonly" property', () => {
    it('should be FALSE when can edit is true', () => {
      viewModel.attr('canEdit', true);

      expect(viewModel.attr('isReadonly')).toBe(false);
    });

    it('should be FALSE when one of the people group is saving', () => {
      viewModel.attr('updatableGroupId', 'id');
      viewModel.attr('canEdit', false);

      expect(viewModel.attr('isReadonly')).toBe(false);
    });

    it('should be TRUE when can edit is false and saving is not in progress,',
      () => {
        viewModel.attr('canEdit', false);
        viewModel.attr('updatableGroupId', null);

        expect(viewModel.attr('isReadonly')).toBe(true);
      });
  });

  describe('"showPeople" property', () => {
    beforeEach(() => {
      viewModel.attr('people', peopleItems);
    });

    it('should return full list when group is not editable', () => {
      viewModel.attr('canEdit', false);
      viewModel.attr('updatableGroupId', null);

      viewModel.attr('showPeopleGroupModal', true);

      expect(viewModel.attr('showPeople').length).toBe(peopleItems.length);
    });

    it('should return full list when showPeopleGroupModal is false', () => {
      viewModel.attr('canEdit', true);
      viewModel.attr('showPeopleGroupModal', false);

      expect(viewModel.attr('showPeople').length).toBe(peopleItems.length);
    });

    it(`should return shorten list
      when showPeopleGroupModal is true and group is editable`, () => {
        viewModel.attr('canEdit', true);
        viewModel.attr('showPeopleGroupModal', true);

        expect(viewModel.attr('showPeople').length).toBe(4);
    });
  });
});
