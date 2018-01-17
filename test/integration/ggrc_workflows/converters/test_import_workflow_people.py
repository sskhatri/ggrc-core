# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for workflow people imports."""
# pylint: disable=invalid-name

import collections
import string
import ddt

from ggrc_workflows.models.workflow import Workflow
from integration.ggrc import TestCase
from integration.ggrc.models import factories as ggrc_factories


def _get_people_emails_by_role(workflow, role_name):
  """Get people emails by user_role.

  Args:
      workflow: Workflow instance
      role_name: Workflow user role name
  Returns:
      People emails list.
  """
  people_emails = []
  for wp in workflow.workflow_people:
    if wp.person.user_roles[0].role.name == role_name:
      people_emails.append(wp.person.email)
  return people_emails


@ddt.ddt
class TestWorkflowPeopleImport(TestCase):
  """Tests for workflow people imports."""

  def setUp(self):
    with ggrc_factories.single_commit():
      self.user_emails = [
          ggrc_factories.PersonFactory().email for _ in xrange(8)]
    self.wf_slug = ggrc_factories.random_str(chars=string.ascii_letters)
    self.wf_import_params = collections.OrderedDict([
        ("object_type", "Workflow"),
        ("code", self.wf_slug),
        ("title", "SomeTitle"),
        ("Need Verification", 'True')
    ])

  def _check_workflow_people(self, import_data, expected_data, is_success,
                             success_resp_action):
    """Import people list to workflow and compare with expected results.

    Args:
        owners_idx: Indexes of the test people data who should get Owner role.
        members_idx: Indexes of the test people data who should get Member
            role.
        expected_owners_idx: Expected indexes for the people with Owner role.
        expected_members_idx: Expected indexes for the people with Member role.
        is_success: Shows is import was successful or not.
        success_resp_action: Action which was performed on imported item.
    """
    if import_data['members']:
      import_members = '\n'.join(
          (self.user_emails[idx] for idx in import_data['members']))
      self.wf_import_params['member'] = import_members
    if import_data['owners']:
      import_owners = '\n'.join(
          (self.user_emails[idx] for idx in import_data['owners']))
      self.wf_import_params['manager'] = import_owners
    resp = self.import_data(self.wf_import_params)
    if is_success:
      self.assertEqual(resp[0][success_resp_action], 1)
      self._check_csv_response(resp, {})
      workflow = Workflow.query.filter(Workflow.slug == self.wf_slug).first()

      # Check that every WorkflowPerson has only one role in its scope
      for wp in workflow.workflow_people:
        self.assertEqual(len(wp.person.user_roles), 1)

      exst_owners = _get_people_emails_by_role(workflow, 'WorkflowOwner')
      expected_owners = [self.user_emails[idx]
                         for idx in expected_data['owners']]
      self.assertItemsEqual(exst_owners, expected_owners)

      exst_members = _get_people_emails_by_role(workflow, 'WorkflowMember')
      expected_members = [self.user_emails[idx]
                          for idx in expected_data['members']]
      self.assertItemsEqual(exst_members, expected_members)
    else:
      self.assertEqual(resp[0]['ignored'], 1)

  @ddt.data(
      {
          'import_data': {
              'owners': [0, 1],
              'members': [2, 3]
          },
          'expected_data': {
              'owners': [0, 1],
              'members': [2, 3]
          }
      },
      {
          'import_data': {
              'owners': [0, 1],
              'members': [1, 2]
          },
          'expected_data': {
              'owners': [0, 1],
              'members': [2]
          }
      },
      {
          'import_data': {
              'owners': [0, 1],
              'members': [0, 1]
          },
          'expected_data': {
              'owners': [0, 1],
              'members': []
          }
      },
      {
          'import_data': {
              'owners': [0, 1],
              'members': []
          },
          'expected_data': {
              'owners': [0, 1],
              'members': []
          }
      },
      {
          'import_data': {
              'owners': [],
              'members': [0, 1]
          },
          'expected_data': {
              'owners': [],
              'members': []
          },
          'is_success': False
      },
      {
          'import_data': {
              'owners': [],
              'members': []
          },
          'expected_data': {
              'owners': [],
              'members': []
          },
          'is_success': False
      }
  )
  @ddt.unpack
  def test_create_workflow_with_people(self, import_data, expected_data,
                                       is_success=True):
    """Tests importing new workflow with data: {import_data}."""
    self._check_workflow_people(import_data, expected_data, is_success,
                                'created')

  @ddt.data(
      {
          'import_data': {
              'owners': [0, 1],
              'members': [2, 3]
          },
          'expected_data': {
              'owners': [0, 1],
              'members': [2, 3]
          }
      },
      {
          'import_data': {
              'owners': [0, 1],
              'members': [1, 2]
          },
          'expected_data': {
              'owners': [0, 1],
              'members': [2]
          }
      },
      {
          'import_data': {
              'owners': [0, 1],
              'members': [0, 1]
          },
          'expected_data': {
              'owners': [0, 1],
              'members': [4, 5]
          }
      },
      {
          'import_data': {
              'owners': [0, 1],
              'members': []
          },
          'expected_data': {
              'owners': [0, 1],
              'members': [4, 5]
          }
      },
      {
          'import_data': {
              'owners': [4, 5],
              'members': []
          },
          'expected_data': {
              'owners': [4, 5],
              'members': []
          }
      },
      {
          'import_data': {
              'owners': [],
              'members': [0, 1]
          },
          'expected_data': {
              'owners': [6, 7],
              'members': [0, 1]
          }
      },
      {
          'import_data': {
              'owners': [],
              'members': []
          },
          'expected_data': {
              'owners': [6, 7],
              'members': [4, 5]
          }
      },
      {
          'import_data': {
              'owners': [],
              'members': [6, 7]
          },
          'expected_data': {
              'owners': [6, 7],
              'members': [4, 5]
          }
      }
  )
  @ddt.unpack
  def test_update_workflow_with_people(self, import_data, expected_data):
    """Tests importing existing workflow with data: {import_data}."""
    self.wf_import_params['member'] = '\n'.join((self.user_emails[4],
                                                 self.user_emails[5]))
    self.wf_import_params['manager'] = '\n'.join((self.user_emails[6],
                                                  self.user_emails[7]))
    self.import_data(self.wf_import_params)
    self._check_workflow_people(import_data, expected_data, True, 'updated')
