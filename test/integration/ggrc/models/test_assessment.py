# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for Assessment"""
# pylint: disable=too-many-lines

import collections
import datetime

import freezegun
import ddt

from ggrc import db
from ggrc.access_control.role import get_custom_roles_for
from ggrc.models import all_models
from ggrc.converters import errors

from integration import ggrc
from integration.ggrc import generator
from integration.ggrc.models import factories
from integration.ggrc_basic_permissions.models import (
    factories as rbac_factories
)

from appengine import base


class TestAssessmentBase(ggrc.TestCase):
  """Base class for Assessment tests"""
  def setUp(self):
    super(TestAssessmentBase, self).setUp()
    self.api = ggrc.api_helper.Api()
    self.assignee_roles = {
        role_name: role_id
        for role_id, role_name in get_custom_roles_for("Assessment").items()
        if role_name in ["Assignees", "Creators", "Verifiers"]
    }

  def assert_mapped_role(self, role, person_email, mapped_obj):
    """Check if required role was created for mapped object"""
    query = all_models.AccessControlList.query.join(
        all_models.AccessControlRole,
        all_models.AccessControlRole.id ==
        all_models.AccessControlList.ac_role_id
    ).join(
        all_models.Person,
        all_models.Person.id == all_models.AccessControlList.person_id
    ).filter(
        all_models.AccessControlList.object_id == mapped_obj.id,
        all_models.AccessControlList.object_type == mapped_obj.type,
        all_models.Person.email == person_email,
        all_models.AccessControlRole.name == role,
    )
    self.assertEqual(query.count(), 1)

  def assessment_post(self, template=None, extra_data=None):
    """Helper function to POST an assessment"""
    assessment_dict = {
        "_generated": True,
        "audit": {
            "id": self.audit.id,
            "type": "Audit"
        },
        "object": {
            "id": self.snapshot.id,
            "type": "Snapshot"
        },
        "context": {
            "id": self.audit.context.id,
            "type": "Context"
        },
        "title": "Temp title"
    }
    if template:
      assessment_dict["template"] = {
          "id": template.id,
          "type": "AssessmentTemplate"
      }
    if extra_data:
      assessment_dict.update(extra_data)

    return self.api.post(all_models.Assessment, {
        "assessment": assessment_dict
    })


class TestAssessment(TestAssessmentBase):
  """Assessment test cases"""
  # pylint: disable=invalid-name
  def test_auto_slug_generation(self):
    """Test auto slug generation"""
    factories.AssessmentFactory(title="Some title")
    ca = all_models.Assessment.query.first()
    self.assertEqual("ASSESSMENT-{}".format(ca.id), ca.slug)

  def test_enabling_comment_notifications_by_default(self):
    """New Assessments should have comment notifications enabled by default."""
    asmt = factories.AssessmentFactory()

    self.assertTrue(asmt.send_by_default)
    recipients = asmt.recipients.split(",") if asmt.recipients else []
    self.assertEqual(
        sorted(recipients),
        ["Assignees", "Creators", "Verifiers"]
    )

  def test_audit_changes_api(self):
    """Test that users can't change the audit mapped to an assessment."""
    audit_id = factories.AuditFactory().id
    asmt = factories.AssessmentFactory()
    correct_audit_id = asmt.audit_id
    response = self.api.put(asmt, {"audit": {"type": "Audit", "id": audit_id}})
    self.assert400(response)
    assessment = all_models.Assessment.query.first()
    self.assertEqual(assessment.audit_id, correct_audit_id)

  def test_put_no_audit_change(self):
    """Test that put requests works without audit changes"""
    asmt = factories.AssessmentFactory()
    correct_audit_id = asmt.audit_id
    response = self.api.put(asmt, {"audit": {
        "type": "Audit", "id": correct_audit_id
    }})
    self.assert200(response)
    assessment = all_models.Assessment.query.first()
    self.assertEqual(assessment.audit_id, correct_audit_id)

  def test_audit_changes_import(self):
    """Test that users can't change the audit mapped to an assessment."""
    audit = factories.AuditFactory()
    asmt = factories.AssessmentFactory()
    correct_audit_id = asmt.audit_id
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", asmt.slug),
        ("audit", audit.slug),
    ]))
    self._check_csv_response(response, {
        "Assessment": {
            "row_warnings": {
                errors.UNMODIFIABLE_COLUMN.format(line=3, column_name="Audit")
            }
        }
    })
    assessment = all_models.Assessment.query.first()
    self.assertEqual(assessment.audit_id, correct_audit_id)

  def test_no_audit_change_imports(self):
    """Test that imports work if audit field does not contain changes."""
    factories.AuditFactory()
    asmt = factories.AssessmentFactory()
    correct_audit_id = asmt.audit_id
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", asmt.slug),
        ("audit", asmt.audit.slug),
    ]))
    self._check_csv_response(response, {})
    assessment = all_models.Assessment.query.first()
    self.assertEqual(assessment.audit_id, correct_audit_id)

  def test_empty_audit_import(self):
    """Test empty audit import"""
    factories.AuditFactory()
    asmt = factories.AssessmentFactory()
    correct_audit_id = asmt.audit_id
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", asmt.slug),
        ("audit", ""),
    ]))
    self._check_csv_response(response, {})
    assessment = all_models.Assessment.query.first()
    self.assertEqual(assessment.audit_id, correct_audit_id)

  def test_post_mapped_roles(self):
    """Test mapped roles creation when new assessment created"""
    audit = factories.AuditFactory()
    person = factories.PersonFactory()
    person_email = person.email

    response = self.api.post(all_models.Assessment, {
        "assessment": {
            "audit": {
                "id": audit.id,
                "type": "Audit"
            },
            "access_control_list": [
                {
                    "ac_role_id": role_id,
                    "person": {
                        "id": person.id
                    }
                }
                for role_id in self.assignee_roles.values()
            ],
            "context": {
                "id": audit.context.id,
                "type": "Context"
            },
            "title": "Some title"
        }
    })
    self.assertEqual(response.status_code, 201)

    db.session.add(audit)
    assessment = all_models.Assessment.query.get(
        response.json["assessment"]["id"]
    )
    for role in self.assignee_roles:
      self.assert_mapped_role(role, person_email, assessment)
      self.assert_mapped_role("{} Mapped".format(role), person_email, audit)

  def test_put_mapped_roles(self):
    """Test mapped roles creation when assessment updated"""
    with factories.single_commit():
      person = factories.PersonFactory()
      person_email = person.email
      audit = factories.AuditFactory()
      assessment = factories.AssessmentFactory(audit=audit)
      factories.AccessControlListFactory(
          ac_role_id=self.assignee_roles["Assignees"],
          person=person,
          object=assessment
      )
      factories.AccessControlListFactory(
          ac_role_id=self.assignee_roles["Creators"],
          person=person,
          object=assessment
      )
      factories.RelationshipFactory(source=audit, destination=assessment)

    verifiers = all_models.AccessControlList.query.join(
        all_models.AccessControlRole,
        all_models.AccessControlList.ac_role_id ==
        all_models.AccessControlRole.id
    ).filter(
        all_models.AccessControlRole.name == "Verifiers Mapped",
        all_models.AccessControlList.person == person,
        all_models.AccessControlList.object_id == assessment.id,
        all_models.AccessControlList.object_type == assessment.type,
    )
    # Check there is no Verified Mapped roles in db
    self.assertEqual(verifiers.count(), 0)

    # Add verifier to Assessment
    response = self.api.put(assessment, {
        "access_control_list": [
            {
                "ac_role_id": role_id,
                "person": {
                    "id": person.id
                }
            }
            for role_id in self.assignee_roles.values()
        ]
    })
    self.assertEqual(response.status_code, 200)

    db.session.add_all([audit, assessment])
    self.assert_mapped_role("Verifiers", person_email, assessment)
    self.assert_mapped_role("Verifiers Mapped", person_email, audit)

  def test_import_mapped_roles(self):
    """Test creation of mapped roles in assessment import."""
    with factories.single_commit():
      audit = factories.AuditFactory()
      asmnt = factories.AssessmentFactory(audit=audit)
      factories.RelationshipFactory(source=audit, destination=asmnt)

      control = factories.ControlFactory()
      snapshot = self._create_snapshots(audit, [control])[0]
      factories.RelationshipFactory(source=asmnt, destination=snapshot)

      users = ["user1@mail.com", "user2@mail.com"]
      for user in users:
        factories.PersonFactory(email=user)

    users_str = "\n".join(users)
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", asmnt.slug),
        ("Assignees", users_str),
        ("Creators", users_str),
        ("Verifiers", users_str),
    ]))
    self._check_csv_response(response, {})

    # Add objects back to session to have access to their id and type
    db.session.add_all([audit, snapshot])
    for role in ["Assignees Mapped", "Creators Mapped", "Verifiers Mapped"]:
      for user in users:
        self.assert_mapped_role(role, user, audit)
        self.assert_mapped_role(role, user, snapshot)

  def test_document_mapped_roles(self):
    """Test creation of mapped document roles."""
    with factories.single_commit():
      person = factories.PersonFactory()
      person_email = person.email
      audit = factories.AuditFactory()
      assessment = factories.AssessmentFactory(audit=audit)
      for ac_role_id in self.assignee_roles.values():
        factories.AccessControlListFactory(
            ac_role_id=ac_role_id,
            person=person,
            object=assessment
        )
      factories.RelationshipFactory(source=audit, destination=assessment)
      document = factories.DocumentFactory()
      factories.RelationshipFactory(source=assessment, destination=document)

    db.session.add(document)
    for role in ["Assignees Document Mapped",
                 "Creators Document Mapped",
                 "Verifiers Document Mapped"]:
      self.assert_mapped_role(role, person_email, document)

  def test_deletion_mapped_roles(self):
    """Test deletion of mapped roles."""
    with factories.single_commit():
      person = factories.PersonFactory()
      person_email = person.email
      audit = factories.AuditFactory()
      assessment = factories.AssessmentFactory(audit=audit)
      for ac_role_id in self.assignee_roles.values():
        factories.AccessControlListFactory(
            ac_role_id=ac_role_id,
            person=person,
            object=assessment
        )
      factories.RelationshipFactory(source=audit, destination=assessment)

    # Remove verifier and assignee from Assessment
    response = self.api.put(assessment, {
        "access_control_list": [
            {
                "ac_role_id": self.assignee_roles["Creators"],
                "person": {
                    "id": person.id
                }
            }
        ]
    })
    self.assertEqual(response.status_code, 200)
    db.session.add(audit)
    self.assert_mapped_role("Creators", person_email, assessment)
    self.assert_mapped_role("Creators Mapped", person_email, audit)

  def test_deletion_multiple_assignee(self):
    """Test deletion of multiple mapped roles."""
    with factories.single_commit():
      persons = [factories.PersonFactory() for _ in range(2)]
      person_ids = [p.id for p in persons]
      person_email = persons[1].email
      audit = factories.AuditFactory()
      assessment = factories.AssessmentFactory(audit=audit)
      for ac_role_id in self.assignee_roles.values():
        for person in persons:
          factories.AccessControlListFactory(
              ac_role_id=ac_role_id,
              person=person,
              object=assessment
          )
      factories.RelationshipFactory(source=audit, destination=assessment)

    # Remove assignee roles for first person
    response = self.api.put(assessment, {
        "access_control_list": [
            {
                "ac_role_id": role_id,
                "person": {
                    "id": person_ids[1]
                }

            }
            for role_id in self.assignee_roles.values()
        ]
    })
    self.assertEqual(response.status_code, 200)
    assignee_acl = all_models.AccessControlList.query.filter_by(
        person_id=person_ids[0]
    )
    # All roles for first person should be removed
    self.assertEqual(assignee_acl.count(), 0)
    db.session.add(audit)
    for ac_role in self.assignee_roles.keys():
      self.assert_mapped_role(ac_role, person_email, assessment)
      self.assert_mapped_role(
          "{} Mapped".format(ac_role), person_email, audit
      )

  def test_assignee_deletion_unmap(self):
    """Test deletion of assignee roles when snapshot is unmapped."""
    with factories.single_commit():
      person = factories.PersonFactory()
      person_email = person.email
      audit = factories.AuditFactory()
      assessment = factories.AssessmentFactory(audit=audit)
      for ac_role_id in self.assignee_roles.values():
        factories.AccessControlListFactory(
            ac_role_id=ac_role_id,
            person=person,
            object=assessment
        )
      factories.RelationshipFactory(source=audit, destination=assessment)
      snapshot = self._create_snapshots(audit, [factories.ControlFactory()])[0]
      rel = factories.RelationshipFactory(
          source=assessment, destination=snapshot
      )
    for ac_role in self.assignee_roles.keys():
      self.assert_mapped_role(
          "{} Mapped".format(ac_role), person_email, snapshot
      )
    response = self.api.delete(rel)
    self.assertEqual(response.status_code, 200)
    snap_acls = all_models.AccessControlList.query.filter_by(
        object_type="Snapshot"
    )
    self.assertEqual(snap_acls.count(), 0)

  def test_mapped_roles_saving(self):
    """Test that removing roles for one assessment will not touch second"""
    with factories.single_commit():
      person = factories.PersonFactory()
      person_email = person.email
      audit = factories.AuditFactory()
      assessments = [
          factories.AssessmentFactory(audit=audit) for _ in range(2)
      ]
      snapshot = self._create_snapshots(audit, [factories.ControlFactory()])[0]
      snapshot_id = snapshot.id
      snap_rels = []
      for assessment in assessments:
        for ac_role_id in self.assignee_roles.values():
          factories.AccessControlListFactory(
              ac_role_id=ac_role_id,
              person=person,
              object=assessment
          )
        factories.RelationshipFactory(source=audit, destination=assessment)
        snap_rels.append(factories.RelationshipFactory(
            source=assessment, destination=snapshot
        ))

    response = self.api.delete(snap_rels[0])
    self.assertEqual(response.status_code, 200)

    snapshot = all_models.Snapshot.query.get(snapshot_id)
    for ac_role in self.assignee_roles.keys():
      self.assert_mapped_role(
          "{} Mapped".format(ac_role), person_email, snapshot
      )

  def test_audit_roles_saving(self):
    """Test that snapshot unmapping will not affect audit"""
    with factories.single_commit():
      person = factories.PersonFactory()
      person_email = person.email
      audit = factories.AuditFactory()
      assessment = factories.AssessmentFactory(audit=audit)
      snapshot = self._create_snapshots(audit, [factories.ControlFactory()])[0]
      for ac_role_id in self.assignee_roles.values():
        factories.AccessControlListFactory(
            ac_role_id=ac_role_id,
            person=person,
            object=assessment
        )
      factories.RelationshipFactory(source=audit, destination=assessment)
      snap_rel = factories.RelationshipFactory(
          source=assessment, destination=snapshot
      )

    response = self.api.delete(snap_rel)
    self.assertEqual(response.status_code, 200)

    db.session.add(audit)
    for ac_role in self.assignee_roles.keys():
      self.assert_mapped_role(
          "{} Mapped".format(ac_role), person_email, audit
      )

  def test_mapped_regulations_acl(self):
    """Test creation of acl roles for Regulations and Objective snapshots."""
    with factories.single_commit():
      person = factories.PersonFactory()
      person_email = person.email
      audit = factories.AuditFactory()
      assessment = factories.AssessmentFactory(audit=audit)
      for ac_role_id in self.assignee_roles.values():
        factories.AccessControlListFactory(
            ac_role_id=ac_role_id, person=person, object=assessment
        )
      factories.RelationshipFactory(source=audit, destination=assessment)
      control = factories.ControlFactory()
      objective = factories.ObjectiveFactory()
      regulation = factories.RegulationFactory()
      snapshots = self._create_snapshots(
          audit, [control, objective, regulation]
      )
      factories.RelationshipFactory(
          source=snapshots[0], destination=snapshots[1]
      )
      factories.RelationshipFactory(
          source=snapshots[2], destination=snapshots[0]
      )
      factories.RelationshipFactory(
          source=assessment, destination=snapshots[0]
      )

    for role in ["Assignees Mapped", "Creators Mapped", "Verifiers Mapped"]:
      for snapshot in snapshots:
        # Mapped Assignee roles should be created for all snapshots, not only
        # for control that related to assessment
        self.assert_mapped_role(role, person_email, snapshot)


@ddt.ddt
@base.with_memcache
class TestAssessmentUpdates(ggrc.TestCase):
  """ Test various actions on Assessment updates """

  def setUp(self):
    super(TestAssessmentUpdates, self).setUp()
    self.api = ggrc.api_helper.Api()
    self.generator = generator.ObjectGenerator()
    _, program = self.generator.generate_object(all_models.Program)
    program_id = program.id
    _, audit = self.generator.generate_object(
        all_models.Audit,
        {
            "title": "Audit",
            "program": {"id": program_id},
            "status": "Planned"
        },
    )

    with freezegun.freeze_time("2015-04-01 17:13:15"):
      _, assessment = self.generator.generate_object(
          all_models.Assessment,
          {
              "title": "Assessment-Comment",
              "audit": {"id": audit.id},
              "audit_title": audit.title,
              "people_value": [],
              "default_people": {
                  "assignees": "Admin",
                  "verifiers": "Admin",
              },
              "context": {"id": audit.context.id},
          }
      )

    self.assessment_id = assessment.id
    self.assessment = all_models.Assessment.query.get(self.assessment_id)

  # pylint: disable=invalid-name
  def test_updated_at_changes_after_comment(self):
    """Test updated_at date is changed after adding a comment to assessment"""
    with freezegun.freeze_time("2016-04-01 18:22:09"):
      self.generator.generate_comment(
          self.assessment,
          "Verifiers",
          "some comment",
          send_notification="true"
      )

      asmt = all_models.Assessment.query.get(self.assessment.id)
      self.assertEqual(asmt.updated_at,
                       datetime.datetime(2016, 4, 1, 18, 22, 9))

  def test_update_assessment_and_get_list(self):
    """Test get value for assessment cached value after update."""
    old_state = "In Progress"
    all_models.Assessment.query.filter(
        all_models.Assessment.id == self.assessment_id
    ).update({
        all_models.Assessment.status: old_state,
    })
    db.session.commit()
    # required for populate cache
    content = self.api.client.get(
        "/api/assessments?id__in={}".format(self.assessment_id)
    )
    self.assertEqual(
        old_state,
        content.json['assessments_collection']['assessments'][0]['status']
    )
    new_state = "In Review"
    self.api.put(all_models.Assessment.query.get(self.assessment_id),
                 {"status": new_state})
    content = self.api.client.get(
        "/api/assessments?id__in={}".format(self.assessment_id)
    )
    self.assertEqual(
        new_state,
        content.json['assessments_collection']['assessments'][0]['status']
    )

  @ddt.data(
      (None, "Control", "Plan - {}", "Plan - 0<br>Plan - 1<br>Plan - 2"),
      ("", "Control", "Plan - {}",
       "Plan - 0<br>Plan - 1<br>Plan - 2"),
      ("Asmnt plan", "Control", "Plan - {}",
       "Asmnt plan<br>Plan - 0<br>Plan - 1<br>Plan - 2"),
      ("Asmnt plan", "Market", "Plan - {}", "Asmnt plan"),
      (None, "Control", None, ""),
      ("", "Control", None, ""),
      ("Asmnt plan", "Control", None, "Asmnt plan"),
      (None, "Control", "", ""),
      ("", "Control", "", ""),
      ("Asmnt plan", "Control", "", "Asmnt plan"),
  )
  @ddt.unpack
  def test_assessment_proc_on_map(self, asmnt_plan, asmnt_type, test_plan,
                                  expected_plan):
    """Test if Snapshot test_plan added to Assessment after mapping"""
    # pylint: disable=too-many-locals
    with factories.single_commit():
      audit = factories.AuditFactory()
      assessment = factories.AssessmentFactory(
          audit=audit, assessment_type=asmnt_type, test_plan=asmnt_plan
      )
      factories.RelationshipFactory(source=audit, destination=assessment)
      controls = [
          factories.ControlFactory(
              test_plan=test_plan.format(i) if test_plan else test_plan
          )
          for i in range(3)
      ]
    snapshots = self._create_snapshots(audit, controls)

    relation = [{
        "relationship": {
            "context": {
                "context_id": None,
                "id": assessment.context_id,
                "type": "Context"
            },
            "destination": {
                "id": snapshot.id,
                "type": "Snapshot"
            },
            "source": {
                "id": assessment.id,
                "type": "Assessment"
            }
        }
    } for snapshot in snapshots]

    response = self.api.post(all_models.Relationship, relation)
    self.assertEqual(response.status_code, 200)

    asmnt = all_models.Assessment.query.get(assessment.id)
    self.assertEqual(asmnt.test_plan, expected_plan)


@ddt.ddt
class TestAssessmentGeneration(TestAssessmentBase):
  """Test assessment generation"""
  # pylint: disable=invalid-name

  def setUp(self):
    super(TestAssessmentGeneration, self).setUp()
    with factories.single_commit():
      self.audit = factories.AuditFactory()
      self.control = factories.ControlFactory(test_plan="Control Test Plan")
      self.snapshot = self._create_snapshots(self.audit, [self.control])[0]

  def test_autogenerated_title(self):
    """Test autogenerated assessment title"""
    control_title = self.control.title
    audit_title = self.audit.title
    response = self.assessment_post()
    title = response.json["assessment"]["title"]
    self.assertIn(audit_title, title)
    self.assertIn(control_title, title)

  def test_autogenerated_assignees_verifiers(self):
    """Test autogenerated assessment assignees"""
    auditor_role = all_models.Role.query.filter_by(name="Auditor").first()

    audit_context = factories.ContextFactory()
    self.audit.context = audit_context

    users = ["user1@example.com", "user2@example.com"]

    auditors = []
    for user in users:
      person = factories.PersonFactory(email=user)
      auditors += [person]

    for auditor in auditors:
      rbac_factories.UserRoleFactory(
          context=audit_context,
          role=auditor_role,
          person=auditor)

    self.assertEqual(
        all_models.UserRole.query.filter_by(
            role=auditor_role,
            context=self.audit.context).count(), 2, "Auditors not present")

    response = self.assessment_post()
    self.assert_assignees("Verifiers", response, *users)

    db.session.add(self.audit)
    self.assert_assignees("Assignees", response, self.audit.contact.email)

    self.assert_assignees("Creators", response, "user@example.com")

  def test_mapped_roles_autogenerated(self):
    """Test mapped assignee roles for generated assessment"""
    auditor_role = all_models.Role.query.filter_by(name="Auditor").first()
    audit_context = factories.ContextFactory()
    self.audit.context = audit_context
    users = ["user1@example.com", "user2@example.com"]
    for user in users:
      auditor = factories.PersonFactory(email=user)
      rbac_factories.UserRoleFactory(
          context=audit_context,
          person=auditor,
          role=auditor_role,
      )

    self.assessment_post()

    # Add objects back to session to have access to their id and type
    mapped_objects = [self.audit, self.snapshot]
    db.session.add_all(mapped_objects)
    for obj in mapped_objects:
      self.assert_mapped_role("Verifiers Mapped", users[0], obj)
      self.assert_mapped_role("Verifiers Mapped", users[1], obj)
      self.assert_mapped_role(
          "Assignees Mapped", self.audit.contact.email, obj
      )
      self.assert_mapped_role("Creators Mapped", "user@example.com", obj)

  def test_template_test_plan(self):
    """Test if generating assessments from template sets default test plan"""
    template = factories.AssessmentTemplateFactory(
        test_plan_procedure=False,
        procedure_description="Assessment Template Test Plan"
    )
    response = self.assessment_post(template)
    self.assertEqual(response.json["assessment"]["test_plan"],
                     template.procedure_description)

  def test_mapped_roles_template(self):
    """Test mapped assignee roles for assessment generated from template """
    template = factories.AssessmentTemplateFactory()
    auditor_role = all_models.Role.query.filter_by(name="Auditor").first()
    audit_context = factories.ContextFactory()
    self.audit.context = audit_context

    users = ["user1@example.com", "user2@example.com"]
    for user in users:
      auditor = factories.PersonFactory(email=user)
      rbac_factories.UserRoleFactory(
          context=audit_context,
          person=auditor,
          role=auditor_role,
      )

    self.assessment_post(template)
    # Add objects back to session to have access to their id and type
    db.session.add(self.audit, self.snapshot)
    for obj in [self.audit, self.snapshot]:
      self.assert_mapped_role("Verifiers Mapped", users[0], obj)
      self.assert_mapped_role("Verifiers Mapped", users[1], obj)
      self.assert_mapped_role(
          "Assignees Mapped", self.audit.contact.email, obj
      )
      self.assert_mapped_role("Creators Mapped", "user@example.com", obj)

  def test_control_test_plan(self):
    """Test test_plan from control"""
    test_plan = self.control.test_plan
    template = factories.AssessmentTemplateFactory(
        test_plan_procedure=True
    )
    response = self.assessment_post(template)
    self.assertEqual(
        response.json["assessment"]["test_plan"],
        "<br>".join([template.procedure_description, test_plan])
    )

  def test_ca_order(self):
    """Test LCA/GCA order in Assessment"""
    template = factories.AssessmentTemplateFactory(
        test_plan_procedure=False,
        procedure_description="Assessment Template Test Plan"
    )

    custom_attribute_definitions = [
        # Global CAs
        {
            "definition_type": "assessment",
            "title": "rich_test_gca",
            "attribute_type": "Rich Text",
            "multi_choice_options": ""
        },
        {
            "definition_type": "assessment",
            "title": "checkbox1_gca",
            "attribute_type": "Checkbox",
            "multi_choice_options": "test checkbox label"
        },
        # Local CAs
        {
            "definition_type": "assessment_template",
            "definition_id": template.id,
            "title": "test text field",
            "attribute_type": "Text",
            "multi_choice_options": ""
        },
        {
            "definition_type": "assessment_template",
            "definition_id": template.id,
            "title": "test RTF",
            "attribute_type": "Rich Text",
            "multi_choice_options": ""
        },
        {
            "definition_type": "assessment_template",
            "definition_id": template.id,
            "title": "test checkbox",
            "attribute_type": "Checkbox",
            "multi_choice_options": "test checkbox label"
        },
    ]

    for attribute in custom_attribute_definitions:
      factories.CustomAttributeDefinitionFactory(**attribute)
    response = self.assessment_post(template)
    self.assertListEqual(
        [u'test text field', u'test RTF', u'test checkbox', u'rich_test_gca',
         u'checkbox1_gca'],
        [cad['title'] for cad in
         response.json["assessment"]["custom_attribute_definitions"]]
    )

  def assert_assignees(self, role, response, *users):
    """Check if Assignee people in response are same with passed users"""
    acls = response.json["assessment"]["access_control_list"]
    asmnt_roles = get_custom_roles_for("Assessment")
    acl_people = all_models.Person.query.filter(
        all_models.Person.id.in_([
            a.get("person", {}).get("id")
            for a in acls if asmnt_roles.get(a.get("ac_role_id")) == role
        ])
    )
    self.assertEqual(list(users), [p.email for p in acl_people])

  def test_autogenerated_assignees_verifiers_with_model(self):
    """Test autogenerated assessment assignees based on template settings."""
    assignee = "user1@example.com"
    verifier = "user2@example.com"
    with factories.single_commit():
      self.audit.context = factories.ContextFactory()
      auditors = {u: factories.PersonFactory(email=u).id
                  for u in [assignee, verifier]}
      template = factories.AssessmentTemplateFactory(
          test_plan_procedure=False,
          procedure_description="Assessment Template Test Plan",
          default_people={
              "assignees": [auditors[assignee]],
              "verifiers": [auditors[verifier]],
          },
      )

    response = self.assessment_post(template)
    self.assert_assignees("Verifiers", response, verifier)
    self.assert_assignees("Assignees", response, assignee)
    self.assert_assignees("Creators", response, "user@example.com")

  @ddt.data(
      ("Principal Assignees", None, ),
      ("Principal Assignees", "Principal Assignees", ),
      ("Principal Assignees", "Secondary Assignees", ),
      ("Principal Assignees", "Primary Contacts", ),
      ("Principal Assignees", "Secondary Contacts", ),
      ("Principal Assignees", "Admin"),

      ("Secondary Assignees", None, ),
      ("Secondary Assignees", "Principal Assignees", ),
      ("Secondary Assignees", "Secondary Assignees", ),
      ("Secondary Assignees", "Primary Contacts", ),
      ("Secondary Assignees", "Secondary Contacts", ),
      ("Secondary Assignees", "Admin", ),

      ("Primary Contacts", None, ),
      ("Primary Contacts", "Principal Assignees", ),
      ("Primary Contacts", "Secondary Assignees", ),
      ("Primary Contacts", "Primary Contacts", ),
      ("Primary Contacts", "Secondary Contacts", ),
      ("Primary Contacts", "Admin", ),

      ("Secondary Contacts", None, ),
      ("Secondary Contacts", "Principal Assignees", ),
      ("Secondary Contacts", "Secondary Assignees", ),
      ("Secondary Contacts", "Primary Contacts", ),
      ("Secondary Contacts", "Secondary Contacts", ),
      ("Secondary Contacts", "Admin", ),

      ("Admin", None,),
      ("Admin", "Principal Assignees",),
      ("Admin", "Secondary Assignees",),
      ("Admin", "Primary Contacts",),
      ("Admin", "Secondary Contacts",),
      ("Admin", "Admin",),
  )
  @ddt.unpack
  def test_autogenerated_assignees_base_on_role(self,
                                                assessor_role,
                                                verifier_role):
    """Test autogenerated assessment assignees base on template settings."""
    assessor = "user1@example.com"
    verifier = "user2@example.com"
    auditors = collections.defaultdict(list)
    with factories.single_commit():
      self.audit.context = factories.ContextFactory()
      auditors[assessor_role].append(factories.PersonFactory(email=assessor))
      if verifier_role is not None:
        auditors[verifier_role].append(factories.PersonFactory(email=verifier))
      for role, people in auditors.iteritems():
        ac_role = all_models.AccessControlRole.query.filter_by(
            name=role,
            object_type=self.snapshot.child_type,
        ).first()
        if not ac_role:
          ac_role = factories.AccessControlRoleFactory(
              name=role,
              object_type=self.snapshot.child_type,
          )
        ac_role_id = ac_role.id
        for user in people:
          factories.AccessControlListFactory(
              person_id=user.id,
              object_id=self.snapshot.child_id,
              object_type=self.snapshot.child_type,
              ac_role_id=ac_role_id,
          )
      default_people = {"assignees": assessor_role}
      if verifier_role is not None:
        default_people["verifiers"] = verifier_role
      template = factories.AssessmentTemplateFactory(
          test_plan_procedure=False,
          procedure_description="Assessment Template Test Plan",
          default_people=default_people
      )
      self.snapshot.revision.content = self.control.log_json()
      db.session.add(self.snapshot.revision)
    response = self.assessment_post(template)
    if assessor_role == verifier_role:
      self.assert_assignees("Verifiers", response, assessor, verifier)
      self.assert_assignees("Assignees", response, assessor, verifier)
    elif verifier_role is None:
      self.assert_assignees("Verifiers", response)
      self.assert_assignees("Assignees", response, assessor)
    else:
      self.assert_assignees("Verifiers", response, verifier)
      self.assert_assignees("Assignees", response, assessor)
    self.assert_assignees("Creators", response, "user@example.com")

  @ddt.data(True, False)
  def test_autogenerated_audit_lead(self, add_verifier):
    """Test autogenerated assessment with audit lead settings."""
    email = "user_1@example.com"
    with factories.single_commit():
      default_people = {"assignees": "Audit Lead"}
      if add_verifier:
        default_people["verifiers"] = "Audit Lead"
      template = factories.AssessmentTemplateFactory(
          test_plan_procedure=False,
          procedure_description="Assessment Template Test Plan",
          default_people=default_people
      )
      self.audit.contact = factories.PersonFactory(email=email)
      db.session.add(self.audit)
    response = self.assessment_post(template)
    self.assert_assignees("Assignees", response, email)
    if add_verifier:
      self.assert_assignees("Verifiers", response, email)
    else:
      self.assert_assignees("Verifiers", response)
    self.assert_assignees("Creators", response, "user@example.com")

  @ddt.data(True, False)
  def test_autogenerated_auditors(self, add_verifier):
    """Test autogenerated assessment with auditor settings."""
    auditor_role = all_models.Role.query.filter_by(name="Auditor").first()

    users = ["user1@example.com", "user2@example.com"]
    with factories.single_commit():
      audit_context = factories.ContextFactory()
      self.audit.context = audit_context
      auditors = [factories.PersonFactory(email=e) for e in users]
      for auditor in auditors:
        rbac_factories.UserRoleFactory(
            context=audit_context,
            role=auditor_role,
            person=auditor)
      default_people = {"assignees": "Auditors"}
      if add_verifier:
        default_people["verifiers"] = "Auditors"
      template = factories.AssessmentTemplateFactory(
          test_plan_procedure=False,
          procedure_description="Assessment Template Test Plan",
          default_people=default_people
      )
    response = self.assessment_post(template)
    self.assert_assignees("Assignees", response, *users)
    if add_verifier:
      self.assert_assignees("Verifiers", response, *users)
    else:
      self.assert_assignees("Verifiers", response)
    self.assert_assignees("Creators", response, "user@example.com")

  def test_autogenerated_no_tmpl(self):
    """Test autogenerated assessment without template ."""
    auditors = ["user1@example.com", "user2@example.com"]
    prince_assignees = ["user3@example.com", "user4@example.com"]
    people = auditors + prince_assignees
    auditor_role = all_models.Role.query.filter_by(name="Auditor").first()
    with factories.single_commit():
      audit_context = factories.ContextFactory()
      self.audit.context = audit_context
      users = [factories.PersonFactory(email=e) for e in people]
      ac_role_id = all_models.AccessControlRole.query.filter_by(
          name="Principal Assignees",
          object_type=self.snapshot.child_type,
      ).first().id
      for user in users:
        if user.email in auditors:
          rbac_factories.UserRoleFactory(
              context=audit_context,
              role=auditor_role,
              person=user)
        else:
          factories.AccessControlListFactory(
              person_id=user.id,
              object_id=self.snapshot.child_id,
              object_type=self.snapshot.child_type,
              ac_role_id=ac_role_id,
          )
      self.snapshot.revision.content = self.control.log_json()
      db.session.add(self.snapshot.revision)
    response = self.assessment_post()
    self.assert_assignees("Assignees", response, *prince_assignees)
    self.assert_assignees("Verifiers", response, *auditors)
    self.assert_assignees("Creators", response, "user@example.com")

  @ddt.data(
      ("Principal Assignees", None, ),
      ("Principal Assignees", "Principal Assignees", ),
      ("Principal Assignees", "Secondary Assignees", ),
      ("Principal Assignees", "Primary Contacts", ),
      ("Principal Assignees", "Secondary Contacts", ),

      ("Secondary Assignees", None, ),
      ("Secondary Assignees", "Principal Assignees", ),
      ("Secondary Assignees", "Secondary Assignees", ),
      ("Secondary Assignees", "Primary Contacts", ),
      ("Secondary Assignees", "Secondary Contacts", ),

      ("Primary Contacts", None, ),
      ("Primary Contacts", "Principal Assignees", ),
      ("Primary Contacts", "Secondary Assignees", ),
      ("Primary Contacts", "Primary Contacts", ),
      ("Primary Contacts", "Secondary Contacts", ),

      ("Secondary Contacts", None, ),
      ("Secondary Contacts", "Principal Assignees", ),
      ("Secondary Contacts", "Secondary Assignees", ),
      ("Secondary Contacts", "Primary Contacts", ),
      ("Secondary Contacts", "Secondary Contacts", ),
  )
  @ddt.unpack
  def test_autogenerated_assignees_base_on_audit(self,
                                                 assessor_role,
                                                 verifier_role):
    """Test autogenerated assessment assignees base on audit setting

    and empty tmpl."""
    assessor = "user1@example.com"
    verifier = "user2@example.com"
    assessor_audit = "auditor@example.com"
    verifier_audit = "verifier@example.com"
    auditors = collections.defaultdict(list)
    auditor_role = all_models.Role.query.filter_by(name="Auditor").first()
    with factories.single_commit():
      self.audit.context = factories.ContextFactory()
      auditors[assessor_role].append(factories.PersonFactory(email=assessor))
      if verifier_role is not None:
        auditors[verifier_role].append(factories.PersonFactory(email=verifier))
      default_people = {"assignees": assessor_role}
      if verifier_role is not None:
        default_people["verifiers"] = verifier_role
      self.audit.contact = factories.PersonFactory(email=assessor_audit)
      db.session.add(self.audit)
      audit_context = factories.ContextFactory()
      self.audit.context = audit_context
      for email in [verifier_audit]:
        rbac_factories.UserRoleFactory(
            context=audit_context,
            role=auditor_role,
            person=factories.PersonFactory(email=email))
      self.snapshot.revision.content = self.control.log_json()
      db.session.add(self.snapshot.revision)
      template = factories.AssessmentTemplateFactory(
          test_plan_procedure=False,
          procedure_description="Assessment Template Test Plan",
          default_people=default_people
      )
    response = self.assessment_post(template)
    self.assert_assignees("Assignees", response, assessor_audit)
    if verifier_role:
      self.assert_assignees("Verifiers", response, verifier_audit)
    else:
      self.assert_assignees("Verifiers", response)
    self.assert_assignees("Creators", response, "user@example.com")

  @ddt.data(
      ("principal_assessor", "Principal Assignees"),
      ("secondary_assessor", "Secondary Assignees"),
      ("contact", "Primary Contacts"),
      ("secondary_contact", "Secondary Contacts"),
  )
  @ddt.unpack
  def test_autogenerated_no_acl_in_snapshot(self, field, role_name):
    """Test autogenerated assessment assignees base on template settings

    and no ACL list in snapshot."""
    email = "{}@example.com".format(field)
    with factories.single_commit():
      person = factories.PersonFactory(email=email, name=field)
      template = factories.AssessmentTemplateFactory(
          test_plan_procedure=False,
          procedure_description="Assessment Template Test Plan",
          default_people={"assignees": role_name}
      )
      content = self.control.log_json()
      content.pop("access_control_list")
      content[field] = {"id": person.id}
      self.snapshot.revision.content = content
      db.session.add(self.snapshot.revision)
    response = self.assessment_post(template)
    self.assert_assignees("Assignees", response, email)

  @ddt.data(1, 2, 3, 4)
  def test_remap_doc_from_assessment(self, test_asmt_num):
    """Test mappings saving for assessment"""
    urls = ["url1", "url2"]
    evidences = ["evidence1", "evidence2"]

    with factories.single_commit():
      asmts = {i: factories.AssessmentFactory() for i in range(1, 4)}

    url_str = "\n".join(urls)
    evidences_str = "\n".join(evidences)
    import_data, update_data = [], []
    for num, asmt in asmts.items():
      import_data.append(collections.OrderedDict([
          ("object_type", "Assessment"),
          ("Code", asmt.slug),
          ("Evidence Url", url_str),
          ("Evidence File", evidences_str),
      ]))
      update_data.append(collections.OrderedDict([
          ("object_type", "Assessment"),
          ("Code", asmt.slug),
          ("Evidence Url", "" if num == test_asmt_num else url_str),
          ("Evidence File", "" if num == test_asmt_num else evidences_str),
      ]))

    res = self.import_data(*import_data)
    self._check_csv_response(res, {})
    res = self.import_data(*update_data)
    self._check_csv_response(res, {})

    for num, asmt in asmts.items():
      asmt = all_models.Assessment.query.get(asmt.id)
      if num == test_asmt_num:
        self.assertFalse(asmt.document_url)
        self.assertFalse(asmt.document_evidence)
      else:
        self.assertEqual([url.link for url in asmt.document_url], urls)
        self.assertEqual([ev.link for ev in asmt.document_evidence], evidences)

  @ddt.data(
      (None, "Control", "Control"),
      (None, "Objective", "Objective"),
      (None, None, "Control"),
      ("Market", "Objective", "Market"),
      ("Objective", "Control", "Objective"),
      ("Objective", "Objective", "Objective"),
      ("Objective", None, "Objective"),
      ("Invalid Type", "Invalid Type", None),
      (None, "Invalid Type", None),
      ("Invalid Type", None, None),
  )
  @ddt.unpack
  def test_generated_assessment_type(self, templ_type, obj_type, exp_type):
    """Test assessment type for generated assessments"""
    template = None
    if templ_type:
      template = factories.AssessmentTemplateFactory(
          template_object_type=templ_type
      )
    assessment_type = None
    if obj_type:
      assessment_type = {"assessment_type": obj_type}

    response = self.assessment_post(
        template=template,
        extra_data=assessment_type
    )
    if exp_type:
      self.assertEqual(response.status_code, 201)
      assessment = all_models.Assessment.query.first()
      self.assertEqual(assessment.assessment_type, exp_type)
    else:
      self.assertEqual(response.status_code, 400)

  def test_changing_text_fields_should_not_change_status(self):
    """Test Assessment does not change status if 'design', 'operationally',
    'notes' posted as empty strings
    """
    test_state = "START_STATE"
    response = self.assessment_post()
    self.assertEqual(response.status_code, 201)
    asmt = all_models.Assessment.query.one()
    self.assertEqual(asmt.status,
                     getattr(all_models.Assessment, test_state))
    response = self.assessment_post(
        extra_data={
            "id": asmt.id,
            "design": "",
            "operationally": "",
            "notes": ""
        }
    )
    self.assertEqual(response.status_code, 201)
    assessment = self.refresh_object(asmt)
    self.assertEqual(assessment.status,
                     getattr(all_models.Assessment, test_state))

  def test_generated_test_plan(self):
    """Check if generated Assessment inherit test plan of Snapshot"""
    test_plan = self.control.test_plan
    response = self.assessment_post()
    self.assertEqual(response.status_code, 201)
    self.assertEqual(response.json["assessment"]["test_plan"], test_plan)
