import assert from "node:assert/strict";
import test from "node:test";

import { CastingAppearances, castingStatusCenterPaths } from "./CastingAppearances";

test("casting appearances revalidate casting status pages after writes", () => {
  assert.equal(CastingAppearances.hooks?.afterChange?.length, 1);
  assert.equal(CastingAppearances.hooks?.afterDelete?.length, 1);
});

test("casting status revalidation paths use selected centers", () => {
  assert.deepEqual(castingStatusCenterPaths(["art"]), ["/art/casting-status"]);
  assert.deepEqual(castingStatusCenterPaths(["art", "kids"]), [
    "/art/casting-status",
    "/kids/casting-status",
  ]);
  assert.deepEqual(castingStatusCenterPaths(["kids"], ["art"]), [
    "/kids/casting-status",
    "/art/casting-status",
  ]);
});

test("casting status revalidation paths expand all centers once", () => {
  assert.deepEqual(castingStatusCenterPaths(["all"], ["art"]), [
    "/art/casting-status",
    "/exam/casting-status",
    "/kids/casting-status",
    "/highteen/casting-status",
    "/avenue/casting-status",
  ]);
});
