import type { CollectionBeforeValidateHook, CollectionConfig, Field, Validate } from "payload";

import { allowAll, loggedInOnly } from "./access";
import { normalizeUploadedMediaPrefixes } from "./mediaPrefixNormalization";
import {
  createFinalizeIdSlugAfterCreate,
  createIdSlugBeforeValidate,
  idSlugField,
} from "./slugUtils";

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

  return {
    ...data,
    stationName,
  };
};

const setBroadcastStationSlug = createIdSlugBeforeValidate();
const finalizeBroadcastStationSlugAfterCreate =
  createFinalizeIdSlugAfterCreate("broadcast-stations");

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
      finalizeBroadcastStationSlugAfterCreate,
      normalizeUploadedMediaPrefixes([{ path: "logoMedia", role: "broadcast-stations.logo" }]),
    ],
    beforeValidate: [normalizeBroadcastStation, setBroadcastStationSlug],
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
      ...idSlugField,
      validate: validateBroadcastStationSlug,
    } as Field,
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
