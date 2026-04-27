"use client";

import type { TextFieldClientComponent } from "payload";

import { useField } from "@payloadcms/ui";
import { useEffect, useMemo } from "react";

import { getProfileFilterOptions } from "@/lib/profileFilters";

export const ProfileFilterField: TextFieldClientComponent = ({
  path: pathFromProps,
}) => {
  const { disabled, errorMessage, setValue, showError, value } =
    useField<string>({
      potentiallyStalePath: pathFromProps,
    });
  const { value: centersValue } = useField<string[]>({
    potentiallyStalePath: "centers",
  });
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

  if (options.length === 0 && !(showError && errorMessage)) {
    return null;
  }

  return (
    <fieldset
      style={{
        border: 0,
        margin: 0,
        padding: 0,
      }}
    >
      {options.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {options.map((option) => (
            <label
              key={option.value}
              style={{
                alignItems: "center",
                display: "inline-flex",
                gap: 6,
              }}
            >
              <input
                checked={fieldValue === option.value}
                disabled={disabled}
                name={pathFromProps}
                onChange={() => setValue(option.value)}
                type="radio"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}
      {showError && errorMessage ? (
        <p
          style={{
            color: "var(--theme-error-500)",
            fontSize: 12,
            marginBottom: 0,
          }}
        >
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
};
