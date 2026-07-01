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

async function runSeoSyncHook(collection: CollectionConfig, args: Record<string, unknown>) {
  const hook = collection.hooks?.beforeValidate?.[0];

  assert.ok(hook, `${collection.slug} 컬렉션에 beforeValidate hook이 있어야 합니다.`);

  return (await hook(args as never)) as {
    meta?: {
      image?: unknown;
      title?: unknown;
    };
    thumbnailMedia?: unknown;
  };
}

test("SEO meta image is filled from representative image when empty", async () => {
  for (const collection of [ArtistPress, News]) {
    const data = await runSeoSyncHook(collection, {
      data: {
        meta: {
          title: "SEO 제목",
        },
        thumbnailMedia: 10,
      },
      originalDoc: undefined,
    });

    assert.equal(data.meta?.image, 10);
    assert.equal(data.meta?.title, "SEO 제목");
  }
});

test("SEO meta image follows representative image only while auto-synced", async () => {
  const autoSynced = await runSeoSyncHook(News, {
    data: {
      meta: {},
      thumbnailMedia: 11,
    },
    originalDoc: {
      meta: {
        image: 10,
      },
      thumbnailMedia: 10,
    },
  });

  assert.equal(autoSynced.meta?.image, 11);

  const customMeta = await runSeoSyncHook(News, {
    data: {
      meta: {
        title: "수동 SEO",
      },
      thumbnailMedia: 11,
    },
    originalDoc: {
      meta: {
        image: 99,
      },
      thumbnailMedia: 10,
    },
  });

  assert.equal(customMeta.meta?.image, 99);
  assert.equal(customMeta.meta?.title, "수동 SEO");
});
