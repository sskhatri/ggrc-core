/*
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../csv-template';

describe('GGRC.Components.csvTemplate', function () {
  var events = Component.prototype.events;

  describe('events', function () {
    var scope;
    var handler;

    describe('".import-button click" handler', function () {
      var exportDfd;
      var selected;

      beforeEach(function () {
        scope = new can.Map();
        exportDfd = new can.Deferred();
        selected = [
          {value: 'Assessment'},
          {value: 'Risk'},
          {value: 'Audit'},
        ];
        scope.attr('selected', selected);
        handler = events['.import-button click'].bind({
          scope: scope,
        });
        spyOn(GGRC.Utils, 'export_request').and.returnValue(exportDfd);
        spyOn(GGRC.Utils, 'download');
      });

      it('requests export with proper data', function () {
        var objects = _.map(selected, function (el) {
          return {
            object_name: el.value,
            fields: 'all',
          };
        });
        handler({}, {preventDefault: jasmine.createSpy()});
        expect(GGRC.Utils.export_request).toHaveBeenCalledWith({data: {
          objects: objects,
          export_to: 'csv',
        }});
      });

      it('loads csv-template', function () {
        exportDfd.resolve('data');
        handler({}, {preventDefault: jasmine.createSpy()});
        expect(GGRC.Utils.download)
          .toHaveBeenCalledWith('import_template.csv', 'data');
      });
    });
  });
});
