import assert from "node:assert/strict";
import test from "node:test";

import { CastingAppearances } from "./CastingAppearances";
import { centerFrontendPaths } from "./revalidateFrontend";

test("casting appearances revalidate casting status pages after writes", () => {
  assert.equal(CastingAppearances.hooks?.afterChange?.length, 1);
  assert.equal(CastingAppearances.hooks?.afterDelete?.length, 1);
});

test("casting status revalidation paths use selected centers", () => {
  assert.deepEqual(centerFrontendPaths({ centers: ["art"], suffixes: ["casting-status"] }), [
    "/art/casting-status",
  ]);
  assert.deepEqual(centerFrontendPaths({ centers: ["art", "kids"], suffixes: ["casting-status"] }), [
    "/art/casting-status",
    "/kids/casting-status",
  ]);
  assert.deepEqual(
    centerFrontendPaths({
      centers: ["kids"],
      previousCenters: ["art"],
      suffixes: ["casting-status"],
    }),
    ["/kids/casting-status", "/art/casting-status"],
  );
});

test("casting status revalidation paths expand all centers once", () => {
  assert.deepEqual(
    centerFrontendPaths({
      centers: ["all"],
      previousCenters: ["art"],
      suffixes: ["casting-status"],
    }),
    [
      "/art/casting-status",
      "/exam/casting-status",
      "/kids/casting-status",
      "/highteen/casting-status",
      "/avenue/casting-status",
    ],
  );
});
