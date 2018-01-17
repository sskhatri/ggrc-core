/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Ctrl from '../summary_widget_controller';
import * as CurrentPageUtils from '../../plugins/utils/current-page-utils';

describe('SummaryWidgetController', function () {
  'use strict';

  describe('"{CMS.Models.Assessment} updated" handler', function () {
    var method;
    var ctrlInst;

    beforeEach(function () {
      ctrlInst = {
        options: {
          forceRefresh: false
        }
      };
      method = Ctrl.prototype['{CMS.Models.Assessment} updated'].bind(ctrlInst);
    });

    it('sets true to options.forceRefresh', function () {
      var assessment = new CMS.Models.Assessment();
      method({}, {}, assessment);
      expect(ctrlInst.options.forceRefresh).toBe(true);
    });
  });

  describe('onRelationshipChange() method', function () {
    var method;
    var ctrlInst;

    beforeEach(function () {
      ctrlInst = {
        options: {
          forceRefresh: false
        }
      };
      method = Ctrl.prototype.onRelationshipChange.bind(ctrlInst);
    });

    it('sets true to options.forceRefresh if destination type is Document' +
    'and source type is Assessment',
      function () {
        var relationship = new CMS.Models.Relationship({
          destination: {
            type: 'Document',
            id: 1
          }, source: {
            type: 'Assessment',
            id: 1
          }
        });
        method({}, {}, relationship);
        expect(ctrlInst.options.forceRefresh).toBe(true);
      });

    it('does not set true to options.forceRefresh' +
    ' if destination type is not Document', function () {
      var relationship = new CMS.Models.Relationship({
        destination: {
          type: 'Control',
          id: 1
        }, source: {
          type: 'Assessment',
          id: 1
        }
      });
      method({}, {}, relationship);
      expect(ctrlInst.options.forceRefresh).toBe(false);
    });

    it('does not set true to options.forceRefresh' +
    ' if source type is not Assessment', function () {
      var relationship = new CMS.Models.Relationship({
        destination: {
          type: 'Document',
          id: 1
        }, source: {
          type: 'Issue',
          id: 1
        }
      });
      method({}, {}, relationship);
      expect(ctrlInst.options.forceRefresh).toBe(false);
    });
  });

  describe('reloadChart() method', function () {
    var method;
    var ctrlInst;
    var raw;

    beforeEach(function () {
      raw = [{type: 'Assessment'}];
      ctrlInst = {
        options: {
          instance: {
            id: 123
          },
          forceRefresh: false,
          context: {
            charts: {
              Assessment: new can.Map({total: 3, isInitialized: true})
            }
          }
        },
        setState: jasmine.createSpy(),
        getStatuses: jasmine.createSpy().and
          .returnValue(new can.Deferred().resolve(raw)),
        parseStatuses: jasmine.createSpy(),
        drawChart: jasmine.createSpy(),
        prepareLegend: jasmine.createSpy()
      };
      method = Ctrl.prototype.reloadChart.bind(ctrlInst);
      spyOn(CurrentPageUtils, 'getCounts')
        .and.returnValue(new can.Map({Assessment: 3}));
    });

    it('does nothing if chart options is initialized,' +
    'counts is not changed and it was not force refresh', function () {
      method('Assessment');
      expect(ctrlInst.setState).not.toHaveBeenCalled();
      expect(ctrlInst.drawChart).not.toHaveBeenCalled();
    });
    describe('if it was force refresh then', function () {
      beforeEach(function () {
        ctrlInst.options.forceRefresh = true;
      });
      it('sets false to options.forceRefresh ', function () {
        method('Assessment');
        expect(ctrlInst.options.forceRefresh).toBe(false);
      });
      it('calls drawChart() method', function () {
        method('Assessment');
        expect(ctrlInst.drawChart).toHaveBeenCalled();
      });
    });
  });

  describe('widget_shown(event) method', function () {
    var method;
    var ctrlInst;
    var resizeHandler;

    beforeEach(function () {
      ctrlInst = {
        widget_shown: jasmine.createSpy('widget_shown'),
        reloadSummary: jasmine.createSpy('reloadSummary'),
        options: {
          context: new can.Map({})
        }
      };
      method = Ctrl.prototype.widget_shown.bind(ctrlInst);
      resizeHandler = jasmine.createSpy('resizeHandler');
      $(window).resize(resizeHandler);
    });

    afterEach(function () {
      $(window).off('resize', resizeHandler);
    });

    it('returns false', function () {
      var result = method();
      expect(result).toBe(false);
    });

    it('sets isShown option to true', function () {
      method();
      expect(ctrlInst.options.isShown).toBe(true);
    });

    it('dispatches resize event', function () {
      method();
      expect(resizeHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('widget_hidden(event) method', function () {
    var method;
    var ctrlInst;

    beforeEach(function () {
      ctrlInst = {
        widget_hidden: jasmine.createSpy('widget_hidden'),
        options: {
          context: new can.Map({})
        }
      };
      method = Ctrl.prototype.widget_hidden.bind(ctrlInst);
    });

    it('returns false', function () {
      var result = method();
      expect(result).toBe(false);
    });

    it('sets isShown option to false', function () {
      method();
      expect(ctrlInst.options.isShown).toBe(false);
    });
  });

  describe('"{window} resize" handler', function () {
    var method;
    var ctrlInst;
    var chart;

    beforeEach(function () {
      chart = {
        draw: jasmine.createSpy()
      };
      ctrlInst = {
        options: {
          chart: chart,
          chartOptions: 'options',
          data: 'data',
          isShown: true
        }
      };
      method = Ctrl.prototype['{window} resize'].bind(ctrlInst);
    });

    it('draws chart if summary widget is shown ' +
    'and chart, data, and chart options is defined', function () {
      method();
      expect(chart.draw).toHaveBeenCalledWith('data', 'options');
    });

    it('does not draw chart if summary widget is not shown', function () {
      ctrlInst.options.isShown = false;
      method();
      expect(chart.draw).not.toHaveBeenCalled();
    });
    it('does not draw chart if chart data is undefined', function () {
      ctrlInst.options.data = undefined;
      method();
      expect(chart.draw).not.toHaveBeenCalled();
    });
    it('does not draw chart if chart options is undefined', function () {
      ctrlInst.options.chartOptions = undefined;
      method();
      expect(chart.draw).not.toHaveBeenCalled();
    });
  });
});
