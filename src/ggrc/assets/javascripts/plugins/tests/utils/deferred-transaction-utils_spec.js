/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import DeferredTransaction from '../../utils/deferred-transaction-utils';

describe('DeferredTransaction module', function () {
  'use strict';

  var deferredTransaction;
  var completeTransactionCount;
  var completeActionsCount;

  function action() {
    completeActionsCount++;
  }

  describe('DeferredTransaction in not sequentially mode', function () {
    beforeAll(function () {
      deferredTransaction = new DeferredTransaction(
        function (resolve, reject) {
          completeTransactionCount++;
          resolve();
        }, 100);
    });

    beforeEach(function () {
      completeTransactionCount = 0;
      completeActionsCount = 0;
    });

    it('make several transactions when actions were added with delay ' +
      'greater than configured', function (done) {
      deferredTransaction.push(action);
      setTimeout(function () {
        deferredTransaction.push(action).then(function () {
          done();
          expect(completeTransactionCount).toBe(2);
          expect(completeActionsCount).toBe(2);
        });
      }, 150);
    });

    it('make one transaction when actions were added with delay ' +
      'less than configured', function (done) {
      deferredTransaction.push(action);
      setTimeout(function () {
        deferredTransaction.push(action).then(function () {
          done();
          expect(completeTransactionCount).toBe(1);
          expect(completeActionsCount).toBe(2);
        });
      }, 50);
    });
  });

  describe('DeferredTransaction in sequentially mode', function () {
    beforeAll(function () {
      deferredTransaction = new DeferredTransaction(
        function (resolve, reject) {
          completeTransactionCount++;
          resolve();
        }, 100);
    });

    beforeEach(function () {
      completeTransactionCount = 0;
      completeActionsCount = 0;
    });

    it('make several sequence transactions when actions ' +
      'were added with delay greater than configured', function (done) {
      deferredTransaction.push(action).then(function () {
        completeTransactionCount = 0;
      });
      setTimeout(function () {
        deferredTransaction.push(action).then(function () {
          done();
          expect(completeTransactionCount).toBe(1);
          expect(completeActionsCount).toBe(2);
        });
      }, 150);
    });

    it('make one transaction when actions were added with delay ' +
      'less than configured', function (done) {
      deferredTransaction.push(action);
      setTimeout(function () {
        deferredTransaction.push(action).then(function () {
          done();
          expect(completeTransactionCount).toBe(1);
          expect(completeActionsCount).toBe(2);
        });
      }, 50);
    });
  });
});
