import assert from "node:assert/strict";
import test from "node:test";

import type { CollectionConfig, Field, Tab } from "payload";

import { CastingAppearances } from "./CastingAppearances";
import { ExamPassedReviews } from "./ExamPassedReviews";
import { Profiles } from "./Profiles";

type FieldWithName = Field & {
  name: string;
  labels?: unknown;
  admin?: {
    components?: {
      RowLabel?: unknown;
    };
    initCollapsed?: boolean;
  };
};

function isNamedField(field: Field, name: string): field is FieldWithName {
  return "name" in field && field.name === name;
}

function getTabs(collection: CollectionConfig) {
  const tabsField = collection.fields.find((field) => field.type === "tabs") as
    | { tabs: Tab[] }
    | undefined;

  assert.ok(tabsField, `${collection.slug} 컬렉션에 tabs 필드가 있어야 합니다.`);

  return tabsField.tabs;
}

function getTabField(collection: CollectionConfig, tabLabel: string, fieldName: string) {
  const tab = getTabs(collection).find((item) => item.label === tabLabel);

  assert.ok(tab, `${collection.slug} 컬렉션에 ${tabLabel} 탭이 있어야 합니다.`);

  const field = tab.fields.find((item) => isNamedField(item, fieldName));

  assert.ok(field, `${collection.slug}.${fieldName} 필드가 있어야 합니다.`);

  return field;
}

function getTopLevelField(collection: CollectionConfig, fieldName: string) {
  const field = collection.fields.find((item) => isNamedField(item, fieldName));

  assert.ok(field, `${collection.slug}.${fieldName} 필드가 있어야 합니다.`);

  return field;
}

test("profile career items use title row labels", () => {
  const field = getTabField(Profiles, "경력관리", "careerItems");

  assert.equal(field.type, "array");
  assert.deepEqual(field.labels, {
    plural: "경력",
    singular: "경력",
  });
  assert.equal(
    field.admin?.components?.RowLabel,
    "@/components/payload/ProfileCareerRowLabel#ProfileCareerRowLabel",
  );
});

test("casting appearance cast members use actor row labels", () => {
  const field = getTabField(CastingAppearances, "출연자", "castMembers");

  assert.equal(field.type, "array");
  assert.deepEqual(field.labels, {
    plural: "출연자",
    singular: "출연자",
  });
  assert.equal(field.admin?.initCollapsed, false);
  assert.equal(
    field.admin?.components?.RowLabel,
    "@/components/payload/CastingAppearanceCastMemberRowLabel#CastingAppearanceCastMemberRowLabel",
  );
});

test("exam passed review interviews use question row labels", () => {
  const field = getTopLevelField(ExamPassedReviews, "interviews");

  assert.equal(field.type, "array");
  assert.deepEqual(field.labels, {
    plural: "인터뷰",
    singular: "인터뷰",
  });
  assert.equal(
    field.admin?.components?.RowLabel,
    "@/components/payload/ExamPassedReviewInterviewRowLabel#ExamPassedReviewInterviewRowLabel",
  );
});
