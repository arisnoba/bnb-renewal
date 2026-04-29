import assert from "node:assert/strict";
import test from "node:test";

import type { Field, Tab } from "payload";

import { Curriculums } from "./Curriculums";

type FieldWithName = Field & { name: string };
type FieldWithLabel = FieldWithName & { label?: unknown };
type FieldWithAdmin = Field & {
  admin?: {
    className?: string;
    hidden?: boolean;
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
    "className",
    "teacher",
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
      ["sourceDb", "sourceTable", "sourceId", "slug", "legacyMeta"].includes(name),
    ),
    [],
  );

  const lectureInfoTab = tabs.find((tab) => tab.label === "강의 정보");

  assert.ok(lectureInfoTab, "강의 정보 탭이 있어야 합니다.");
  assert.deepEqual(fieldNames(lectureInfoTab.fields), [
    "className",
    "teacher",
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
    "capacity",
  ]);

  const firstRow = lectureInfoTab.fields[0];

  assert.equal(firstRow.type, "row");
  assert.deepEqual(fieldNames([firstRow]), ["className", "teacher"]);

  const classField = firstRow.type === "row"
    ? firstRow.fields.find((field) => isNamedField(field, "className"))
    : undefined;
  const teacherField = firstRow.type === "row"
    ? firstRow.fields.find((field) => isNamedField(field, "teacher"))
    : undefined;
  const classFieldWithLabel = classField as FieldWithLabel | undefined;
  const teacherFieldWithLabel = teacherField as FieldWithLabel | undefined;

  assert.ok(classField, "클래스 필드가 있어야 합니다.");
  assert.equal(classField.type, "select");
  assert.equal(classFieldWithLabel?.label, "클래스");
  assertFieldValidate(classField);
  assert.equal(adminClassName(classField), "bnb-admin-required-field");
  assert.equal(teacherFieldWithLabel?.label, "강사");
  assertFieldValidate(teacherField);
  assert.equal(adminClassName(teacherField), "bnb-admin-required-field");
  assert.equal(labelComponent(teacherField), undefined);
  assert.deepEqual(classField.options, [
    { label: "초급 I Class", value: "초급 I Class" },
    { label: "중급 R Class", value: "중급 R Class" },
    { label: "고급 U Class", value: "고급 U Class" },
    { label: "전문 D Class", value: "전문 D Class" },
    { label: "배우 A Class", value: "배우 A Class" },
    { label: "애비뉴 S Class", value: "애비뉴 S Class" },
    { label: "특강반", value: "특강반" },
  ]);

  const educationDaysField = lectureInfoTab.fields.find((field) =>
    isNamedField(field, "educationDays"),
  ) as FieldWithName | undefined;

  assert.ok(educationDaysField, "교육횟수 UI 필드가 있어야 합니다.");
  assert.equal(educationDaysField.type, "text");
  assert.equal(educationDaysField.label, "교육횟수");
  assert.equal(educationDaysField.virtual, true);
  assertFieldValidate(educationDaysField);
  assert.equal(adminClassName(educationDaysField), "bnb-admin-required-field");
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

  const dateCapacityRow = lectureInfoTab.fields.find(
    (field) =>
      field.type === "row" &&
      fieldNames([field]).join(",") === "educationStartDate,capacity",
  );

  assert.equal(dateCapacityRow?.type, "row");

  const dateField =
    dateCapacityRow?.type === "row"
      ? dateCapacityRow.fields.find((field) =>
          isNamedField(field, "educationStartDate"),
        )
      : undefined;
  const capacityField =
    dateCapacityRow?.type === "row"
      ? dateCapacityRow.fields.find((field) => isNamedField(field, "capacity"))
      : undefined;
  const dateFieldWithAdmin = dateField as FieldWithAdmin | undefined;
  const dateFieldWithLabel = dateField as FieldWithLabel | undefined;
  const capacityFieldWithDefault = capacityField as FieldWithRequired | undefined;
  const capacityFieldWithLabel = capacityField as FieldWithLabel | undefined;

  assert.equal(dateFieldWithLabel?.label, "교육 시작일");
  assert.equal(dateFieldWithAdmin?.admin?.width, "50%");
  assert.equal(labelComponent(dateField), undefined);
  assert.equal(adminClassName(dateField), "bnb-admin-required-field");
  assert.equal(capacityFieldWithLabel?.label, "정원");
  assert.equal(capacityFieldWithDefault?.admin?.width, "50%");
  assert.equal(labelComponent(capacityField), undefined);
  assert.equal(adminClassName(capacityField), "bnb-admin-required-field");
  assertFieldValidate(dateField);
  assertFieldValidate(capacityField);
  assert.equal(capacityFieldWithDefault?.defaultValue, 8);

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
