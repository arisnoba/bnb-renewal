const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;

export function extractYouTubeVideoId(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (youtubeIdPattern.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return youtubeIdPattern.test(id) ? id : "";
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const watchId = url.searchParams.get("v") ?? "";

      if (youtubeIdPattern.test(watchId)) {
        return watchId;
      }

      const [kind, id] = url.pathname.split("/").filter(Boolean);

      if (
        ["embed", "live", "shorts"].includes(kind ?? "") &&
        youtubeIdPattern.test(id ?? "")
      ) {
        return id ?? "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}
