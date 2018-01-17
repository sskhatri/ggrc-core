/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import component from '../comment-data-provider';
import * as QueryAPI from '../../../plugins/utils/query-api-utils';

describe('GGRC.Component.commentDataProvider', ()=> {
  let viewModel;

  beforeEach(()=> {
    viewModel = new (can.Map.extend(component.prototype.viewModel));
  });

  describe('init() method', ()=> {
    let method;
    beforeEach(()=> {
      method = component.prototype.init.bind({viewModel});
    });

    it('loads comments', ()=> {
      spyOn(viewModel, 'loadComments');

      method();

      expect(viewModel.loadComments).toHaveBeenCalled();
    });
  });

  describe('loadComments() method', ()=> {
    beforeEach(()=> {
      spyOn(viewModel, 'buildQuery').and.returnValue('query');
      spyOn(viewModel, 'getComments').and.returnValue(['comment']);
      viewModel.loadComments();
    });

    it('builds query', ()=> {
      expect(viewModel.buildQuery).toHaveBeenCalled();
    });

    it('gets comments using query', ()=> {
      expect(viewModel.getComments).toHaveBeenCalledWith('query');
    });

    it('sets query to "comments" propery', ()=> {
      expect(viewModel.attr('comments').attr()).toEqual(['comment']);
    });
  });

  describe('getComments() method', ()=> {
    let queryDeferred;
    let resultDeferred;
    beforeEach(()=> {
      queryDeferred = can.Deferred();
      spyOn(QueryAPI, 'batchRequests')
        .and.returnValue(queryDeferred);

      resultDeferred = jasmine.createSpyObj(['promise', 'resolve']);
      spyOn(can, 'Deferred')
        .and.returnValue(resultDeferred);
    });

    it('returns can.promise', ()=> {
      viewModel.getComments();

      expect(resultDeferred.promise).toHaveBeenCalled();
    });

    it('turns on isLoading flag', ()=> {
      viewModel.attr('isLoading', false);

      viewModel.getComments();

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('resolves result deferred with items if all is OK', ()=> {
      viewModel.getComments();
      queryDeferred.resolve({
        test: {
          values: ['value'],
        },
      });

      expect(resultDeferred.resolve).toHaveBeenCalledWith(['value']);
    });

    it('resolves result deferred with epmty array if failed', ()=> {
      viewModel.getComments();
      queryDeferred.reject();

      expect(resultDeferred.resolve).toHaveBeenCalledWith([]);
    });
  });

  describe('addComment() methid', ()=> {
    it('adds comment to the beginning of the collection', ()=> {
      viewModel.attr('comments').replace(['comment2']);
      viewModel.addComment({
        items: ['comment1'],
      });

      expect(viewModel.attr('comments')[0]).toBe('comment1');
    });
  });

  describe('removeComment() method', ()=> {
    it('removes the comment based on "_stamp" property', ()=> {
      viewModel.attr('comments').replace([{
        title: 'comment1',
        _stamp: '1',
      }, {
        title: 'comment2',
        _stamp: '2',
      }]);

      viewModel.removeComment({
        _stamp: '2',
      });

      expect(viewModel.attr('comments')[0].attr('title')).toBe('comment1');
    });
  });

  describe('processComment() method', ()=> {
    let mapDfd;
    beforeEach(()=>{
      mapDfd = can.Deferred();
      spyOn(viewModel, 'mapToInstance').and.returnValue(mapDfd.promise());
      viewModel.attr('instance', {
        refresh: jasmine.createSpy(),
      });
    });

    it('calls mapToInstance if success', ()=> {
      viewModel.processComment({success: true, item: 'item'});

      expect(viewModel.mapToInstance).toHaveBeenCalledWith('item');
    });

    it('refresh instance when comment was mapped', (done)=> {
      viewModel.processComment({success: true, item: 'item'});

      mapDfd.resolve().then(()=> {
        expect(viewModel.attr('instance').refresh).toHaveBeenCalled();
        done();
      });
    });

    it('calls removeComment if fail', ()=> {
      spyOn(viewModel, 'removeComment');

      viewModel.processComment({success: false, item: 'item'});

      expect(viewModel.removeComment).toHaveBeenCalledWith('item');
    });
  });
});
