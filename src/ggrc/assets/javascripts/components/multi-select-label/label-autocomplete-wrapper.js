/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import baseAutocompleteWrapper from './../custom-autocomplete/autocomplete-wrapper';

let viewModel = baseAutocompleteWrapper.extend({
  currentValue: '',
  model: 'Label',
  queryField: 'name',
  result: [],
  objectsToExclude: [],
  showResults: false,
  showNewValue: false,
});

export default can.Component.extend({
  tag: 'label-autocomplete-wrapper',
  template: '<content></content>',
  viewModel: viewModel,
});
