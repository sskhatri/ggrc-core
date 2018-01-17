/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

describe('GGRC.Components.lazyRender', function () {
  'use strict';

  var viewModel;

  beforeEach(function () {
    viewModel = GGRC.Components.getViewModel('lazyRender');
  });

  it('should render content only once when the trigger is truthy', function () {
    viewModel.attr('trigger', true);
    expect(viewModel.attr('activatedOrForceRender')).toBe(true);
    viewModel.attr('trigger', false);
    expect(viewModel.attr('activatedOrForceRender')).toBe(true);
  });

  it('should re-render content when the trigger is truthy and '+
     'forceClearContent is set',
    function () {
      viewModel.attr('trigger', true);
      // content is rendered
      expect(viewModel.attr('activatedOrForceRender')).toBe(true);

      viewModel.attr('forceClearContent', true);
      // content cleared
      expect(viewModel.attr('activatedOrForceRender')).toBe(false);

      viewModel.attr('forceClearContent', false);
      // content rendered again
      expect(viewModel.attr('activatedOrForceRender')).toBe(true);
    });
});
