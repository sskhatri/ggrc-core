/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {TEXT_FORM_FIELD_VM} from '../text-form-field';

describe('GGRC.Components.textFormField', () => {
  'use strict';
  let viewModel;

  beforeEach(() => {
    viewModel = new (can.Map.extend(TEXT_FORM_FIELD_VM));
    spyOn(viewModel, 'dispatch');
    viewModel.attr('fieldId', 'id');
  });

  it('does not fire valueChanged event on first value assignation', () => {
      viewModel.attr('value', '');
      expect(viewModel.dispatch).not.toHaveBeenCalled();
  });

  it('sets the value of the input', () => {
    viewModel.attr('value', 'test');
    expect(viewModel.attr('_value')).toEqual('test');
  });

  it('does not fire valueChanged event if value wasn\'t changed', () => {
    viewModel.attr('value', '');
    viewModel.attr('_value', 'newValue');
    viewModel.dispatch.calls.reset();
    viewModel.attr('_value', 'newValue');
    expect(viewModel.dispatch).not.toHaveBeenCalled();
  });

  it('fires valueChanged event on input value change', () => {
    viewModel.attr('value', '');
    viewModel.attr('_value', 'newValue');
    expect(viewModel.dispatch).toHaveBeenCalledWith({
      type: 'valueChanged',
      fieldId: 'id',
      value: 'newValue',
    });
    viewModel.attr('_value', 'newValue2');
    expect(viewModel.dispatch).toHaveBeenCalledWith({
      type: 'valueChanged',
      fieldId: 'id',
      value: 'newValue2',
    });
  });
});
