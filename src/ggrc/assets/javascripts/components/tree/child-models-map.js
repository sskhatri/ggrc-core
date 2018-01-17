/*
  Copyright (C) 2017 Google Inc., authors, and contributors <see AUTHORS file>
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const childModelsMap = can.Map.extend({
  displayPrefs: null,
  container: {},
  init: function () {
    CMS.Models.DisplayPrefs.getSingleton().then(function (displayPrefs) {
      this.attr('displayPrefs', displayPrefs);
    }.bind(this));
  },
  getModels: function (parentType) {
    if (!this.attr('container.' + parentType)) {
      this.attr('container').attr(parentType, this.attr('displayPrefs')
        .getChildTreeDisplayList(parentType));
    }
    return this.attr('container.' + parentType);
  },
  setModels: function (parentType, newModels) {
    this.attr('container').attr(parentType, newModels);

    this.attr('displayPrefs').setChildTreeDisplayList(parentType,
      newModels);
  },
});

export default new childModelsMap();
