const blockBreakPattern =
  /<\/?(?:address|article|aside|blockquote|div|figcaption|figure|footer|h[1-6]|header|li|main|nav|ol|p|section|table|tbody|td|tfoot|th|thead|tr|ul)[^>]*>/gi;

const htmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

type ProfileCareerItem = { content: string; title: string };

const boldTitlePattern = /<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi;

const profileCareerTitleValues = new Set(
  [
    "드라마",
    "웹드라마",
    "영화",
    "단편영화",
    "독립영화",
    "광고",
    "cf",
    "뮤직비디오",
    "mv",
    "방송",
    "예능",
    "연극",
    "공연",
    "뮤지컬",
    "모델",
    "화보",
    "수상",
    "경력",
    "활동",
    "기타",
  ].map(normalizeCareerTitle),
);

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#\d+|#[xX][\da-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);

      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);

      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return htmlEntities[entity] ?? match;
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeCareerTitle(value: string) {
  return value.replace(/\s+/g, "").replace(/[:：]$/g, "").toLowerCase();
}

function cleanProfileCareerTitle(value: unknown) {
  return profileBodyLines(value)
    .join(" ")
    .replace(/[\u00a0\u200b\u200c\u200d\ufeff]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[>＞:：]+$/g, "")
    .trim();
}

function profileBodyLines(value: unknown) {
  return decodeHtmlEntities(
    cleanProfileBodyHtml(value)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function cleanProfileBodyHtml(value: unknown) {
  const source = String(value ?? "").trim();

  if (!source) {
    return "";
  }

  const textContent = decodeHtmlEntities(
    source
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<span\b[^>]*id=["']?husky_bookmark_[^>]*><\/span>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(blockBreakPattern, "\n")
      .replace(/<[^>]+>/g, ""),
  );

  const lines = textContent
    .replace(/[\u00a0\u200b\u200c\u200d\ufeff]/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return lines.map(escapeHtml).join("<br>");
}

function parseProfileCareerItemsByBold(source: string): ProfileCareerItem[] {
  const matches = Array.from(source.matchAll(boldTitlePattern));

  if (matches.length === 0) {
    return [];
  }

  return matches
    .map((match, index) => {
      const title = cleanProfileCareerTitle(match[2]);
      const sectionStart = (match.index ?? 0) + match[0].length;
      const nextMatch = matches[index + 1];
      const sectionEnd = nextMatch?.index ?? source.length;
      const content = profileBodyLines(source.slice(sectionStart, sectionEnd));

      return {
        content: content.join("\n"),
        title,
      };
    })
    .filter(({ content, title }) => title && content);
}

function parseProfileCareerItemsByKnownTitles(value: unknown): ProfileCareerItem[] {
  const careerItems: ProfileCareerItem[] = [];
  let currentTitle = "";
  let currentContent: string[] = [];

  function pushCurrentItem() {
    if (!currentTitle || currentContent.length === 0) {
      return;
    }

    careerItems.push({
      content: currentContent.join("\n"),
      title: currentTitle,
    });
  }

  for (const line of profileBodyLines(value)) {
    if (profileCareerTitleValues.has(normalizeCareerTitle(line))) {
      pushCurrentItem();
      currentTitle = line.replace(/[:：]$/g, "");
      currentContent = [];
      continue;
    }

    if (currentTitle) {
      currentContent.push(line);
    }
  }

  pushCurrentItem();

  return careerItems;
}

function parseCareerItemsByTableRows(source: string): ProfileCareerItem[] {
  const rows = Array.from(source.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi));

  if (rows.length === 0) {
    return [];
  }

  return rows
    .map((row) => {
      const rowHtml = row[1];
      const titleMatch = rowHtml.match(/<th\b[^>]*>([\s\S]*?)<\/th>/i);
      const contentMatch = rowHtml.match(/<td\b[^>]*>([\s\S]*?)<\/td>/i);

      if (!titleMatch || !contentMatch) {
        return undefined;
      }

      const title = cleanProfileCareerTitle(titleMatch[1]);
      const content = profileBodyLines(contentMatch[1]).join("\n");

      return title && content
        ? {
            content,
            title,
          }
        : undefined;
    })
    .filter((item): item is ProfileCareerItem => Boolean(item));
}

export function parseProfileCareerItems(value: unknown) {
  const source = String(value ?? "").trim();

  if (!source) {
    return [];
  }

  const boldCareerItems = parseProfileCareerItemsByBold(source);

  if (boldCareerItems.length > 0) {
    return boldCareerItems;
  }

  return parseProfileCareerItemsByKnownTitles(source);
}

export function parseTeacherCareerItems(value: unknown) {
  const source = String(value ?? "").trim();

  if (!source) {
    return [];
  }

  const tableCareerItems = parseCareerItemsByTableRows(source);

  if (tableCareerItems.length > 0) {
    return tableCareerItems;
  }

  return parseProfileCareerItems(source);
}
