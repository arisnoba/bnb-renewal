"use client";

import type { SelectFieldClientComponent } from "payload";

import { SelectField, useAuth, useField } from "@payloadcms/ui";
import { useEffect } from "react";

const validCenters = new Set([
  "art",
  "exam",
  "kids",
  "highteen",
  "avenue",
  "all",
  "unknown",
]);

function getUserCenter(user: unknown) {
  if (!user || typeof user !== "object") {
    return "unknown";
  }

  const center = (user as { center?: unknown }).center;

  return typeof center === "string" && validCenters.has(center)
    ? center
    : "unknown";
}

function normalizeCenters(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export const CentersField: SelectFieldClientComponent = (props) => {
  const { user } = useAuth();
  const userCenter = getUserCenter(user);
  const isArtCenter = userCenter === "art";
  const { setValue, value } = useField<string[]>({
    potentiallyStalePath: props.path,
  });
  const values = normalizeCenters(value);

  useEffect(() => {
    if (values.length === 0 && userCenter) {
      setValue([userCenter]);
    }
  }, [setValue, userCenter, values.length]);

  return (
    <>
      <SelectField {...props} readOnly={!isArtCenter} />
      {!isArtCenter ? (
        <p
          style={{
            color: "var(--theme-elevation-600)",
            fontSize: 12,
            margin: 0,
          }}
        >
          소속 센터가 자동 선택됩니다. 센터 변경은 아트센터 계정만 가능합니다.
        </p>
      ) : null}
    </>
  );
};
