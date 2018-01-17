/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import BaseStrategy from './base';

export default class LocalStrategy extends BaseStrategy {
  timing(category, variable, label, value) {
    console.debug(`Category: ${category},
    Variable: ${variable},
    Label: ${label},
    time: ${value}`);
  }
}
