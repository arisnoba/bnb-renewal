import assert from "node:assert/strict";
import test from "node:test";

import type { Field, Tab } from "payload";

import { formatCurriculumEducationDays } from "../lib/curriculumEducationDays";
import { Curriculums } from "./Curriculums";

type FieldWithName = Field & { name: string };
type FieldWithLabel = FieldWithName & { label?: unknown };
type FieldWithAdmin = Field & {
  admin?: {
    className?: string;
    disableListColumn?: boolean;
    disableListFilter?: boolean;
    hidden?: boolean;
    placeholder?: string;
    width?: string;
  };
};
type FieldWithDefaultValue = FieldWithAdmin & {
  defaultValue?: unknown;
};
type FieldWithRequired = FieldWithDefaultValue & {
  required?: boolean;
  validate?: unknown;
};
type FieldWithLabelComponent = Field & {
  admin?: {
    components?: {
      Label?: unknown;
    };
  };
};

function isNamedField(field: Field, name: string): field is FieldWithName {
  return "name" in field && field.name === name;
}

function getTabs() {
  const tabsField = Curriculums.fields.find(
    (field) => field.type === "tabs",
  ) as { tabs: Tab[] } | undefined;

  assert.ok(tabsField, "curriculums 컬렉션에 tabs 필드가 있어야 합니다.");

  return tabsField.tabs;
}

function getField(name: string) {
  return Curriculums.fields.find((field) => isNamedField(field, name)) as
    | FieldWithName
    | undefined;
}

function findFieldDeep(fields: Field[], name: string): FieldWithName | undefined {
  for (const field of fields) {
    if (isNamedField(field, name)) {
      return field;
    }

    if ("fields" in field && Array.isArray(field.fields)) {
      const nestedField = findFieldDeep(field.fields, name);

      if (nestedField) {
        return nestedField;
      }
    }

    if (field.type === "tabs") {
      const nestedField = findFieldDeep(
        field.tabs.flatMap((tab) => tab.fields),
        name,
      );

      if (nestedField) {
        return nestedField;
      }
    }
  }

  return undefined;
}

function fieldNames(fields: Field[]): string[] {
  return fields.flatMap((field) => {
    if (field.type === "row") {
      return field.fields.flatMap((rowField) =>
        "name" in rowField ? [rowField.name] : [],
      );
    }

    if (field.type === "collapsible") {
      return fieldNames(field.fields);
    }

    return "name" in field ? [field.name] : [];
  });
}

function labelComponent(field: Field | undefined) {
  return (field as FieldWithLabelComponent | undefined)?.admin?.components?.Label;
}

function adminClassName(field: Field | undefined) {
  return (field as FieldWithAdmin | undefined)?.admin?.className;
}

function assertFieldValidate(field: Field | undefined) {
  assert.equal(typeof (field as FieldWithRequired | undefined)?.validate, "function");
  assert.equal((field as FieldWithRequired | undefined)?.required, undefined);
}

test("curriculums admin uses the new lecture info and curriculum tabs", () => {
  assert.equal(Curriculums.admin?.useAsTitle, "title");
  assert.deepEqual(Curriculums.admin?.defaultColumns, [
    "title",
    "slug",
    "centers",
    "className",
    "teacher",
    "classroom",
    "tuitionFee",
    "educationDays",
    "educationStartDate",
    "capacity",
    "updatedAt",
  ]);

  const titleField = getField("title") as
    | (FieldWithLabel & FieldWithRequired)
    | undefined;

  assert.equal(titleField?.label, "커리큘럼 명");
  assertFieldValidate(titleField);
  assert.equal(adminClassName(titleField), "bnb-admin-required-field");
  assert.equal(Curriculums.fields[0], getField("title"));
  assert.equal(Curriculums.fields[1]?.type, "tabs");

  const tabs = getTabs();

  assert.deepEqual(
    tabs.map((tab) => tab.label),
    ["강의 정보", "커리큘럼"],
  );
  assert.deepEqual(
    fieldNames(Curriculums.fields).filter((name) =>
      ["sourceDb", "sourceTable", "sourceId", "legacyMeta"].includes(name),
    ),
    [],
  );
  assert.ok(findFieldDeep(Curriculums.fields, "slug"), "slug 필드가 있어야 합니다.");

  const lectureInfoTab = tabs.find((tab) => tab.label === "강의 정보");

  assert.ok(lectureInfoTab, "강의 정보 탭이 있어야 합니다.");
  assert.deepEqual(fieldNames(lectureInfoTab.fields), [
    "centers",
    "className",
    "teacher",
    "capacity",
    "classroom",
    "tuitionFee",
    "educationDays",
    "educationDayMonday",
    "educationDayTuesday",
    "educationDayWednesday",
    "educationDayThursday",
    "educationDayFriday",
    "educationDaySaturday",
    "educationDaySunday",
    "educationStartTime",
    "educationEndTime",
    "educationStartDate",
  ]);

  const firstRow = lectureInfoTab.fields[0];

  assert.equal(firstRow.type, "row");
  assert.deepEqual(fieldNames([firstRow]), ["centers", "className"]);

  const centerField = firstRow.type === "row"
    ? firstRow.fields.find((field) => isNamedField(field, "centers"))
    : undefined;
  const classField = firstRow.type === "row"
    ? firstRow.fields.find((field) => isNamedField(field, "className"))
    : undefined;
  const secondRow = lectureInfoTab.fields[1];
  const teacherField = secondRow.type === "row"
    ? secondRow.fields.find((field) => isNamedField(field, "teacher"))
    : undefined;
  const capacityField = secondRow.type === "row"
    ? secondRow.fields.find((field) => isNamedField(field, "capacity"))
    : undefined;
  const thirdRow = lectureInfoTab.fields[2];
  const classroomField = thirdRow.type === "row"
    ? thirdRow.fields.find((field) => isNamedField(field, "classroom"))
    : undefined;
  const tuitionFeeField = thirdRow.type === "row"
    ? thirdRow.fields.find((field) => isNamedField(field, "tuitionFee"))
    : undefined;
  const centerFieldWithLabel = centerField as FieldWithLabel | undefined;
  const centerFieldWithAdmin = centerField as FieldWithAdmin | undefined;
  const classFieldWithLabel = classField as FieldWithLabel | undefined;
  const classFieldWithAdmin = classField as FieldWithAdmin | undefined;
  const teacherFieldWithLabel = teacherField as FieldWithLabel | undefined;
  const teacherFieldWithAdmin = teacherField as FieldWithAdmin | undefined;
  const capacityFieldWithDefault = capacityField as FieldWithRequired | undefined;
  const capacityFieldWithLabel = capacityField as FieldWithLabel | undefined;
  const classroomFieldWithAdmin = classroomField as FieldWithAdmin | undefined;
  const classroomFieldWithLabel = classroomField as FieldWithLabel | undefined;
  const tuitionFeeFieldWithAdmin = tuitionFeeField as FieldWithAdmin | undefined;
  const tuitionFeeFieldWithLabel = tuitionFeeField as FieldWithLabel | undefined;

  assert.ok(centerField, "센터 필드가 있어야 합니다.");
  assert.equal(centerField.type, "select");
  assert.equal(centerFieldWithLabel?.label, "센터");
  assert.equal(centerField.hasMany, undefined);
  assert.equal((centerField as FieldWithDefaultValue).defaultValue, undefined);
  assertFieldValidate(centerField);
  assert.equal(adminClassName(centerField), "bnb-admin-required-field");
  assert.equal(centerFieldWithAdmin?.admin?.placeholder, "선택해 주세요");
  assert.deepEqual(centerField.options, [
    { label: "아트센터", value: "art" },
    { label: "입시센터", value: "exam" },
    { label: "하이틴센터", value: "highteen" },
    { label: "애비뉴센터", value: "avenue" },
  ]);
  assert.equal(
    centerField.admin?.components?.Field,
    "@/components/payload/CurriculumCenterField#CurriculumCenterField",
  );
  assert.ok(classField, "클래스 필드가 있어야 합니다.");
  assert.equal(classField.type, "select");
  assert.equal(classFieldWithLabel?.label, "클래스");
  assertFieldValidate(classField);
  assert.equal(adminClassName(classField), "bnb-admin-required-field");
  assert.equal(classFieldWithAdmin?.admin?.placeholder, "선택해 주세요");
  assert.equal(
    classField.admin?.components?.Field,
    "@/components/payload/CurriculumClassField#CurriculumClassField",
  );
  assert.equal(teacherFieldWithLabel?.label, "강사");
  assertFieldValidate(teacherField);
  assert.equal(adminClassName(teacherField), "bnb-admin-required-field");
  assert.equal(teacherFieldWithAdmin?.admin?.placeholder, "선택해 주세요");
  assert.equal(labelComponent(teacherField), undefined);
  assert.equal(
    teacherField?.admin?.components?.Field,
    "@/components/payload/CurriculumTeacherField#CurriculumTeacherField",
  );
  assert.equal(typeof (teacherField as { filterOptions?: unknown } | undefined)?.filterOptions, "function");
  assert.equal(capacityFieldWithLabel?.label, "정원");
  assert.equal(capacityFieldWithDefault?.admin?.width, "50%");
  assert.equal(labelComponent(capacityField), undefined);
  assert.equal(adminClassName(capacityField), "bnb-admin-required-field");
  assertFieldValidate(capacityField);
  assert.equal(capacityFieldWithDefault?.defaultValue, 8);
  assert.ok(classroomField, "강의실 필드가 있어야 합니다.");
  assert.equal(classroomField.type, "relationship");
  assert.equal(classroomFieldWithLabel?.label, "강의실");
  assert.equal(classroomField.relationTo, "classrooms");
  assert.equal(classroomFieldWithAdmin?.admin?.width, "50%");
  assert.equal(classroomFieldWithAdmin?.admin?.placeholder, "선택해 주세요");
  assert.equal(adminClassName(classroomField), "bnb-admin-required-field");
  assertFieldValidate(classroomField);
  assert.ok(tuitionFeeField, "수강료 필드가 있어야 합니다.");
  assert.equal(tuitionFeeField.type, "number");
  assert.equal(tuitionFeeFieldWithLabel?.label, "수강료");
  assert.equal(tuitionFeeField.min, 0);
  assert.equal(tuitionFeeFieldWithAdmin?.admin?.width, "50%");
  assert.equal(tuitionFeeFieldWithAdmin?.admin?.placeholder, "예: 450000");
  assert.equal(
    tuitionFeeField?.admin?.components?.Field,
    "@/components/payload/CurriculumTuitionFeeField#CurriculumTuitionFeeField",
  );
  assert.equal(adminClassName(tuitionFeeField), "bnb-admin-required-field");
  assertFieldValidate(tuitionFeeField);
  assert.deepEqual(classField.options, [
    { label: "초급 I Class", value: "초급 I Class" },
    { label: "중급 R Class", value: "중급 R Class" },
    { label: "고급 U Class", value: "고급 U Class" },
    { label: "전문 D Class", value: "전문 D Class" },
    { label: "배우 A Class", value: "배우 A Class" },
    { label: "애비뉴 S Class", value: "애비뉴 S Class" },
    { label: "특강반", value: "특강반" },
    { label: "입시반", value: "입시반" },
    { label: "입시예비반", value: "입시예비반" },
    { label: "예고입시반", value: "예고입시반" },
    { label: "입문 I CLASS", value: "입문 I CLASS" },
    { label: "중급 R CLASS", value: "중급 R CLASS" },
    { label: "심화 U CLASS", value: "심화 U CLASS" },
    { label: "전문 DA CLASS", value: "전문 DA CLASS" },
  ]);

  const educationDaysField = lectureInfoTab.fields.find((field) =>
    isNamedField(field, "educationDays"),
  ) as FieldWithName | undefined;

  assert.ok(educationDaysField, "수업요일 UI 필드가 있어야 합니다.");
  assert.equal(educationDaysField.type, "text");
  assert.equal(educationDaysField.label, "수업요일");
  assert.equal(educationDaysField.virtual, true);
  assertFieldValidate(educationDaysField);
  assert.equal(adminClassName(educationDaysField), "bnb-admin-required-field");
  assert.equal(
    educationDaysField.admin?.components?.Cell,
    "@/components/payload/CurriculumEducationDaysField#CurriculumEducationDaysCell",
  );
  assert.equal(
    educationDaysField.admin?.components?.Field,
    "@/components/payload/CurriculumEducationDaysField#CurriculumEducationDaysField",
  );

  const dayFields = [
    "educationDayMonday",
    "educationDayTuesday",
    "educationDayWednesday",
    "educationDayThursday",
    "educationDayFriday",
    "educationDaySaturday",
    "educationDaySunday",
  ].map((name) =>
    lectureInfoTab.fields.find((field) => isNamedField(field, name)),
  ) as (FieldWithAdmin | undefined)[];

  assert.ok(dayFields.every((field) => field?.admin?.hidden === true));
  assert.ok(dayFields.every((field) => field?.admin?.disableListColumn === true));
  assert.ok(dayFields.every((field) => field?.admin?.disableListFilter === true));

  const dateRow = lectureInfoTab.fields.find(
    (field) =>
      field.type === "row" &&
      fieldNames([field]).join(",") === "educationStartDate",
  );

  assert.equal(dateRow?.type, "row");

  const dateField =
    dateRow?.type === "row"
      ? dateRow.fields.find((field) =>
          isNamedField(field, "educationStartDate"),
        )
      : undefined;
  const dateFieldWithAdmin = dateField as FieldWithAdmin | undefined;
  const dateFieldWithLabel = dateField as FieldWithLabel | undefined;

  assert.equal(dateFieldWithLabel?.label, "교육 시작일");
  assert.equal(dateFieldWithAdmin?.admin?.width, "50%");
  assert.equal(labelComponent(dateField), undefined);
  assert.equal(adminClassName(dateField), "bnb-admin-required-field");
  assertFieldValidate(dateField);

  const timeRow = lectureInfoTab.fields.find(
    (field) =>
      field.type === "row" &&
      fieldNames([field]).join(",") === "educationStartTime,educationEndTime",
  );
  const startTimeField =
    timeRow?.type === "row"
      ? timeRow.fields.find((field) => isNamedField(field, "educationStartTime"))
      : undefined;
  const endTimeField =
    timeRow?.type === "row"
      ? timeRow.fields.find((field) => isNamedField(field, "educationEndTime"))
      : undefined;
  const startTimeFieldWithLabel = startTimeField as FieldWithLabel | undefined;
  const endTimeFieldWithLabel = endTimeField as FieldWithLabel | undefined;

  assert.equal(startTimeFieldWithLabel?.label, "교육 시작 시간");
  assertFieldValidate(startTimeField);
  assert.equal(adminClassName(startTimeField), "bnb-admin-required-field");
  assert.equal(labelComponent(startTimeField), undefined);
  assert.equal(endTimeFieldWithLabel?.label, "교육 종료 시간");
  assertFieldValidate(endTimeField);
  assert.equal(adminClassName(endTimeField), "bnb-admin-required-field");
  assert.equal(labelComponent(endTimeField), undefined);
});

test("curriculum lessons use topic-driven row labels", () => {
  const tabs = getTabs();
  const curriculumTab = tabs.find((tab) => tab.label === "커리큘럼");

  assert.ok(curriculumTab, "커리큘럼 탭이 있어야 합니다.");

  const lessonsField = curriculumTab.fields.find((field) =>
    isNamedField(field, "curriculumLessons"),
  ) as FieldWithName | undefined;

  assert.ok(lessonsField, "curriculumLessons 배열 필드가 있어야 합니다.");
  assert.equal(lessonsField.type, "array");
  assert.equal(lessonsField.label, "주차별 강의");
  assert.equal(
    lessonsField.admin?.components?.RowLabel,
    "@/components/payload/CurriculumLessonRowLabel#CurriculumLessonRowLabel",
  );
  assert.deepEqual(
    lessonsField.fields?.flatMap((field) =>
      "name" in field ? [field.name] : [],
    ),
    ["topic", "content"],
  );
});

test("curriculums keep missing center as a field-level validation error", async () => {
  const hook = Curriculums.hooks?.beforeValidate?.at(0);
  const centerField = findFieldDeep(Curriculums.fields, "centers") as
    | FieldWithRequired
    | undefined;

  assert.equal(typeof hook, "function");
  assert.equal(typeof centerField?.validate, "function");

  if (typeof hook !== "function" || typeof centerField?.validate !== "function") {
    return;
  }

  const result = await hook({
    data: {
      title: "센터 미선택 테스트",
    },
    originalDoc: undefined,
    req: {
      user: {
        role: "admin",
      },
    },
  } as never);

  assert.deepEqual(result, {
    title: "센터 미선택 테스트",
    centers: undefined,
    authorName: undefined,
  });
  assert.equal(
    await centerField.validate(undefined, {} as never),
    "센터를 먼저 선택해 주세요.",
  );
});

test("curriculum education day formatter uses compact Korean weekday labels", () => {
  assert.equal(
    formatCurriculumEducationDays({
      educationDayMonday: true,
      educationDayTuesday: false,
      educationDayWednesday: true,
      educationDayThursday: true,
    }),
    "월,수,목",
  );
  assert.equal(formatCurriculumEducationDays({}), "-");
});
