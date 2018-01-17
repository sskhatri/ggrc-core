/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  isSnapshot,
} from './snapshot-utils';

  /**
   * Util methods for integration with GGRCQ.
   */
var models = ['Process', 'Product', 'System'];

/**
 * Determine whether model type could have mapped questions.
 * @param {String} model - The model name
 * @return {Boolean} True or False
 */
function hasQuestions(model) {
  return GGRC.GGRC_Q_INTEGRATION_URL && models.indexOf(model) > -1;
}

/**
 * Get url to page with questions.
 * @param {String} id - The model id
 * @param {String} model - The model name
 * @return {String} Url to questions
 */
function getUrl(id, model) {
  var url = GGRC.GGRC_Q_INTEGRATION_URL;
  if (!url) {
    return '';
  }
  if (!url.endsWith('/')) {
    url += '/';
  }

  return url + 'Questionnaire/' + model + '/' + id;
}

/**
 * Get url to page with questions.
 * @param {Object} instance - The model instance
 * @return {String} Url to questions
 */
function getQuestionsUrl(instance) {
  var id = isSnapshot(instance) && instance.snapshot ?
      instance.snapshot.child_id :
      instance.id;
  return getUrl(id, instance.class.title_singular);
}

export {
  hasQuestions,
  getQuestionsUrl,
};
