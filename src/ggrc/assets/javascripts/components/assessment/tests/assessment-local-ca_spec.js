/*
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {CA_DD_REQUIRED_DEPS} from '../../../plugins/utils/ca-utils';
import Permission from '../../../permission';

describe('assessmentLocalCa component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = GGRC.Components.getViewModel('assessmentLocalCa');
  });

  describe('canEdit getter', () => {
    var spy;

    beforeEach(() => {
      spy = spyOn(Permission, 'is_allowed_for');
      viewModel.attr('instance', {});
    });

    it('returns false if it is not editMode', () => {
      viewModel.attr('editMode', false);
      expect(viewModel.attr('canEdit')).toBe(false);
    });

    describe('if it is in editMode', () => {
      beforeEach(() => {
        viewModel.attr('editMode', true);
      });

      it('returns false if it is not allowed for update', () => {
        spy.and.returnValue(false);
        expect(viewModel.attr('canEdit')).toBe(false);
        expect(spy).toHaveBeenCalledWith('update', viewModel.attr('instance'));
      });

      it('returns true if it is allowed for update', () => {
        spy.and.returnValue(true);
        expect(viewModel.attr('canEdit')).toBe(true);
        expect(spy).toHaveBeenCalledWith('update', viewModel.attr('instance'));
      });
    });
  });

  describe('check performValidation', function () {
    var inputField;
    var dropdownField;
    var checkboxField;
    var performValidation;

    beforeEach(function () {
      viewModel.attr('evidenceAmount', 0);
      performValidation = viewModel.performValidation.bind(viewModel);

      inputField = new can.Map({
        type: 'input',
        validationConfig: null,
        preconditions_failed: null,
        validation: {
          mandatory: false,
        },
      });

      dropdownField = new can.Map({
        type: 'dropdown',
        validationConfig: {
          'nothing required': CA_DD_REQUIRED_DEPS.NONE,
          'comment required': CA_DD_REQUIRED_DEPS.COMMENT,
          'evidence required': CA_DD_REQUIRED_DEPS.EVIDENCE,
          'com+ev required': CA_DD_REQUIRED_DEPS.COMMENT_AND_EVIDENCE,
        },
        preconditions_failed: [],
        validation: {
          mandatory: false,
        },
        errorsMap: {
          comment: false,
          evidence: false,
        },
      });

      checkboxField = new can.Map({
        type: 'checkbox',
        validationConfig: null,
        preconditions_failed: null,
        validation: {
          mandatory: false,
        },
      });
    });

    it('should ensure evidenceAmount prop works', function () {
      viewModel.attr('evidenceAmount', 0);
      expect(viewModel.attr('evidenceAmount')).toBe(0);
    });

    it('should ensure evidenceAmount prop works', function () {
      viewModel.attr('evidenceAmount', 1);
      expect(viewModel.attr('evidenceAmount')).toBe(1);
    });

    it('should validate non-mandatory checkbox', function () {
      viewModel.attr('fields', [checkboxField]);
      dropdownField.attr('value', null);

      performValidation(checkboxField);

      expect(checkboxField.attr().validation).toEqual({
        show: false,
        valid: true,
        hasMissingInfo: false,
        mandatory: false,
      });

      performValidation(checkboxField);

      expect(checkboxField.attr().validation).toEqual({
        show: false,
        valid: true,
        hasMissingInfo: false,
        mandatory: false,
      });
    });

    it('should validate mandatory checkbox', function () {
      viewModel.attr('fields', [checkboxField]);
      checkboxField.attr('value', null);
      checkboxField.attr('validation.mandatory', true);

      performValidation(checkboxField);
      expect(checkboxField.attr().validation).toEqual({
        mandatory: true,
        show: true,
        valid: false,
        hasMissingInfo: false,
      });

      checkboxField.attr('value', 0);
      performValidation(checkboxField);
      expect(checkboxField.attr().validation).toEqual({
        mandatory: true,
        show: true,
        valid: false,
        hasMissingInfo: false,
      });

      checkboxField.attr('value', 1);
      performValidation(checkboxField);
      expect(checkboxField.attr().validation).toEqual({
        mandatory: true,
        show: true,
        valid: true,
        hasMissingInfo: false,
      });

      checkboxField.attr('value', '1');
      performValidation(checkboxField);
      expect(checkboxField.attr().validation).toEqual({
        mandatory: true,
        show: true,
        valid: true,
        hasMissingInfo: false,
      });
    });

    it('should validate non-mandatory input', function () {
      viewModel.attr('fields', [inputField]);
      inputField.attr('value', '');

      performValidation(inputField);
      expect(inputField.attr().validation).toEqual({
        mandatory: false,
        show: false,
        valid: true,
        hasMissingInfo: false,
      });

      inputField.attr('value', 'some input');
      performValidation(inputField);
      expect(inputField.attr().validation).toEqual({
        mandatory: false,
        show: false,
        valid: true,
        hasMissingInfo: false,
      });
    });

    it('should validate mandatory input', function () {
      viewModel.attr('fields', [inputField]);
      inputField.attr('value', '');

      inputField.attr('validation.mandatory', true);

      performValidation(inputField);
      expect(inputField.attr().validation).toEqual({
        mandatory: true,
        show: true,
        valid: false,
        hasMissingInfo: false,
      });

      inputField.attr('value', 'some input');
      performValidation(inputField);
      expect(inputField.attr().validation).toEqual({
        mandatory: true,
        show: true,
        valid: true,
        hasMissingInfo: false,
      });
    });

    it('should validate dropdown with not selected value', function () {
      // Nothing selected. i.e. None
      viewModel.attr('fields', [dropdownField]);
      dropdownField.attr('value', '');

      performValidation(dropdownField);
      expect(dropdownField.attr().validation).toEqual({
        mandatory: false,
        show: false,
        valid: true,
        hasMissingInfo: false,
        requiresAttachment: false,
      });
      expect(dropdownField.attr().errorsMap).toEqual({
        comment: false,
        evidence: false,
      });
    });

    it('should validate dropdown with a plain value', function () {
      viewModel.attr('fields', [dropdownField]);
      dropdownField.attr('value', 'nothing required');

      performValidation(dropdownField);
      expect(dropdownField.attr().validation).toEqual({
        mandatory: false,
        show: true,
        valid: true,
        hasMissingInfo: false,
        requiresAttachment: false,
      });
      expect(dropdownField.attr().errorsMap).toEqual({
        comment: false,
        evidence: false,
      });
    });

    it('should validate dropdown with a comment required value and comment ' +
       'missing', function () {
      viewModel.attr('fields', [dropdownField]);
      dropdownField.attr('value', 'comment required');

      dropdownField.attr('errorsMap.comment', true);
      performValidation(dropdownField, true);

      expect(dropdownField.attr().validation).toEqual({
        mandatory: false,
        show: true,
        valid: false,
        hasMissingInfo: true,
        requiresAttachment: true,
      });
      expect(dropdownField.attr().errorsMap).toEqual({
        comment: true,
        evidence: false,
      });
    });

    it('should validate dropdown with a comment required value and comment ' +
       'present', function () {
      viewModel.attr('fields', [dropdownField]);
      dropdownField.attr('value', 'comment required');

      performValidation(dropdownField, true);

      expect(dropdownField.attr().validation).toEqual({
        mandatory: false,
        show: true,
        valid: true,
        hasMissingInfo: false,
        requiresAttachment: true,
      });
      expect(dropdownField.attr().errorsMap).toEqual({
        comment: false,
        evidence: false,
      });
    });

    it('should validate dropdown with an evidence required value and ' +
       'evidence missing', function () {
      viewModel.attr('fields', [dropdownField]);
      dropdownField.attr('value', 'evidence required');

      dropdownField.attr('errorsMap.evidence', true);
      performValidation(dropdownField);

      expect(viewModel.attr('evidenceAmount')).toBe(0);
      expect(dropdownField.attr().validation).toEqual({
        mandatory: false,
        show: true,
        valid: false,
        hasMissingInfo: true,
        requiresAttachment: true,
      });
      expect(dropdownField.attr().errorsMap).toEqual({
        comment: false,
        evidence: true,
      });
    });

    it('should validate dropdown with an evidence required value and ' +
       'evidence present', function () {
      viewModel.attr('fields', [dropdownField]);
      viewModel.attr('evidenceAmount', 1);
      dropdownField.attr('value', 'evidence required');

      performValidation(dropdownField, true);

      expect(dropdownField.attr().validation).toEqual({
        mandatory: false,
        show: true,
        valid: true,
        hasMissingInfo: false,
        requiresAttachment: true,
      });
      expect(dropdownField.attr().errorsMap).toEqual({
        comment: false,
        evidence: false,
      });
    });

    it('should validate dropdown with both evidence and ' +
       'comment required values with both of them missing', function () {
      viewModel.attr('fields', [dropdownField]);
      dropdownField.attr('value', 'com+ev required');

      dropdownField.attr('errorsMap.comment', true);
      dropdownField.attr('errorsMap.evidence', true);

      performValidation(dropdownField, true);

      expect(dropdownField.attr().validation).toEqual({
        mandatory: false,
        show: true,
        valid: false,
        hasMissingInfo: true,
        requiresAttachment: true,
      });
      expect(dropdownField.attr().errorsMap).toEqual({
        comment: true,
        evidence: true,
      });
    });

    it('should validate dropdown with both evidence and ' +
       'comment required values with evidence missing', function () {
      viewModel.attr('fields', [dropdownField]);
      dropdownField.attr('value', 'com+ev required');

      dropdownField.attr('errorsMap.evidence', true);
      performValidation(dropdownField, true);

      expect(dropdownField.attr().validation).toEqual({
        mandatory: false,
        show: true,
        valid: false,
        hasMissingInfo: true,
        requiresAttachment: true,
      });
      expect(dropdownField.attr().errorsMap).toEqual({
        comment: false,
        evidence: true,
      });
    });

    it('should validate dropdown with both evidence and ' +
       'comment required values with comment missing', function () {
      viewModel.attr('fields', [dropdownField]);
      viewModel.attr('evidenceAmount', 1);

      dropdownField.attr('value', 'com+ev required');
      dropdownField.attr('errorsMap.comment', true);

      performValidation(dropdownField);

      expect(dropdownField.attr().validation).toEqual({
        mandatory: false,
        show: true,
        valid: false,
        hasMissingInfo: true,
        requiresAttachment: true,
      });
      expect(dropdownField.attr().errorsMap).toEqual({
        comment: true,
        evidence: false,
      });
    });

    it('should validate dropdown with both evidence and ' +
       'comment required values with both of them present', function () {
      viewModel.attr('fields', [dropdownField]);
      viewModel.attr('evidenceAmount', 1);

      dropdownField.attr('value', 'com+ev required');
      performValidation(dropdownField, true);

      expect(dropdownField.attr().validation).toEqual({
        mandatory: false,
        show: true,
        valid: true,
        hasMissingInfo: false,
        requiresAttachment: true,
      });
      expect(dropdownField.attr().errorsMap).toEqual({
        comment: false,
        evidence: false,
      });
    });
  });
});
