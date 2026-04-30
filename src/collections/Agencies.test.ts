import assert from "node:assert/strict";
import test from "node:test";

import type { Field, Tab } from "payload";

import { Agencies } from "./Agencies";

type FieldWithName = Field & { name: string };

function isNamedField(field: Field, name: string): field is FieldWithName {
  return "name" in field && field.name === name;
}

function getTabs() {
  const tabsField = Agencies.fields.find((field) => field.type === "tabs") as
    | { tabs: Tab[] }
    | undefined;

  assert.ok(tabsField, "agencies 컬렉션에 tabs 필드가 있어야 합니다.");

  return tabsField.tabs;
}

test("agency actors use actor-name row labels", () => {
  const tabs = getTabs();
  const actorsTab = tabs.find((tab) => tab.label === "출신 배우");

  assert.ok(actorsTab, "출신 배우 탭이 있어야 합니다.");

  const actorsField = actorsTab.fields.find((field) =>
    isNamedField(field, "actors"),
  ) as FieldWithName | undefined;

  assert.ok(actorsField, "actors 배열 필드가 있어야 합니다.");
  assert.equal(actorsField.type, "array");
  assert.equal(actorsField.label, "출신 배우");
  assert.deepEqual(actorsField.labels, {
    plural: "출신 배우",
    singular: "출신 배우",
  });
  assert.equal(
    actorsField.admin?.components?.RowLabel,
    "@/components/payload/AgencyActorRowLabel#AgencyActorRowLabel",
  );
});
