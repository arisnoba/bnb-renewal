"use client";

import type { TextFieldClientComponent } from "payload";

import { FieldError, FieldLabel, useField, useFormFields } from "@payloadcms/ui";
import { useEffect, useMemo } from "react";

import { getProfileFilterOptions } from "@/lib/profileFilters";

export const ProfileFilterField: TextFieldClientComponent = ({
  field,
  path: pathFromProps,
}) => {
  const { disabled, path, setValue, showError, value } = useField<string>({
    potentiallyStalePath: pathFromProps,
  });
  const centersValue = useFormFields(([fields]) => fields.centers?.value);
  const options = useMemo(
    () => getProfileFilterOptions(centersValue),
    [centersValue],
  );
  const fieldValue = typeof value === "string" ? value : "";

  useEffect(() => {
    if (options.length === 0) {
      return;
    }

    if (!options.some((option) => option.value === fieldValue)) {
      setValue(options[0]?.value ?? "");
    }
  }, [fieldValue, options, setValue]);

  return (
    <div
      className={[
        "field-type",
        "text",
        field.admin?.className,
        showError ? "error" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        display: "grid",
        gap: 8,
        margin: "0 0 20px",
      }}
    >
      <FieldLabel label={field.label ?? "필터"} path={path} required={field.required} />
      <div
        className="field-type__wrap"
        style={{
          position: "relative",
        }}
      >
        <FieldError path={path} showError={showError} />
        {options.length > 0 ? (
          <select
            disabled={disabled}
            onChange={(event) => setValue(event.currentTarget.value)}
            style={{
              appearance: "auto",
              background: disabled
                ? "var(--theme-elevation-100)"
                : "var(--theme-input-bg)",
              border: "1px solid var(--theme-elevation-150)",
              borderRadius: "var(--style-radius-s)",
              color: "var(--theme-text)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              height: 40,
              padding: "0 12px",
              width: "100%",
            }}
            value={fieldValue}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <p
            style={{
              color: "var(--theme-elevation-600)",
              fontSize: 12,
              margin: 0,
            }}
          >
            센터를 선택하면 사용 가능한 필터가 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
};
