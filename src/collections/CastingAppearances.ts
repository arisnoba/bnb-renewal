import type { CollectionConfig } from "payload";

import { allowAll, loggedInOnly } from "./access";
import {
  adminRow,
  adminTabs,
  centersField,
  imagePathField,
  legacyCollapsible,
  publishingFields,
  sidebarFields,
} from "./shared";

export const CastingAppearances: CollectionConfig = {
  slug: "casting-appearances",
  labels: {
    plural: "캐스팅 출연현황",
    singular: "캐스팅 출연현황",
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: [
      "title",
      "centers",
      "broadcaster",
      "castingStatus",
      "publishedAt",
    ],
    group: "캐스팅/오디션",
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  fields: [
    ...adminTabs([
      {
        label: "출연현황",
        fields: [
          { name: "title", type: "text", label: "제목", required: true },
          adminRow([
            centersField,
            { name: "castingStatus", type: "text", label: "캐스팅 상태" },
          ]),
          adminRow([
            { name: "broadcaster", type: "text", label: "방송사" },
            { name: "productionCompany", type: "text", label: "제작사" },
          ]),
          adminRow([
            { name: "directors", type: "text", label: "감독" },
            { name: "writers", type: "text", label: "작가" },
          ]),
          { name: "bodyHtml", type: "textarea", label: "본문" },
        ],
      },
      {
        label: "미디어/캐스팅",
        fields: [
          adminRow([
            imagePathField("thumbnailPath", "썸네일"),
            { name: "castingCompany", type: "text", label: "캐스팅 회사" },
          ]),
        ],
      },
    ]),
    ...sidebarFields(publishingFields),
    legacyCollapsible(),
  ],
};
