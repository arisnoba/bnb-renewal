import assert from "node:assert/strict";
import test from "node:test";

import type { CollectionConfig, Field, Tab } from "payload";

import { Appearances } from "./Appearances";
import { AppearancesExtra } from "./AppearancesExtra";
import { ArtistPress } from "./ArtistPress";
import { ArtistPressAgencies } from "./ArtistPressAgencies";
import { CastingAppearances } from "./CastingAppearances";
import { Curriculums } from "./Curriculums";
import { Directings } from "./Directings";
import { DirectCastings } from "./DirectCastings";
import { Dramas } from "./Dramas";
import { ExamPassedReviews } from "./ExamPassedReviews";
import { ExamPassedVideos } from "./ExamPassedVideos";
import { Histories } from "./Histories";
import { HighteenSpecialClasses } from "./HighteenSpecialClasses";
import { Lineups } from "./Lineups";
import { Movies } from "./Movies";
import { News } from "./News";
import { Profiles } from "./Profiles";
import { Reviews } from "./Reviews";
import { Shoots } from "./Shoots";
import { ScreenAppearances } from "./ScreenAppearances";
import { slugField } from "./shared";
import { TeacherFiles } from "./TeacherFiles";
import { Teachers } from "./Teachers";

type FieldWithName = Field & {
  fields?: Field[];
  label?: unknown;
  name: string;
  labels?: unknown;
  required?: boolean;
  defaultValue?: unknown;
  minRows?: number;
  admin?: {
    components?: {
      RowLabel?: unknown;
    };
    description?: unknown;
    hidden?: boolean;
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

function findNamedFieldDeep(fields: Field[], fieldName: string): FieldWithName | undefined {
  for (const field of fields) {
    if (isNamedField(field, fieldName)) {
      return field;
    }

    if ("fields" in field && Array.isArray(field.fields)) {
      const nestedField = findNamedFieldDeep(field.fields, fieldName);

      if (nestedField) {
        return nestedField;
      }
    }

    if (field.type === "tabs") {
      const nestedField = findNamedFieldDeep(
        field.tabs.flatMap((tab) => tab.fields),
        fieldName,
      );

      if (nestedField) {
        return nestedField;
      }
    }
  }

  return undefined;
}

function getFieldDeep(collection: CollectionConfig, fieldName: string) {
  const field = findNamedFieldDeep(collection.fields, fieldName);

  assert.ok(field, `${collection.slug}.${fieldName} 필드가 있어야 합니다.`);

  return field;
}

function hasFieldDeep(collection: CollectionConfig, fieldName: string) {
  return Boolean(findNamedFieldDeep(collection.fields, fieldName));
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

test("teachers require media profile images and omit legacy path", () => {
  const field = getFieldDeep(Teachers, "profileImageMedia");

  assert.equal(field.type, "upload");
  assert.equal(field.label, "프로필 이미지");
  assert.equal(field.required, true);
  assert.equal(hasFieldDeep(Teachers, "profileImagePath"), false);
});

test("teachers generate unique name slugs", async () => {
  const hook = Teachers.hooks?.beforeChange?.at(-1);

  assert.equal(typeof hook, "function");

  if (typeof hook !== "function") {
    return;
  }

  const result = await hook({
    data: {
      name: "홍 길동",
    },
    originalDoc: undefined,
    req: {
      payload: {
        find: async () => ({
          docs: [
            { id: 1, slug: "홍-길동" },
            { id: 2, slug: "홍-길동-2" },
          ],
        }),
      },
    },
  } as never);

  assert.equal(result.slug, "홍-길동-3");
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

  assert.equal(ExamPassedReviews.admin?.useAsTitle, "studentName");
  assert.equal(studentName.type, "text");
  assert.equal(studentName.label, "학생명");
  assert.equal(studentName.required, true);
  assert.equal(hasTopLevelField(ExamPassedReviews, "cohort"), false);
});

test("exam passed content collections expose slug fields", () => {
  for (const collection of [
    CastingAppearances,
    Curriculums,
    ExamPassedReviews,
    ExamPassedVideos,
    HighteenSpecialClasses,
    ScreenAppearances,
  ]) {
    const slug = getFieldDeep(collection, "slug");

    assert.equal(slug.type, "text", `${collection.slug}.slug 타입`);
    assert.equal(slug.label, "슬러그", `${collection.slug}.slug 라벨`);
    assert.equal(slug.required, true, `${collection.slug}.slug 필수 여부`);
  }
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

test("news uses content and SEO tabs with thumbnail above body", () => {
  const tabs = getTabs(News);
  const contentTab = getTab(News, "콘텐츠");
  const fieldNames = contentTab.fields
    .filter((field): field is FieldWithName => "name" in field)
    .map((field) => field.name);
  const thumbnailMedia = getTabField(News, "콘텐츠", "thumbnailMedia");

  assert.deepEqual(
    tabs.map((tab) => tab.label),
    ["콘텐츠", "SEO"],
  );
  assert.deepEqual(fieldNames, ["category", "thumbnailMedia", "body", "excerpt"]);
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

test("shared slug field normalizes manual slug input", () => {
  const field = slugField();
  const slugTextField = field.fields.find((item) => isNamedField(item, "slug")) as
    | (FieldWithName & {
        hooks?: {
          beforeValidate?: Array<(args: { value: unknown }) => unknown>;
        };
      })
    | undefined;

  assert.ok(slugTextField?.hooks?.beforeValidate?.length, "slug 정규화 hook이 있어야 합니다.");

  const normalize = slugTextField.hooks.beforeValidate.at(-1) as
    | ((args: { value: unknown }) => unknown)
    | undefined;

  assert.ok(normalize, "slug 정규화 hook을 찾을 수 있어야 합니다.");
  assert.equal(normalize({ value: "Hello World" }), "hello-world");
  assert.equal(normalize({ value: "JTBC 서른, 아홉" }), "jtbc-서른-아홉");
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
  const title = getTopLevelField(Histories, "title");
  const field = getTopLevelField(Histories, "months");

  assert.equal(title.type, "text");
  assert.equal(title.label, "제목");
  assert.equal(title.required, true);
  assert.equal(title.admin?.hidden, true);
  assert.equal(title.admin?.readOnly, true);

  assert.equal(field.type, "array");
  assert.equal(field.minRows, 1);
  assert.deepEqual(
    typeof field.defaultValue === "function" ? field.defaultValue({} as never) : field.defaultValue,
    [
      {
        month: 1,
        items: [
          {
            title: "",
          },
        ],
      },
    ],
  );
  assert.deepEqual(field.labels, {
    plural: "월별 연혁",
    singular: "월별 연혁",
  });
  assert.equal(field.admin?.initCollapsed, false);
  assert.equal(
    field.admin?.components?.RowLabel,
    "@/components/payload/HistoryMonthRowLabel#HistoryMonthRowLabel",
  );

  const itemField = field.fields.find((item) => isNamedField(item, "items"));

  assert.ok(itemField, "histories.months.items 필드가 있어야 합니다.");
  assert.equal(itemField.type, "array");
  assert.equal(itemField.minRows, 1);
  assert.deepEqual(itemField.defaultValue, [
    {
      title: "",
    },
  ]);
  assert.deepEqual(itemField.labels, {
    plural: "항목",
    singular: "항목",
  });
  assert.equal(itemField.admin?.initCollapsed, false);
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
