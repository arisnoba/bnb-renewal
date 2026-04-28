"use client";

import type { TextFieldClientComponent } from "payload";

import {
  TextInput,
  useDocumentInfo,
  useField,
  useFormFields,
} from "@payloadcms/ui";
import { useEffect, useState } from "react";

type ProfileSlugDoc = {
  id?: number | string;
  slug?: unknown;
};

type ProfilesResponse = {
  docs?: ProfileSlugDoc[];
};

function profileSlugFromEnglishName(value: unknown) {
  const normalized = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const tokens = normalized.match(/[a-z0-9]+/g) ?? [];

  if (tokens.length === 0) {
    return "";
  }

  if (tokens.length === 1) {
    return tokens[0] ?? "";
  }

  return `${tokens[0]}-${tokens.slice(1).join("")}`;
}

function profileSlugFromSlugValue(value: unknown) {
  const normalized = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const tokens = normalized.match(/[a-z0-9]+/g) ?? [];

  return tokens.join("-");
}

function nextUniqueProfileSlug(
  baseSlug: string,
  docs: ProfileSlugDoc[],
  currentId?: number | string,
) {
  const usedSlugs = new Set(
    docs
      .filter((doc) => !sameId(doc.id, currentId))
      .map((doc) => profileSlugFromSlugValue(doc.slug))
      .filter(Boolean),
  );

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

function sameId(left: unknown, right: unknown) {
  return left != null && right != null && String(left) === String(right);
}

function adminWidth(field: { admin?: { width?: number | string } }) {
  return field.admin?.width;
}

export const ProfileSlugField: TextFieldClientComponent = ({
  field,
  path: pathFromProps,
}) => {
  const { id } = useDocumentInfo();
  const { errorMessage, setValue, showError, value } = useField<string>({
    potentiallyStalePath: pathFromProps,
  });
  const englishName = useFormFields(
    ([fields]) => fields.englishName?.value,
  );
  const [docs, setDocs] = useState<ProfileSlugDoc[]>([]);
  const [hasLoadedDocs, setHasLoadedDocs] = useState(false);
  const fieldValue = typeof value === "string" ? value : "";
  const label =
    typeof field.label === "string" ? field.label : pathFromProps ?? field.name;

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfileSlugs() {
      try {
        const response = await fetch(
          "/api/profiles?depth=0&limit=10000&pagination=false",
          { signal: controller.signal },
        );

        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as ProfilesResponse;

        setDocs(Array.isArray(body.docs) ? body.docs : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      } finally {
        setHasLoadedDocs(true);
      }
    }

    void loadProfileSlugs();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const baseSlug = profileSlugFromEnglishName(englishName);

    if (!baseSlug) {
      if (fieldValue) {
        setValue("");
      }

      return;
    }

    if (id && !hasLoadedDocs) {
      return;
    }

    const nextSlug = nextUniqueProfileSlug(baseSlug, docs, id);

    if (fieldValue !== nextSlug) {
      setValue(nextSlug);
    }
  }, [docs, englishName, fieldValue, hasLoadedDocs, id, setValue]);

  return (
    <TextInput
      label={label}
      path={pathFromProps}
      placeholder="영문명 입력 시 자동 입력됩니다."
      readOnly
      required={field.required}
      showError={showError}
      style={{ width: adminWidth(field) }}
      value={fieldValue}
      Error={
        showError && errorMessage ? (
          <div style={{ color: "var(--theme-error-700)", fontSize: 12 }}>
            {errorMessage}
          </div>
        ) : undefined
      }
    />
  );
};
