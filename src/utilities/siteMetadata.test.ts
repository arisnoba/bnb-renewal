import assert from "node:assert/strict";
import test from "node:test";

import { getSiteTitle, withSiteTitle } from "./siteMetadata";

test("site title defaults to the BNB title", () => {
  const originalTitle = process.env.NEXT_PUBLIC_SITE_TITLE;

  delete process.env.NEXT_PUBLIC_SITE_TITLE;

  try {
    assert.equal(getSiteTitle(), "배우앤배움");
    assert.equal(withSiteTitle("한지현"), "한지현 | 배우앤배움");
    assert.equal(withSiteTitle(""), "배우앤배움");
  } finally {
    if (originalTitle === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_TITLE;
    } else {
      process.env.NEXT_PUBLIC_SITE_TITLE = originalTitle;
    }
  }
});

test("site title uses NEXT_PUBLIC_SITE_TITLE when configured", () => {
  const originalTitle = process.env.NEXT_PUBLIC_SITE_TITLE;

  process.env.NEXT_PUBLIC_SITE_TITLE = "배우앤배움 아트센터";

  try {
    assert.equal(getSiteTitle(), "배우앤배움 아트센터");
    assert.equal(withSiteTitle("출신 아티스트"), "출신 아티스트 | 배우앤배움 아트센터");
  } finally {
    if (originalTitle === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_TITLE;
    } else {
      process.env.NEXT_PUBLIC_SITE_TITLE = originalTitle;
    }
  }
});
