import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Pool } from "pg";

type ProfileRow = {
  center_values: string[];
  class_name: string | null;
  cohort: string | null;
  id: number;
  name: string;
  slug: string;
};

type ScreenAppearanceRow = {
  center: string;
  class_name: string | null;
  id: number;
  performer_name: string | null;
  project_title: string | null;
  role_name: string | null;
  title: string;
};

type LinkedRow = {
  profile_id: number;
  screen_id: number;
};

type UpdatePlan = {
  className?: string;
  cohort?: string;
  evidence: EvidenceItem[];
  profile: ProfileRow;
};

type ManualProfileLinkPlan = {
  className?: string;
  cohort?: string;
  profile: ProfileRow;
  screen: ScreenAppearanceRow;
  token: string;
  tokenOrder: number;
};

type SkippedManualProfileLink = {
  reason: string;
  screen: ScreenAppearanceRow;
  token: string;
  wantedProfileId: number;
};

type EvidenceItem = {
  className?: string;
  cohort?: string;
  performerName: string;
  projectTitle?: string;
  screenId: number;
};

type ManualLinkedReview = {
  classes: string[];
  cohorts: string[];
  evidence: EvidenceItem[];
  profile: ProfileRow;
  reasons: string[];
};

type UnresolvedTokenReview = {
  candidates: ProfileRow[];
  className?: string;
  cohort?: string;
  normalizedName: string;
  reason: "duplicate-candidates" | "no-profile" | "single-candidate-unlinked";
  screen: ScreenAppearanceRow;
  token: string;
};

const reportPath = path.resolve(
  "docs/reports/profile-class-cohort-manual-review.md",
);
const shouldWrite = process.argv.includes("--write");
const shouldOverwrite = process.argv.includes("--overwrite");
const manualProfileResolutions = [
  { center: "art", cohort: "15기", name: "양소연", profileId: 393 },
  { center: "art", cohort: "17기", name: "이지은", profileId: 928 },
  { center: "art", cohort: "15기", name: "김하연", profileId: 88 },
  { center: "art", cohort: "21기", name: "이지은", profileId: 236 },
  { center: "art", cohort: "23기", name: "이지윤", profileId: 295 },
  { center: "art", cohort: "24기", name: "김민재", profileId: 366 },
  { center: "art", cohort: "26기", name: "이지효", profileId: 434 },
  { center: "art", cohort: "28기", name: "김다예", profileId: 540 },
] as const;

const classRank = new Map([
  ["초급 I Class", 10],
  ["중급 R Class", 20],
  ["중급 RU Class", 30],
  ["고급 U Class", 40],
  ["고급 DA Class", 50],
  ["전문 D Class", 60],
  ["배우 A Class", 70],
  ["하이틴 Class", 80],
]);

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const [profiles, screens, linkedRows] = await Promise.all([
      readProfiles(pool),
      readScreenAppearances(pool),
      readLinkedRows(pool),
    ]);

    const screensById = new Map(screens.map((screen) => [screen.id, screen]));
    const linkedScreenIds = new Set(linkedRows.map((row) => row.screen_id));
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
    const profilesByNormalizedName = groupProfilesByNormalizedName(profiles);
    const { manualLinkPlans, skippedManualLinks } = buildManualProfileLinkPlans({
      linkedScreenIds,
      profilesById,
      screens,
    });
    const effectiveLinkedRows = [
      ...linkedRows,
      ...manualLinkPlans.map((plan) => ({
        profile_id: plan.profile.id,
        screen_id: plan.screen.id,
      })),
    ];
    const effectiveLinkedScreenIds = new Set([
      ...linkedScreenIds,
      ...manualLinkPlans.map((plan) => plan.screen.id),
    ]);
    const linksByProfileId = groupBy(effectiveLinkedRows, (row) => row.profile_id);

    const updatePlans: UpdatePlan[] = [];
    const manualLinkedReviews: ManualLinkedReview[] = [];

    for (const profile of profiles) {
      const links = linksByProfileId.get(profile.id) ?? [];
      const evidence = links
        .map((link) =>
          evidenceFromScreen(profile, screensById.get(link.screen_id)),
        )
        .filter((item): item is EvidenceItem => item !== undefined);
      const classes = uniqueSorted(
        evidence.map((item) => item.className).filter(isNonEmptyText),
      );
      const cohorts = uniqueSorted(
        evidence.map((item) => item.cohort).filter(isNonEmptyText),
      );
      const reasons: string[] = [];

      if (classes.length > 1) {
        reasons.push("출연장면에서 반/클래스가 여러 값으로 확인되어 최고 등급 선택");
      }

      if (cohorts.length > 1) {
        reasons.push("출연장면에서 기수가 여러 값으로 확인되어 낮은 기수 선택");
      }

      if (reasons.length > 0) {
        manualLinkedReviews.push({
          classes,
          cohorts,
          evidence,
          profile,
          reasons,
        });
      }

      const className = highestClassName(classes);
      const cohort = lowestCohort(cohorts);
      const nextPlan: UpdatePlan = { evidence, profile };

      if (
        className &&
        (shouldOverwrite ||
          !isNonEmptyText(profile.class_name) ||
          isHigherClass(className, profile.class_name))
      ) {
        nextPlan.className = className;
      }

      if (
        cohort &&
        (shouldOverwrite ||
          !isNonEmptyText(profile.cohort) ||
          isLowerCohort(cohort, profile.cohort))
      ) {
        nextPlan.cohort = cohort;
      }

      if (nextPlan.className || nextPlan.cohort) {
        updatePlans.push(nextPlan);
      }
    }

    const unresolvedReviews = buildUnresolvedTokenReviews({
      linkedScreenIds: effectiveLinkedScreenIds,
      profilesByNormalizedName,
      screens,
    });

    if (shouldWrite) {
      await applyManualProfileLinks(pool, manualLinkPlans);
      await applyUpdates(pool, updatePlans);
    }

    await writeReport({
      manualLinkedReviews,
      manualLinkPlans,
      skippedManualLinks,
      unresolvedReviews,
      updatePlans,
    });

    console.log(
      JSON.stringify(
        {
          mode: shouldWrite ? "write" : "dry-run",
          reportPath,
          manualProfileLinks: manualLinkPlans.length,
          skippedManualProfileLinks: skippedManualLinks.length,
          safeProfileUpdates: updatePlans.length,
          manualLinkedReviews: manualLinkedReviews.length,
          duplicateCandidateRows: unresolvedReviews.filter(
            (item) => item.reason === "duplicate-candidates",
          ).length,
          noProfileRows: unresolvedReviews.filter(
            (item) => item.reason === "no-profile",
          ).length,
          singleCandidateUnlinkedRows: unresolvedReviews.filter(
            (item) => item.reason === "single-candidate-unlinked",
          ).length,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

async function readProfiles(pool: Pool) {
  const result = await pool.query<ProfileRow>(`
    SELECT
      profiles.id,
      profiles.name,
      profiles.slug,
      profiles.class_name,
      profiles.cohort,
      coalesce(
        array_agg(profiles_centers.value::text ORDER BY profiles_centers.value)
          FILTER (WHERE profiles_centers.value IS NOT NULL),
        ARRAY[]::text[]
      ) AS center_values
    FROM profiles
    LEFT JOIN profiles_centers
      ON profiles_centers.parent_id = profiles.id
    GROUP BY profiles.id, profiles.name, profiles.slug, profiles.class_name, profiles.cohort
    ORDER BY profiles.id
  `);

  return result.rows;
}

async function readScreenAppearances(pool: Pool) {
  const result = await pool.query<ScreenAppearanceRow>(`
    SELECT
      id,
      centers::text AS center,
      title,
      performer_name,
      class_name,
      project_title,
      role_name
    FROM screen_appearances
    ORDER BY id
  `);

  return result.rows;
}

async function readLinkedRows(pool: Pool) {
  const result = await pool.query<LinkedRow>(`
    SELECT
      parent_id AS screen_id,
      profiles_id AS profile_id
    FROM screen_appearances_rels
    WHERE path = 'linkedProfiles'
      AND profiles_id IS NOT NULL
    ORDER BY parent_id, "order", profiles_id
  `);

  return result.rows;
}

function buildManualProfileLinkPlans({
  linkedScreenIds,
  profilesById,
  screens,
}: {
  linkedScreenIds: Set<number>;
  profilesById: Map<number, ProfileRow>;
  screens: ScreenAppearanceRow[];
}) {
  const manualLinkPlans: ManualProfileLinkPlan[] = [];
  const skippedManualLinks: SkippedManualProfileLink[] = [];

  for (const screen of screens) {
    if (linkedScreenIds.has(screen.id)) {
      continue;
    }

    for (const token of performerTokens(screen.performer_name)) {
      const normalizedName = normalizePersonName(token.name);
      const cohort = normalizeCohort(token.cohort);
      const resolution = manualProfileResolutions.find(
        (item) =>
          item.center === screen.center &&
          normalizePersonName(item.name) === normalizedName &&
          item.cohort === cohort,
      );

      if (!resolution) {
        continue;
      }

      const profile = profilesById.get(resolution.profileId);

      if (!profile) {
        skippedManualLinks.push({
          reason: "지정한 프로필 ID가 존재하지 않음",
          screen,
          token: token.raw,
          wantedProfileId: resolution.profileId,
        });
        continue;
      }

      if (!centerMatches(screen.center, profile.center_values)) {
        skippedManualLinks.push({
          reason: `센터 불일치: 출연장면 ${screen.center}, 프로필 ${profile.center_values.join(", ") || "-"}`,
          screen,
          token: token.raw,
          wantedProfileId: resolution.profileId,
        });
        continue;
      }

      manualLinkPlans.push({
        className: normalizeClassName(screen.class_name),
        cohort,
        profile,
        screen,
        token: token.raw,
        tokenOrder: token.tokenOrder,
      });
    }
  }

  return { manualLinkPlans, skippedManualLinks };
}

function evidenceFromScreen(
  profile: ProfileRow,
  screen?: ScreenAppearanceRow,
): EvidenceItem | undefined {
  if (!screen) {
    return undefined;
  }

  const tokens = performerTokens(screen.performer_name);
  const profileName = normalizePersonName(profile.name);
  const matchingToken = tokens.find(
    (token) => normalizePersonName(token.name) === profileName,
  );
  const fallbackToken = tokens.length === 1 ? tokens[0] : undefined;
  const cohort = normalizeCohort(
    matchingToken?.cohort ?? fallbackToken?.cohort,
  );
  const className = normalizeClassName(screen.class_name);

  if (!className && !cohort) {
    return undefined;
  }

  return {
    className,
    cohort,
    performerName: screen.performer_name ?? "",
    projectTitle: screen.project_title ?? undefined,
    screenId: screen.id,
  };
}

function buildUnresolvedTokenReviews({
  linkedScreenIds,
  profilesByNormalizedName,
  screens,
}: {
  linkedScreenIds: Set<number>;
  profilesByNormalizedName: Map<string, ProfileRow[]>;
  screens: ScreenAppearanceRow[];
}) {
  const reviews: UnresolvedTokenReview[] = [];

  for (const screen of screens) {
    if (linkedScreenIds.has(screen.id)) {
      continue;
    }

    for (const token of performerTokens(screen.performer_name)) {
      const normalizedName = normalizePersonName(token.name);

      if (!normalizedName) {
        continue;
      }

      const candidates = (
        profilesByNormalizedName.get(normalizedName) ?? []
      ).filter((profile) =>
        centerMatches(screen.center, profile.center_values),
      );
      const className = normalizeClassName(screen.class_name);
      const cohort = normalizeCohort(token.cohort);

      if (candidates.length === 0) {
        reviews.push({
          candidates,
          className,
          cohort,
          normalizedName,
          reason: "no-profile",
          screen,
          token: token.raw,
        });
      } else if (candidates.length === 1) {
        reviews.push({
          candidates,
          className,
          cohort,
          normalizedName,
          reason: "single-candidate-unlinked",
          screen,
          token: token.raw,
        });
      } else {
        reviews.push({
          candidates,
          className,
          cohort,
          normalizedName,
          reason: "duplicate-candidates",
          screen,
          token: token.raw,
        });
      }
    }
  }

  return reviews;
}

async function applyManualProfileLinks(
  pool: Pool,
  manualLinkPlans: ManualProfileLinkPlan[],
) {
  for (const plan of manualLinkPlans) {
    await pool.query(
      `
        INSERT INTO screen_appearances_rels (
          "order",
          parent_id,
          path,
          profiles_id
        )
        SELECT $2, $1, 'linkedProfiles', $3
        WHERE NOT EXISTS (
          SELECT 1
          FROM screen_appearances_rels
          WHERE parent_id = $1
            AND path = 'linkedProfiles'
            AND profiles_id = $3
        )
      `,
      [plan.screen.id, plan.tokenOrder, plan.profile.id],
    );
  }
}

async function applyUpdates(pool: Pool, updatePlans: UpdatePlan[]) {
  for (const plan of updatePlans) {
    await pool.query(
      `
        UPDATE profiles
        SET
          class_name = coalesce($2, class_name),
          cohort = coalesce($3, cohort),
          updated_at = now()
        WHERE id = $1
      `,
      [plan.profile.id, plan.className, plan.cohort],
    );
  }
}

async function writeReport({
  manualLinkedReviews,
  manualLinkPlans,
  skippedManualLinks,
  unresolvedReviews,
  updatePlans,
}: {
  manualLinkedReviews: ManualLinkedReview[];
  manualLinkPlans: ManualProfileLinkPlan[];
  skippedManualLinks: SkippedManualProfileLink[];
  unresolvedReviews: UnresolvedTokenReview[];
  updatePlans: UpdatePlan[];
}) {
  await mkdir(path.dirname(reportPath), { recursive: true });

  const duplicateCandidates = unresolvedReviews.filter(
    (item) => item.reason === "duplicate-candidates",
  );
  const singleCandidateUnlinked = unresolvedReviews.filter(
    (item) => item.reason === "single-candidate-unlinked",
  );
  const noProfile = unresolvedReviews.filter(
    (item) => item.reason === "no-profile",
  );
  const now = new Date().toISOString();
  const lines: string[] = [
    "# 프로필 반/기수 수동 검수 리포트",
    "",
    `- 생성일: ${now}`,
    `- 실행 모드: ${shouldWrite ? "write" : "dry-run"}`,
    "- 자동 백필 기준: 연결된 출연장면의 반/클래스는 최고 등급, 기수는 가장 낮은 숫자 선택",
    "- 수동 매칭 기준: 사용자가 지정한 동명이인 프로필 ID 중 센터가 일치하는 출연장면",
    "- 수동 검수 기준: 동명이인 후보, 프로필 미존재, 단일 후보지만 아직 연결되지 않은 출연장면",
    "- 관리자 경로는 로컬 기준이며 브라우저 주소 뒤에 붙여 확인",
    "",
    "## 요약",
    "",
    `- 수동 프로필 연결: ${manualLinkPlans.length}건`,
    `- 수동 프로필 연결 보류: ${skippedManualLinks.length}건`,
    `- 자동 백필 대상 프로필: ${updatePlans.length}건`,
    `- 복수 반/기수 자동 선택 프로필: ${manualLinkedReviews.length}건`,
    `- 동명이인 후보 출연장면: ${duplicateCandidates.length}건`,
    `- 단일 후보지만 미연결 출연장면: ${singleCandidateUnlinked.length}건`,
    `- 프로필 없음 출연장면: ${noProfile.length}건`,
    "",
  ];

  lines.push("## 수동 프로필 연결");
  lines.push("");
  lines.push("| 출연장면 | 센터 | 출연자 | 연결 프로필 | 반/클래스 | 기수 |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const plan of sortManualLinkPlans(manualLinkPlans)) {
    lines.push(
      [
        screenLink(plan.screen),
        escapeCell(plan.screen.center),
        escapeCell(plan.token),
        profileLink(plan.profile),
        escapeCell(plan.className ?? "-"),
        escapeCell(plan.cohort ?? "-"),
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    );
  }
  if (manualLinkPlans.length === 0) {
    lines.push("| - | - | - | - | - | - |");
  }
  lines.push("");

  lines.push("## 수동 프로필 연결 보류");
  lines.push("");
  lines.push("| 출연장면 | 센터 | 출연자 | 지정 프로필 ID | 사유 |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const skipped of sortSkippedManualLinks(skippedManualLinks)) {
    lines.push(
      [
        screenLink(skipped.screen),
        escapeCell(skipped.screen.center),
        escapeCell(skipped.token),
        String(skipped.wantedProfileId),
        escapeCell(skipped.reason),
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    );
  }
  if (skippedManualLinks.length === 0) {
    lines.push("| - | - | - | - | - |");
  }
  lines.push("");

  lines.push("## 자동 백필 대상");
  lines.push("");
  lines.push("| 프로필 | 현재 작업 | 근거 출연장면 |");
  lines.push("| --- | --- | --- |");
  for (const plan of sortUpdatePlans(updatePlans)) {
    lines.push(
      `| ${profileLink(plan.profile)} | ${profileUpdateSummary(plan)} | ${evidenceSummary(plan.evidence)} |`,
    );
  }
  if (updatePlans.length === 0) {
    lines.push("| - | - | - |");
  }
  lines.push("");

  lines.push("## 복수 반/기수 자동 선택");
  lines.push("");
  lines.push(
    "| 프로필 | 선택 기준 | 확인된 반/클래스 | 확인된 기수 | 근거 출연장면 |",
  );
  lines.push("| --- | --- | --- | --- | --- |");
  for (const review of sortManualLinkedReviews(manualLinkedReviews)) {
    lines.push(
      `| ${profileLink(review.profile)} | ${escapeCell(review.reasons.join("<br>"))} | ${escapeCell(review.classes.join("<br>") || "-")} | ${escapeCell(review.cohorts.join("<br>") || "-")} | ${evidenceSummary(review.evidence)} |`,
    );
  }
  if (manualLinkedReviews.length === 0) {
    lines.push("| - | - | - | - | - |");
  }
  lines.push("");

  appendUnresolvedSection(lines, "동명이인 후보", duplicateCandidates);
  appendUnresolvedSection(
    lines,
    "단일 후보지만 미연결",
    singleCandidateUnlinked,
  );
  appendUnresolvedSection(lines, "프로필 없음", noProfile);

  await writeFile(reportPath, `${lines.join("\n")}\n`);
}

function appendUnresolvedSection(
  lines: string[],
  title: string,
  reviews: UnresolvedTokenReview[],
) {
  lines.push(`## ${title}`);
  lines.push("");
  lines.push(
    "| 출연장면 | 센터 | 출연자 | 반/클래스 | 기수 | 작품명 | 역할 | 후보 프로필 |",
  );
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const review of reviews) {
    lines.push(
      [
        screenLink(review.screen),
        escapeCell(review.screen.center),
        escapeCell(review.token),
        escapeCell(review.className ?? "-"),
        escapeCell(review.cohort ?? "-"),
        escapeCell(review.screen.project_title ?? "-"),
        escapeCell(review.screen.role_name ?? "-"),
        candidateSummary(review.candidates),
      ]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    );
  }
  if (reviews.length === 0) {
    lines.push("| - | - | - | - | - | - | - | - |");
  }
  lines.push("");
}

function performerTokens(value: string | null) {
  return String(value ?? "")
    .split(/[,，/&·ㆍ]|[ \t]+외[ \t]+|[ \t]+및[ \t]+/g)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw, index) => ({
      cohort: extractCohort(raw),
      name: raw,
      raw,
      tokenOrder: index + 1,
    }));
}

function extractCohort(value: string) {
  return normalizeCohort(value.match(/(\d+\s*기)/)?.[1]);
}

function normalizeClassName(value: unknown) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\bCLASS\b/gi, "Class")
    .trim();

  return text || undefined;
}

function normalizeCohort(value: unknown) {
  const text = String(value ?? "")
    .replace(/\s+/g, "")
    .trim();

  return /^\d+기$/.test(text) ? text : undefined;
}

function normalizePersonName(value: unknown) {
  return String(value ?? "")
    .replace(/\([^)]*\)/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[ \t\r\n]+/g, "")
    .replace(/배우$/g, "")
    .replace(/[군양님]$/g, "")
    .trim();
}

function groupProfilesByNormalizedName(profiles: ProfileRow[]) {
  const map = new Map<string, ProfileRow[]>();

  for (const profile of profiles) {
    const normalized = normalizePersonName(profile.name);

    if (!normalized) {
      continue;
    }

    const list = map.get(normalized) ?? [];
    list.push(profile);
    map.set(normalized, list);
  }

  return map;
}

function centerMatches(screenCenter: string, profileCenters: string[]) {
  return (
    screenCenter === "all" ||
    profileCenters.includes("all") ||
    profileCenters.includes(screenCenter)
  );
}

function groupBy<T, K>(items: T[], getKey: (item: T) => K) {
  const map = new Map<K, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }

  return map;
}

function uniqueSorted(items: string[]) {
  return Array.from(new Set(items)).sort((left, right) =>
    left.localeCompare(right, "ko"),
  );
}

function highestClassName(items: string[]) {
  return uniqueSorted(items).sort(
    (left, right) => getClassRank(right) - getClassRank(left),
  )[0];
}

function lowestCohort(items: string[]) {
  return uniqueSorted(items).sort(
    (left, right) => getCohortNumber(left) - getCohortNumber(right),
  )[0];
}

function isHigherClass(nextValue: string, currentValue: string | null) {
  return getClassRank(nextValue) > getClassRank(normalizeClassName(currentValue));
}

function isLowerCohort(nextValue: string, currentValue: string | null) {
  return getCohortNumber(nextValue) < getCohortNumber(currentValue);
}

function getClassRank(value: string | undefined) {
  if (!value) {
    return -1;
  }

  return classRank.get(value) ?? 0;
}

function getCohortNumber(value: string | null | undefined) {
  const match = String(value ?? "").match(/^(\d+)기$/);

  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function sortUpdatePlans(items: UpdatePlan[]) {
  return [...items].sort((left, right) => compareProfiles(left.profile, right.profile));
}

function sortManualLinkedReviews(items: ManualLinkedReview[]) {
  return [...items].sort((left, right) => compareProfiles(left.profile, right.profile));
}

function sortManualLinkPlans(items: ManualProfileLinkPlan[]) {
  return [...items].sort(
    (left, right) =>
      compareScreens(left.screen, right.screen) || compareProfiles(left.profile, right.profile),
  );
}

function sortSkippedManualLinks(items: SkippedManualProfileLink[]) {
  return [...items].sort((left, right) => compareScreens(left.screen, right.screen));
}

function compareProfiles(left: ProfileRow, right: ProfileRow) {
  return (
    (left.center_values[0] ?? "").localeCompare(right.center_values[0] ?? "ko") ||
    left.name.localeCompare(right.name, "ko") ||
    left.id - right.id
  );
}

function compareScreens(left: ScreenAppearanceRow, right: ScreenAppearanceRow) {
  return (
    left.center.localeCompare(right.center, "ko") ||
    normalizePersonName(left.performer_name).localeCompare(
      normalizePersonName(right.performer_name),
      "ko",
    ) ||
    left.id - right.id
  );
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function profileLink(profile: ProfileRow) {
  return `${escapeCell(profile.name)} (#${profile.id}, ${escapeCell(profile.center_values.join(", ") || "-")}, ${escapeCell(profile.slug)})<br>/admin/collections/profiles/${profile.id}`;
}

function screenLink(screen: ScreenAppearanceRow) {
  return `${escapeCell(screen.title)} (#${screen.id})<br>/admin/collections/screen-appearances/${screen.id}`;
}

function profileUpdateSummary(plan: UpdatePlan) {
  const updates = [
    plan.className ? `반/클래스: ${plan.className}` : undefined,
    plan.cohort ? `기수: ${plan.cohort}` : undefined,
  ].filter(isNonEmptyText);

  return escapeCell(updates.join("<br>"));
}

function evidenceSummary(evidence: EvidenceItem[]) {
  const items = evidence.slice(0, 5).map((item) => {
    const values = [
      item.className ? `반/클래스 ${item.className}` : undefined,
      item.cohort ? `기수 ${item.cohort}` : undefined,
    ]
      .filter(isNonEmptyText)
      .join(", ");
    const project = item.projectTitle ? ` ${item.projectTitle}` : "";

    return `#${item.screenId}${project}${values ? ` (${values})` : ""}`;
  });

  if (evidence.length > 5) {
    items.push(`외 ${evidence.length - 5}건`);
  }

  return escapeCell(items.join("<br>") || "-");
}

function candidateSummary(candidates: ProfileRow[]) {
  if (candidates.length === 0) {
    return "-";
  }

  return candidates.map(profileLink).join("<br>");
}

function escapeCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
