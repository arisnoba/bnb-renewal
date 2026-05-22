import assert from "node:assert/strict";
import test from "node:test";

import type { CollectionConfig, Field, Tab } from "payload";

import { Appearances } from "./Appearances";
import { AppearancesExtra } from "./AppearancesExtra";
import { ArtistPress } from "./ArtistPress";
import { ArtistPressAgencies } from "./ArtistPressAgencies";
import { CastingAppearances } from "./CastingAppearances";
import { Directings } from "./Directings";
import { DirectCastings } from "./DirectCastings";
import { Dramas } from "./Dramas";
import { ExamPassedReviews } from "./ExamPassedReviews";
import { Histories } from "./Histories";
import { HighteenSpecialClasses } from "./HighteenSpecialClasses";
import { Lineups } from "./Lineups";
import { Movies } from "./Movies";
import { Profiles } from "./Profiles";
import { Reviews } from "./Reviews";
import { Shoots } from "./Shoots";
import { slugField } from "./shared";
import { TeacherFiles } from "./TeacherFiles";

type FieldWithName = Field & {
  fields?: Field[];
  label?: unknown;
  name: string;
  labels?: unknown;
  required?: boolean;
  admin?: {
    components?: {
      RowLabel?: unknown;
    };
    description?: unknown;
    initCollapsed?: boolean;
  };
};

function isNamedField(field: Field, name: string): field is FieldWithName {
  return "name" in field && field.name === name;
}

function getTabs(collection: CollectionConfig) {
  const tabsField = collection.fields.find((field) => field.type === "tabs") as
    | { tabs: Tab[] }
    | undefined;

  assert.ok(tabsField, `${collection.slug} 컬렉션에 tabs 필드가 있어야 합니다.`);

  return tabsField.tabs;
}

function getTab(collection: CollectionConfig, tabLabel: string) {
  const tab = getTabs(collection).find((item) => item.label === tabLabel);

  assert.ok(tab, `${collection.slug} 컬렉션에 ${tabLabel} 탭이 있어야 합니다.`);

  return tab;
}

function getTabField(collection: CollectionConfig, tabLabel: string, fieldName: string) {
  const tab = getTab(collection, tabLabel);

  const field = tab.fields.find((item) => isNamedField(item, fieldName));

  assert.ok(field, `${collection.slug}.${fieldName} 필드가 있어야 합니다.`);

  return field;
}

function getTopLevelField(collection: CollectionConfig, fieldName: string) {
  const field = collection.fields.find((item) => isNamedField(item, fieldName));

  assert.ok(field, `${collection.slug}.${fieldName} 필드가 있어야 합니다.`);

  return field;
}

function hasTopLevelField(collection: CollectionConfig, fieldName: string) {
  return collection.fields.some((item) => isNamedField(item, fieldName));
}

test("profile career items use title row labels", () => {
  const field = getTabField(Profiles, "경력관리", "careerItems");

  assert.equal(field.type, "array");
  assert.deepEqual(field.labels, {
    plural: "경력",
    singular: "경력",
  });
  assert.equal(
    field.admin?.components?.RowLabel,
    "@/components/payload/ProfileCareerRowLabel#ProfileCareerRowLabel",
  );
});

test("casting appearance cast members use actor row labels", () => {
  const field = getTabField(CastingAppearances, "캐스팅/출연자", "castMembers");

  assert.equal(field.type, "array");
  assert.deepEqual(field.labels, {
    plural: "출연자",
    singular: "출연자",
  });
  assert.equal(field.admin?.initCollapsed, false);
  assert.equal(
    field.admin?.components?.RowLabel,
    "@/components/payload/CastingAppearanceCastMemberRowLabel#CastingAppearanceCastMemberRowLabel",
  );
});

test("exam passed review interviews use question row labels", () => {
  const field = getTopLevelField(ExamPassedReviews, "interviews");

  assert.equal(field.type, "array");
  assert.deepEqual(field.labels, {
    plural: "인터뷰",
    singular: "인터뷰",
  });
  assert.equal(
    field.admin?.components?.RowLabel,
    "@/components/payload/ExamPassedReviewInterviewRowLabel#ExamPassedReviewInterviewRowLabel",
  );
});

test("exam passed review omits cohort field", () => {
  const studentName = getTopLevelField(ExamPassedReviews, "studentName");

  assert.equal(studentName.type, "text");
  assert.equal(studentName.label, "학생명");
  assert.equal(studentName.required, true);
  assert.equal(hasTopLevelField(ExamPassedReviews, "cohort"), false);
});

test("highteen special class uses one content tab with thumbnail below YouTube URL", () => {
  const tabs = getTabs(HighteenSpecialClasses);
  const contentTab = getTab(HighteenSpecialClasses, "콘텐츠");
  const fieldNames = contentTab.fields
    .filter((field): field is FieldWithName => "name" in field)
    .map((field) => field.name);
  const youtubeUrl = getTabField(HighteenSpecialClasses, "콘텐츠", "youtubeUrl");
  const thumbnailMedia = getTabField(HighteenSpecialClasses, "콘텐츠", "thumbnailMedia");

  assert.deepEqual(
    tabs.map((tab) => tab.label),
    ["콘텐츠"],
  );
  assert.deepEqual(fieldNames, ["youtubeUrl", "thumbnailMedia", "youtubePreview", "body"]);
  assert.equal(youtubeUrl.required, true);
  assert.equal(thumbnailMedia.type, "upload");
  assert.equal(thumbnailMedia.label, "대표 이미지");
  assert.equal(thumbnailMedia.relationTo, "media");
  assert.equal(
    thumbnailMedia.admin?.description,
    "이미지를 등록하지 않으면 유튜브 썸네일이 대표 이미지로 표시됩니다.",
  );
});

test("artist press uses content and SEO tabs with thumbnail above body", () => {
  const tabs = getTabs(ArtistPress);
  const contentTab = getTab(ArtistPress, "콘텐츠");
  const fieldNames = contentTab.fields
    .filter((field): field is FieldWithName => "name" in field)
    .map((field) => field.name);
  const thumbnailMedia = getTabField(ArtistPress, "콘텐츠", "thumbnailMedia");

  assert.deepEqual(
    tabs.map((tab) => tab.label),
    ["콘텐츠", "SEO"],
  );
  assert.deepEqual(fieldNames, ["thumbnailMedia", "agencyLogoMedia", "body"]);
  assert.equal(thumbnailMedia.type, "upload");
  assert.equal(thumbnailMedia.label, "대표 이미지");
  assert.equal(thumbnailMedia.relationTo, "media");
});

test("artist press agency settings use slug and omit legacy filenames", () => {
  const slug = getTopLevelField(ArtistPressAgencies, "slug");

  assert.equal(slug.type, "text");
  assert.equal(slug.label, "슬러그");
  assert.equal(slug.required, true);
  assert.equal(hasTopLevelField(ArtistPressAgencies, "normalizedKey"), false);
  assert.equal(hasTopLevelField(ArtistPressAgencies, "legacyAliases"), false);
});

test("shared slug field uses Korean admin label", () => {
  const field = slugField();
  const slugTextField = field.fields.find((item) => isNamedField(item, "slug"));

  assert.ok(slugTextField, "공통 slugField에 slug 텍스트 필드가 있어야 합니다.");
  assert.equal(slugTextField.label, "슬러그");
});

test("legacy direct slug fields use Korean labels", () => {
  const collections = [
    Appearances,
    AppearancesExtra,
    Directings,
    Dramas,
    Lineups,
    Movies,
    Reviews,
    Shoots,
    TeacherFiles,
  ];

  for (const collection of collections) {
    const slug = getTopLevelField(collection, "slug");

    assert.equal(slug.type, "text", `${collection.slug}.slug 타입`);
    assert.equal(slug.label, "슬러그", `${collection.slug}.slug 라벨`);
  }
});

test("history months use month row labels", () => {
  const field = getTopLevelField(Histories, "months");

  assert.equal(field.type, "array");
  assert.deepEqual(field.labels, {
    plural: "월별 연혁",
    singular: "월별 연혁",
  });
  assert.equal(field.admin?.initCollapsed, true);
  assert.equal(
    field.admin?.components?.RowLabel,
    "@/components/payload/HistoryMonthRowLabel#HistoryMonthRowLabel",
  );

  const itemField = field.fields.find((item) => isNamedField(item, "items"));

  assert.ok(itemField, "histories.months.items 필드가 있어야 합니다.");
  assert.equal(itemField.type, "array");
  assert.deepEqual(itemField.labels, {
    plural: "항목",
    singular: "항목",
  });
  assert.equal(itemField.admin?.initCollapsed, true);
  assert.equal(
    itemField.admin?.components?.RowLabel,
    "@/components/payload/HistoryMonthItemRowLabel#HistoryMonthItemRowLabel",
  );
});

test("direct casting menu is hidden for exam managers only", () => {
  const hidden = DirectCastings.admin?.hidden;

  assert.equal(typeof hidden, "function");

  if (typeof hidden !== "function") {
    return;
  }

  assert.equal(hidden({ user: { role: "manager", center: "exam" } } as never), true);
  assert.equal(hidden({ user: { role: "manager", center: "art" } } as never), false);
  assert.equal(hidden({ user: { role: "manager", center: "kids" } } as never), false);
  assert.equal(hidden({ user: { role: "manager", center: "highteen" } } as never), false);
  assert.equal(hidden({ user: { role: "admin", center: "exam" } } as never), false);
});

test("highteen special class menu is hidden outside highteen managers", () => {
  const hidden = HighteenSpecialClasses.admin?.hidden;

  assert.equal(typeof hidden, "function");

  if (typeof hidden !== "function") {
    return;
  }

  assert.equal(hidden({ user: { role: "manager", center: "art" } } as never), true);
  assert.equal(hidden({ user: { role: "manager", center: "highteen" } } as never), false);
  assert.equal(hidden({ user: { role: "admin", center: "art" } } as never), false);
});
