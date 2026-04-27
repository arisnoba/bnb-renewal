export const profileFilterOptionsByCenter = {
  art: [
    { label: "남자", value: "men" },
    { label: "여자", value: "women" },
  ],
  highteen: [
    { label: "남자", value: "men" },
    { label: "여자", value: "women" },
  ],
  kids: [
    { label: "베이비", value: "베이비" },
    { label: "주니어", value: "주니어" },
    { label: "시니어", value: "시니어" },
  ],
} as const;

type ProfileFilterCenter = keyof typeof profileFilterOptionsByCenter;

const profileFilterCenters = Object.keys(
  profileFilterOptionsByCenter,
) as ProfileFilterCenter[];
const profileFilterValues = new Set<string>(
  profileFilterCenters.flatMap((center) =>
    profileFilterOptionsByCenter[center].map((option) => option.value),
  ),
);

function normalizeCenters(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return typeof value === "string" ? [value] : [];
}

function profileFilterCenter(value: unknown): ProfileFilterCenter | undefined {
  const centers = normalizeCenters(value);

  return profileFilterCenters.find((center) => centers.includes(center));
}

export function getProfileFilterOptions(centers: unknown) {
  const center = profileFilterCenter(centers);

  return center ? [...profileFilterOptionsByCenter[center]] : [];
}

export function getDefaultProfileFilterValue(centers: unknown) {
  return getProfileFilterOptions(centers)[0]?.value;
}

export function isProfileFilterValueAllowed(value: unknown, centers: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  return getProfileFilterOptions(centers).some(
    (option) => option.value === value,
  );
}

export function isKnownProfileFilterValue(value: unknown) {
  return typeof value === "string" && profileFilterValues.has(value);
}
