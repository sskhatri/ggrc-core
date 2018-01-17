/*
 * Copyright (C) 2017 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  uploadFiles,
  GDRIVE_PICKER_ERR_CANCEL,
} from '../utils/gdrive-picker-utils.js';
import errorTpl from './templates/gdrive_picker_launcher_upload_error.mustache';
import RefreshQueue from '../../../../ggrc/assets/javascripts/models/refresh_queue';

(function (can, $, GGRC, CMS) {
  'use strict';

  GGRC.Components('gDrivePickerLauncher', {
    tag: 'ggrc-gdrive-picker-launcher',
    template: can.view(GGRC.mustache_path + '/gdrive/gdrive_file.mustache'),
    viewModel: {
      define: {
        isInactive: {
          get: function () {
            return this.attr('disabled');
          }
        }
      },
      assessmentTypeObjects: [],
      instance: {},
      deferred: '@',
      link_class: '@',
      click_event: '@',
      itemsUploadedCallback: '@',
      confirmationCallback: '@',
      pickerActive: false,
      disabled: false,
      sanitizeSlug: function (slug) {
        return slug.toLowerCase().replace(/\W+/g, '-');
      },
      removeOldSuffix: function (fileName) {
        var delPos = fileName.lastIndexOf('_ggrc_');
        return delPos > 0 ? fileName.substring(0, delPos) : fileName;
      },
      addFileSuffix: function (fileName) {
        var assesmentSlug =
          this.sanitizeSlug(this.attr('instance').attr('slug'));
        var suffixArr = ['ggrc', assesmentSlug];

        suffixArr = suffixArr.concat(
          this.attr('assessmentTypeObjects').map(function (obj) {
            return this.sanitizeSlug(obj.attr('revision.content.slug'));
          }.bind(this)).attr()
        );

        return fileName.match(/\.(\w+)$/) ?
          // file name with extension
          fileName.replace(/^(.*)\.(\w+)$/, (match, name, fileExt) => {
              return this.removeOldSuffix(name) + '_' + suffixArr.join('_') +
                      '.' + fileExt;
          }) :
          // file name without extension
          this.removeOldSuffix(fileName) + '_' + suffixArr.join('_');
      },
      /**
       * Creates a file edit request
       * @param  {Objects} file       file object
       * @return {Object}             gapi.client.request object
       */
      createEditRequest: function (file) {
        var requestBody = {};

        requestBody.name = file.attr('name');

        // updating filenames on GDrive
        return gapi.client.request({
          path: `/drive/v3/files/${file.id}`,
          method: 'PATCH',
          params: {
            alt: 'json',
          },
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      },
      /**
       * Creates a file copy request
       * @param  {Object} file        file object
       * @param  {String} newParentId id of the destination folder
       * @return {Object}             gapi.client.request object
       */
      createCopyRequest: function (file, newParentId) {
        var requestBody = {
          parents: [newParentId || 'root'],
        };

        requestBody.name = file.attr('name');

        // updating filenames on GDrive
        return gapi.client.request({
          path: `/drive/v3/files/${file.id}/copy`,
          method: 'POST',
          params: {
            alt: 'json',
          },
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      },
      /**
       * This function creates a batch request from the
       * array of requests with extra data
       * @param  {Array} requestsBatch Array of objects with gapi.client.request and extra options
       * @param  {Object} originalFileNames Object with original files names. key - fileId, values - original file name
       * @return {Promise} Promise which resolves to array of renamed file objects
       */
      runRenameBatch: function (requestsBatch, originalFileNames) {
        var fileRenameBatch = gapi.client.newBatch();
        var resultFiles = new can.Deferred();

        if ( !requestsBatch.length ) {
          return resultFiles.resolve([]);
        } else {
          requestsBatch.forEach((reqData) => {
            fileRenameBatch.add(reqData.req, reqData.options);
          });
        }

        // Batch promise always resolves ( except when the batch is empty )
        // even when some of requests failed so we manually parsing the
        // response object to find errors
        fileRenameBatch.then((batchRes) => {
          var newFiles = [];
          var errors = [];

          can.each(batchRes.result, function (response, fileId) {
            if ( response.status === 200 ) {
              newFiles.push(response.result);
            } else {
              errors.push({
                fileName: originalFileNames[fileId],
              });
              console.error(
                `File ${originalFileNames[fileId]} failed to be renamed.`,
                response.result.error
              );
            }
          });

          if ( newFiles.length ) {
            // if we have successfully renamed files, showing errors just for
            // the failed ones
            if ( errors.length ) {
              GGRC.Errors.notifier('error', errorTpl, {
                errors: errors,
              });
            }

            resultFiles.resolve(newFiles);
          } else {
            resultFiles.reject(new Error(
                `Failed to attach uploaded files.
                An error occurred while adding suffixes.`));
          }
        });

        return resultFiles;
      },
      /**
       * Copys or renames files adding new suffixes to the file names
       * @param  {Object} [opts={}] Options object.
       * @param  {Array}  files     Array of files models
       * @return {Promise}          Promise which resolves to array of new files
       */
      addFilesSuffixes: function (opts = {}, files) {
        var fileRenameDfd = can.Deferred();
        var requestsBatch = [];
        var originalFileNames = {};
        var newParentId = opts.dest && opts.dest.id;
        var untouchedFiles = [];

        files.forEach((file) => {
          var req;

          // TODO: maybe pick the one format (the one that comes after refresh)?
          var originalFileName = file.attr('title') ||
            file.attr('originalFilename') || file.attr('name');

          var newFileName = this.addFileSuffix(originalFileName);

          var parents = (file.parents && file.parents.attr()) || [];

          var originalFileExistsInDest = Boolean(
            parents.find((parent) =>
              (parent.id === newParentId) || (!newParentId && parent.isRoot))
          );
          var newFileExistsInDest = originalFileExistsInDest &&
            ( newFileName === originalFileName );

          var sharedFile = file.attr('userPermission.role') !== 'owner';

          file.attr('title', newFileName);
          file.attr('name', newFileName);
          originalFileNames[file.id] = originalFileName;


          // We change the file if it's a new upload (New files are uploaded
          // to the audit folder or GDrive root folder)
          if ( file.newUpload ) {
            req = this.createEditRequest(file, newParentId);

          // ...and copy file if it's a shared one or
          // there's no file with the same name in the folder
          } else if ( sharedFile || !newFileExistsInDest ) {
            req = this.createCopyRequest(file, newParentId);
          // file with the targeted name already exists in the destination directory -
          // just using it ( it can happen when user picks the just attached file again )
          } else {
            untouchedFiles.push(file);
          }

          // updating filenames on GDrive
          if ( req ) {
            requestsBatch.push({
              req,
              options: {
                id: file.id, // settings request id to file id to find the failed file later
              },
            });
          }
        });

        this.runRenameBatch(requestsBatch, originalFileNames)
          .then((files) => {
            files = files.concat(untouchedFiles);
            this.refreshFilesModel(CMS.Models.GDriveFile.models(files))
              .then(fileRenameDfd.resolve, fileRenameDfd.reject);
          })
          .fail(fileRenameDfd.reject);

        return fileRenameDfd;
      },
      beforeCreateHandler: function (files) {
        var tempFiles = files.map(function (file) {
          return {
            title: this.addFileSuffix(file.name),
            link: file.url,
            created_at: new Date(),
            isDraft: true
          };
        }.bind(this));
        this.dispatch({
          type: 'onBeforeAttach',
          items: tempFiles
        });
        return files;
      },
      onClickHandler: function (scope, el, event) {
        var eventType = this.attr('click_event');
        var handler = this[eventType] || function () {};
        var confirmation = can.isFunction(this.confirmationCallback) ?
          this.confirmationCallback() :
          null;
        var args = arguments;
        var that = this;

        event.preventDefault();
        can.when(confirmation).then(function () {
          handler.apply(that, args);
        });
      },
      trigger_upload: function (scope, el) {
        // upload files without a parent folder (risk assesment)

        uploadFiles({
          parentId: el.data('folder-id'),
          pickFolder: el.data('type') === 'folders',
        }).then((files) => {
          scope.attr('pickerActive', false);
          this.beforeCreateHandler(files);

          this.addFilesSuffixes({}, files)
            .then(this.handle_file_upload.bind(this))
            .then((docs) => {
              // Trigger modal:success event on scope
              can.trigger(this, 'modal:success', {arr: docs});
              el.trigger('modal:success', {arr: docs});
            })
            .fail((error)=>{
              this.dispatch({
                type: 'resetItems',
              });
              if ( error ) {
                GGRC.Errors.notifier('error', error && error.message);
              }
            });
        })
        .fail((err)=>{
          if ( err && err.type === GDRIVE_PICKER_ERR_CANCEL ) {
            el.trigger('rejected');
          }
        });
      },

      refreshFilesModel: function (files) {
        return new RefreshQueue().enqueue(files).trigger();
      },

      trigger_upload_parent: function (scope, el) {
        // upload files with a parent folder (audits and workflows)
        var that = this;
        var parentFolderDfd;
        var folderId;

        if (that.instance.attr('_transient.folder')) {
          parentFolderDfd = can.when(
            [{instance: this.instance.attr('_transient.folder')}]
          );
        } else {
          folderId = this.instance.attr('folder');

          parentFolderDfd = new CMS.Models.GDriveFolder({
            id: folderId,
            href: '/drive/v2/files/' + folderId
          }).refresh();
        }
        can.Control.prototype.bindXHRToButton(parentFolderDfd, el);

        parentFolderDfd
          .done(function (parentFolder) {
            parentFolder.uploadFiles()
              .then(that.beforeCreateHandler.bind(that))
              .then(that.addFilesSuffixes.bind(that, {dest: parentFolder}))
              .then(function (files) {
                that.handle_file_upload(files).then(function (docs) {
                  can.trigger(that, 'modal:success', {arr: docs});
                  el.trigger('modal:success', {arr: docs});
                });
              })
              .fail(function () {
                // This case happens when user have no access to write in audit folder
                var error = _.last(arguments);
                if (error && error.code === 403) {
                  GGRC.Errors.notifier('error', GGRC.Errors.messages[403]);

                  can.trigger(that, 'modal:success');
                  el.trigger('modal:success');
                } else if ( error && error.type !== GDRIVE_PICKER_ERR_CANCEL ) {
                  that.dispatch({
                    type: 'resetItems'
                  });

                  GGRC.Errors.notifier('error', error && error.message);
                }
              });
          })
          .fail(function () {
            el.trigger('ajax:flash', {
              warning: 'Can\'t upload: No GDrive folder found'
            });
          });
      },

      handle_file_upload: function (files) {
        var that = this;

        var dfdDocs = files.map(function (file) {
          return new CMS.Models.Document({
            context: that.instance.context || {id: null},
            title: file.title,
            link: file.alternateLink
          }).save().then(function (doc) {
            var objectDoc;

            if (that.deferred) {
              that.instance.mark_for_addition('documents', doc, {
                context: that.instance.context || {id: null}
              });
            } else {
              objectDoc = new CMS.Models.Relationship({
                context: that.instance.context || {id: null},
                source: that.instance,
                destination: doc
              }).save();
            }

            return objectDoc;
          });
        });
        // waiting for all docs promises
        return can.when(...dfdDocs).then(function () {
          return can.makeArray(arguments);
        });
      }
    },
    events: {
      '{viewModel} modal:success': function () {
        var instance = this.viewModel.instance;
        var itemsUploadedCallback = this.viewModel.itemsUploadedCallback;

        if (can.isFunction(itemsUploadedCallback)) {
          itemsUploadedCallback();
        } else {
          instance.reify();
          instance.refresh();
        }
      },
      '{viewModel} resetItems': function () {
        var itemsUploadedCallback = this.viewModel.itemsUploadedCallback;

        if (can.isFunction(itemsUploadedCallback)) {
          itemsUploadedCallback();
        }
      }
    }
  });
})(window.can, window.can.$, window.GGRC, window.CMS);
