export type CurriculumCenter = "art" | "avenue" | "exam" | "highteen" | "kids";

export type CurriculumClassOption = {
  label: string;
  value: string;
};

export const artCurriculumClassOptions: CurriculumClassOption[] = [
  { label: "초급 I Class", value: "초급 I Class" },
  { label: "중급 R Class", value: "중급 R Class" },
  { label: "고급 U Class", value: "고급 U Class" },
  { label: "전문 D Class", value: "전문 D Class" },
  { label: "배우 A Class", value: "배우 A Class" },
  { label: "애비뉴 S Class", value: "애비뉴 S Class" },
  { label: "특강반", value: "특강반" },
];

export const examCurriculumClassOptions: CurriculumClassOption[] = [
  { label: "입시반", value: "입시반" },
  { label: "입시예비반", value: "입시예비반" },
  { label: "예고입시반", value: "예고입시반" },
];

export const highteenCurriculumClassOptions: CurriculumClassOption[] = [
  { label: "입문 I CLASS", value: "입문 I CLASS" },
  { label: "중급 R CLASS", value: "중급 R CLASS" },
  { label: "심화 U CLASS", value: "심화 U CLASS" },
  { label: "전문 DA CLASS", value: "전문 DA CLASS" },
];

export const avenueCurriculumClassOptions: CurriculumClassOption[] = [
  { label: "애비뉴 S Class", value: "애비뉴 S Class" },
];

export const kidsCurriculumClassOptions: CurriculumClassOption[] = [
  { label: "영재교육 Class", value: "영재교육 Class" },
  { label: "아역배우 Class", value: "아역배우 Class" },
  { label: "아티스트 Class", value: "아티스트 Class" },
];

export const curriculumClassOptionsByCenter: Record<
  CurriculumCenter,
  CurriculumClassOption[]
> = {
  art: artCurriculumClassOptions,
  avenue: avenueCurriculumClassOptions,
  exam: examCurriculumClassOptions,
  highteen: highteenCurriculumClassOptions,
  kids: kidsCurriculumClassOptions,
};

export const curriculumClassOptions = [
  ...artCurriculumClassOptions,
  ...examCurriculumClassOptions,
  ...highteenCurriculumClassOptions,
  ...kidsCurriculumClassOptions,
];
