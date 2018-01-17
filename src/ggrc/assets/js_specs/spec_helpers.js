/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

/*
 * Generally useful helpers
 * Primarily to support Jasmine 1.3 -> Jasmine 2
 */

// polls check function and calls done when truthy
window.waitsFor = function (check, done) {
  if (!check()) {
    setTimeout(function () {
      waitsFor(check, done);
    }, 1);
  } else {
    done();
  }
};

// This is primarily useful for passing as the fail case for
//  promises, since every item passed to it will show up in
//  the jasmine output.
window.failAll = function (done) {
  return function () {
    can.each(arguments, function (arg) {
      fail(JSON.stringify(arg));
    });
    if (done) {
      done();
    }
  };
};

window.getComponentVM = (Component) => {
  const viewModelConfig = Component.prototype.viewModel;

  if (can.isFunction(viewModelConfig)) {
    return new viewModelConfig();
  }
  return new (can.Map.extend(viewModelConfig));
};
