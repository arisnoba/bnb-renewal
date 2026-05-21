import assert from "node:assert/strict";
import test from "node:test";

import { youtubeThumbnailUrl } from "./youtube";

test("youtubeThumbnailUrl returns the hqdefault thumbnail for a YouTube URL", () => {
  assert.equal(
    youtubeThumbnailUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  );
});

test("youtubeThumbnailUrl returns an empty string for invalid input", () => {
  assert.equal(youtubeThumbnailUrl("https://example.com/video"), "");
  assert.equal(youtubeThumbnailUrl(null), "");
});
