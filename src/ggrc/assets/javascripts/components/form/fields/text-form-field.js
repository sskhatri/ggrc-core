/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/text-form-field.mustache';

const TEXT_FORM_FIELD_VM = {
  define: {
    _value: {
      set(newValue, setValue, onError, oldValue) {
        setValue(newValue);
        if (oldValue === undefined ||
            newValue === oldValue ||
            newValue.length && !can.trim(newValue).length) {
          return;
        }
        this.valueChanged(newValue);
      },
    },
    value: {
      set(newValue, setValue) {
        setValue(newValue);
        this.attr('_value', newValue);
      },
    },
  },
  fieldId: null,
  placeholder: '',
  valueChanged(newValue) {
    this.dispatch({
      type: 'valueChanged',
      fieldId: this.fieldId,
      value: newValue,
    });
  },
};

export default can.Component.extend({
  template,
  tag: 'text-form-field',
  viewModel: TEXT_FORM_FIELD_VM,
});

export {TEXT_FORM_FIELD_VM};
