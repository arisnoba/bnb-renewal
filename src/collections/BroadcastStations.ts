import type { CollectionBeforeValidateHook, CollectionConfig, Validate } from "payload";

import { allowAll, loggedInOnly } from "./access";
import { normalizeUploadedMediaPrefixes } from "./mediaPrefixNormalization";

function validateBroadcastStationSlug(value: unknown) {
  const slug = String(value ?? "").trim();

  if (!slug) {
    return "방송사 슬러그를 입력하세요.";
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "방송사 슬러그는 영문 소문자, 숫자, 하이픈(-)만 입력할 수 있습니다.";
  }

  return true;
}

const validateLogoMedia: Validate<unknown> = (value) => {
  return value ? true : "방송사 로고 이미지를 선택해야 합니다.";
};

const normalizeBroadcastStation: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) {
    return data;
  }

  const stationName = String(data.stationName ?? "").trim();
  const slug = String(data.slug ?? "").trim();

  return {
    ...data,
    stationName,
    slug: slug || slugFromStationName(stationName),
  };
};

function slugFromStationName(value: string) {
  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "";
}

export const BroadcastStations: CollectionConfig = {
  slug: "broadcast-stations",
  labels: {
    plural: "방송사 설정",
    singular: "방송사 설정",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ["stationName", "slug", "logoMedia", "updatedAt"],
    group: "캐스팅/오디션",
    useAsTitle: "stationName",
  },
  defaultSort: "stationName",
  hooks: {
    afterChange: [
      normalizeUploadedMediaPrefixes([{ path: "logoMedia", role: "broadcast-stations.logo" }]),
    ],
    beforeValidate: [normalizeBroadcastStation],
  },
  fields: [
    {
      name: "stationName",
      type: "text",
      label: "방송사명",
      required: true,
      admin: {
        placeholder: "예: SBS, MBC, tvN",
      },
    },
    {
      name: "slug",
      type: "text",
      label: "슬러그",
      required: true,
      unique: true,
      admin: {
        description: "영문 소문자, 숫자, 하이픈(-)만 입력하세요. 예: sbs, mbc, tvn",
      },
      validate: validateBroadcastStationSlug,
    },
    {
      name: "logoMedia",
      type: "upload",
      label: "방송사 로고 이미지",
      relationTo: "media",
      validate: validateLogoMedia,
      admin: {
        className: "bnb-admin-required-field",
      },
    },
  ],
};
