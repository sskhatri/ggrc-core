/* !
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

describe('GGRC.Components.gDrivePickerLauncher', function () {
  'use strict';

  var viewModel;
  const optsAuditFolder = {
    dest: {
      id: 'some-folder-id',
    },
  };
  const optsWithoutAuditFolder = {};
  const ROOT_FOLDER_ID = 'root-folder-id';
  const FILE_NEW_UPLOAD = 'FILE_NEW_UPLOAD';
  const FILE_PICKED = 'FILE_PICKED';

  function genUploadedFile(
    fileType = FILE_PICKED, parentFolderId = ROOT_FOLDER_ID, role = 'owner') {
    return new can.Map({
      newUpload: fileType === FILE_NEW_UPLOAD,
      title: 'my-file.png',
      name: 'my-file.png',
      parents: [
        {
          isRoot: parentFolderId === ROOT_FOLDER_ID,
          id: parentFolderId,
        },
      ],
      userPermission: {
        id: 'me',
        role,
      },
    });
  }

  beforeEach(function () {
    viewModel = GGRC.Components.getViewModel('gDrivePickerLauncher');
    viewModel.attr('instance', {
      slug: 'ASSESSMENT-1',
    });
    viewModel.attr('assessmentTypeObjects', [
      {revision: {content: {slug: 'CONTROL-345'}}},
      {revision: {content: {slug: 'CONTROL-678'}}},
    ]);

    spyOn(viewModel, 'runRenameBatch')
      .and.returnValue(new $.Deferred().resolve([]));
    spyOn(viewModel, 'refreshFilesModel')
      .and.returnValue(new $.Deferred().resolve([]));

    // expect(viewModel.runRenameBatch).toHaveBeenCalled();
    // expect(viewModel.refreshFilesModel).toHaveBeenCalled();
  });

  it('should test sanitizeSlug() method', function () {
    var sanitizationCheck = {
      'abc-test-code-1.CA-865': 'abc-test-code-1-ca-865',
      'AC01.CA-1121': 'ac01-ca-1121',

      'Automated E-Waste Dashboard.CA-935':
        'automated-e-waste-dashboard-ca-935',

      'CA.PCI 1.2.1': 'ca-pci-1-2-1',
      'control-13.CA-855': 'control-13-ca-855',
      'CONTROL-2084.CA-844': 'control-2084-ca-844',
      'PCI 10.4.3.CA-1065': 'pci-10-4-3-ca-1065',
      'REQUEST-957': 'request-957',
      'TV03.2.4.CA': 'tv03-2-4-ca',
      'SM05.CA-1178': 'sm05-ca-1178',
      'ASSESSMENT-12345': 'assessment-12345',
    };

    Object.keys(sanitizationCheck).forEach(function (key) {
      expect(viewModel.sanitizeSlug(key)).toBe(sanitizationCheck[key]);
    });
  });

  it('should test addFileSuffix() method', function () {
    var fakeInstance = new can.Map({
      slug: 'ASSESSMENT-12345',
    });

    var fileNameTransformationMap = {
      'Screenshot 2016-04-29 12.56.30.png':
        'Screenshot 2016-04-29 12.56.30_ggrc_assessment' +
        '-12345_control-345_control-678.png',

      'IMG-9000_ggrc_request-12345.jpg':
        'IMG-9000_ggrc_assessment-12345_control-345_control-678.jpg',
    };

    viewModel.attr('instance', fakeInstance);

    Object.keys(fileNameTransformationMap).forEach(function (key) {
      expect(viewModel.addFileSuffix(key)).toBe(fileNameTransformationMap[key]);
    });
  });

  /**
   * With Audit Folder
   */

  it('should edit newly uploaded file with Audit folder', function () {
    spyOn(viewModel, 'createEditRequest');
    spyOn(viewModel, 'createCopyRequest');

    viewModel.addFilesSuffixes(optsAuditFolder, [
      genUploadedFile(FILE_NEW_UPLOAD), // newly uploaded file to the root of My Drive
    ]);

    expect(viewModel.createEditRequest).toHaveBeenCalled();
    expect(viewModel.createCopyRequest).not.toHaveBeenCalled();
  });

  it('should copy file picked from random folder', function () {
    spyOn(viewModel, 'createEditRequest');
    spyOn(viewModel, 'createCopyRequest');

    viewModel.addFilesSuffixes(optsAuditFolder, [
      genUploadedFile(FILE_PICKED, 'some-random-folder'),
    ]);

    expect(viewModel.createEditRequest).not.toHaveBeenCalled();
    expect(viewModel.createCopyRequest).toHaveBeenCalled();
  });

  it('should reuse file picked from the same folder', function () {
    var file = genUploadedFile(FILE_PICKED, optsAuditFolder.dest.id);

    spyOn(viewModel, 'createEditRequest');
    spyOn(viewModel, 'createCopyRequest');

    // making the file name to already have a slug
    file.attr('title', viewModel.addFileSuffix(file.attr('title')));
    viewModel.addFilesSuffixes(optsAuditFolder, [
      file,
    ]);

    expect(viewModel.createEditRequest).not.toHaveBeenCalled();
    expect(viewModel.createCopyRequest).not.toHaveBeenCalled();
  });

  it('should copy shared file', function () {
    spyOn(viewModel, 'createEditRequest');
    spyOn(viewModel, 'createCopyRequest');

    viewModel.addFilesSuffixes(optsAuditFolder, [
      genUploadedFile(FILE_PICKED, 'some-random-folder', 'reader'),
    ]);

    expect(viewModel.createEditRequest).not.toHaveBeenCalled();
    expect(viewModel.createCopyRequest).toHaveBeenCalled();
  });

  // -----------------

  /**
   * No Audit Folder
   */

  it('should edit newly uploaded file without Audit folder', function () {
    spyOn(viewModel, 'createEditRequest');
    spyOn(viewModel, 'createCopyRequest');

    viewModel.addFilesSuffixes(optsWithoutAuditFolder, [
      genUploadedFile(FILE_NEW_UPLOAD), // newly uploaded file to the root of My Drive
    ]);

    expect(viewModel.createEditRequest).toHaveBeenCalled();
    expect(viewModel.createCopyRequest).not.toHaveBeenCalled();
  });

  it('should copy file picked from random folder', function () {
    spyOn(viewModel, 'createEditRequest');
    spyOn(viewModel, 'createCopyRequest');

    viewModel.addFilesSuffixes(optsWithoutAuditFolder, [
      genUploadedFile(FILE_PICKED, 'some-random-folder'),
    ]);

    expect(viewModel.createEditRequest).not.toHaveBeenCalled();
    expect(viewModel.createCopyRequest).toHaveBeenCalled();
  });

  it('should reuse file picked from the same root folder', function () {
    var file = genUploadedFile(FILE_PICKED);

    spyOn(viewModel, 'createEditRequest');
    spyOn(viewModel, 'createCopyRequest');

    // making the file name to already have a slug
    file.attr('title', viewModel.addFileSuffix(file.attr('title')));
    viewModel.addFilesSuffixes(optsWithoutAuditFolder, [
      file,
    ]);

    expect(viewModel.createEditRequest).not.toHaveBeenCalled();
    expect(viewModel.createCopyRequest).not.toHaveBeenCalled();
  });

  it('should copy shared file', function () {
    spyOn(viewModel, 'createEditRequest');
    spyOn(viewModel, 'createCopyRequest');

    viewModel.addFilesSuffixes(optsWithoutAuditFolder, [
      genUploadedFile(FILE_PICKED, 'some-random-folder', 'reader'),
    ]);

    expect(viewModel.createEditRequest).not.toHaveBeenCalled();
    expect(viewModel.createCopyRequest).toHaveBeenCalled();
  });
});
