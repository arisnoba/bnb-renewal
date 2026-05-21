export type CurriculumEducationDayOption = {
  label: string;
  path: string;
};

export const curriculumEducationDayOptions: CurriculumEducationDayOption[] = [
  { label: "월", path: "educationDayMonday" },
  { label: "화", path: "educationDayTuesday" },
  { label: "수", path: "educationDayWednesday" },
  { label: "목", path: "educationDayThursday" },
  { label: "금", path: "educationDayFriday" },
  { label: "토", path: "educationDaySaturday" },
  { label: "일", path: "educationDaySunday" },
];

export function formatCurriculumEducationDays(rowData: unknown) {
  if (!rowData || typeof rowData !== "object") {
    return "-";
  }

  const values = curriculumEducationDayOptions
    .filter(({ path }) => (rowData as Record<string, unknown>)[path] === true)
    .map(({ label }) => label);

  return values.length > 0 ? values.join(",") : "-";
}
