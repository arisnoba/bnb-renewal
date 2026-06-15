import assert from "node:assert/strict";
import test from "node:test";

import type { CollectionConfig, Field, Tab } from "payload";

import { ArtistPress } from "./ArtistPress";
import { News } from "./News";
import { seoTitleLength } from "./seoFields";

type FieldWithName = Field & {
  maxLength?: number;
  minLength?: number;
  name: string;
};

function isNamedField(field: Field, name: string): field is FieldWithName {
  return "name" in field && field.name === name;
}

function tabsFor(collection: CollectionConfig) {
  const tabsField = collection.fields.find((field) => field.type === "tabs") as
    | { tabs: Tab[] }
    | undefined;

  assert.ok(tabsField, `${collection.slug} 컬렉션에 tabs 필드가 있어야 합니다.`);

  return tabsField.tabs;
}

function metaTitleField(collection: CollectionConfig) {
  const metaTab = tabsFor(collection).find((tab) => ("name" in tab && tab.name === "meta") || tab.label === "SEO");

  assert.ok(metaTab, `${collection.slug} 컬렉션에 SEO 탭이 있어야 합니다.`);

  const titleField = metaTab.fields.find((field) => isNamedField(field, "title"));

  assert.ok(titleField, `${collection.slug}.meta.title 필드가 있어야 합니다.`);

  return titleField;
}

test("SEO title fields use the 30 to 50 character range", () => {
  for (const collection of [ArtistPress, News]) {
    const titleField = metaTitleField(collection);

    assert.equal(titleField.minLength, seoTitleLength.minLength);
    assert.equal(titleField.maxLength, seoTitleLength.maxLength);
  }
});
