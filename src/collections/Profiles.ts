import type { CollectionConfig } from 'payload';

import { getDefaultProfileFilterValue, isKnownProfileFilterValue, isProfileFilterValueAllowed } from '../lib/profileFilters';
import { centerScopedCollectionAccess } from './access';
import {
	adminCollapsible,
	adminRow,
	adminTabs,
	authorNameField,
	centerScopedBeforeValidate,
	centersField,
	imagePathField,
	legacyMetaField,
	publishingFields,
	sidebarFields,
	sourceFields,
} from './shared';

type ProfileFilterContext = {
	data?: { centers?: unknown };
	originalDoc?: { centers?: unknown };
	siblingData?: { centers?: unknown };
};

type ProfileSlugDoc = {
	id?: number | string;
	slug?: unknown;
};

type ProfileSlugPayload = {
	find: (args: { collection: 'profiles'; depth: number; limit: number; overrideAccess: boolean; pagination: false }) => Promise<{ docs: ProfileSlugDoc[] }>;
};

function profileFilterCenters({ data, originalDoc, siblingData }: ProfileFilterContext) {
	return siblingData?.centers ?? data?.centers ?? originalDoc?.centers;
}

const profileLegacyFields = sourceFields.filter(field => !('name' in field) || field.name !== 'slug');

function sanitizeProfileEnglishName(value: unknown) {
	return String(value ?? '')
		.replace(/[^A-Za-z,\s]/g, '')
		.trim();
}

function profileSlugFromEnglishName(value: unknown) {
	const normalized = sanitizeProfileEnglishName(value)
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
	const tokens = normalized.match(/[a-z0-9]+/g) ?? [];

	if (tokens.length === 0) {
		return undefined;
	}

	if (tokens.length === 1) {
		return tokens[0];
	}

	return `${tokens[0]}-${tokens.slice(1).join('')}`;
}

function profileSlugFromSlugValue(value: unknown) {
	const normalized = String(value ?? '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
	const tokens = normalized.match(/[a-z0-9]+/g) ?? [];

	return tokens.length > 0 ? tokens.join('-') : undefined;
}

async function nextUniqueProfileSlug({ baseSlug, currentId, payload }: { baseSlug: string; currentId?: unknown; payload?: ProfileSlugPayload }) {
	if (!payload) {
		return baseSlug;
	}

	const result = await payload.find({
		collection: 'profiles',
		depth: 0,
		limit: 10000,
		overrideAccess: true,
		pagination: false,
	});
	const usedSlugs = new Set(
		result.docs
			.filter(doc => !sameId(doc.id, currentId))
			.map(doc => profileSlugFromSlugValue(doc.slug))
			.filter((slug): slug is string => Boolean(slug))
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

function isGeneratedProfileSlugForBase(slug: unknown, baseSlug: string) {
	const normalized = profileSlugFromSlugValue(slug);
	const suffixedSlugPattern = new RegExp(`^${escapeRegExp(baseSlug)}-[0-9]+$`);

	return normalized === baseSlug || suffixedSlugPattern.test(normalized ?? '');
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const Profiles: CollectionConfig = {
	slug: 'profiles',
	labels: {
		plural: '프로필',
		singular: '프로필',
	},
	access: centerScopedCollectionAccess,
	admin: {
		defaultColumns: ['name', 'centers', 'authorName', 'filter', 'publishedAt', 'updatedAt'],
		group: '매니지먼트',
		useAsTitle: 'name',
	},
	defaultSort: '-publishedAt',
	hooks: {
		beforeValidate: [centerScopedBeforeValidate],
	},
	fields: [
		...adminTabs([
			{
				label: '프로필',
				fields: [
					{
						name: 'profileNameFields',
						type: 'ui',
						admin: {
							components: {
								Field: '@/components/payload/ProfileNameFields#ProfileNameFields',
							},
						},
					},
					{
						name: 'name',
						type: 'text',
						label: '이름',
						required: true,
						admin: {
							hidden: true,
						},
					},
					{
						name: 'englishName',
						type: 'text',
						label: '영문명',
						required: true,
						hooks: {
							beforeValidate: [({ value }) => sanitizeProfileEnglishName(value)],
						},
						validate: (value: unknown) => {
							const textValue = String(value ?? '');

							if (/[^A-Za-z,\s]/.test(textValue)) {
								return '영문명은 영문 알파벳, 공백, 콤마만 입력할 수 있습니다.';
							}

							return true;
						},
						admin: {
							hidden: true,
						},
					},
					{
						name: 'filter',
						type: 'text',
						label: '필터',
						required: true,
						hooks: {
							beforeValidate: [
								({ data, originalDoc, siblingData, value }) => {
									const centers = profileFilterCenters({
										data,
										originalDoc,
										siblingData,
									});
									const trimmed = typeof value === 'string' ? value.trim() : '';

									if (isProfileFilterValueAllowed(trimmed, centers)) {
										return trimmed;
									}

									return getDefaultProfileFilterValue(centers) ?? trimmed;
								},
							],
						},
						validate: (value: unknown, context: ProfileFilterContext) => {
							const centers = profileFilterCenters(context);

							if (isProfileFilterValueAllowed(value, centers) || isKnownProfileFilterValue(value)) {
								return true;
							}

							return '선택한 센터에서 사용할 수 없는 필터입니다.';
						},
						admin: {
							components: {
								Field: '@/components/payload/ProfileFilterField#ProfileFilterField',
							},
						},
					},
					adminRow([
						{
							name: 'height',
							type: 'text',
							label: '키',
						},
						{
							name: 'weight',
							type: 'text',
							label: '몸무게',
						},
					]),
					imagePathField('profileImagePath', '프로필 이미지', true),
				],
			},
			{
				label: '경력관리',
				fields: [
					{
						name: 'careerItems',
						type: 'array',
						label: '경력관리',
						labels: {
							plural: '경력',
							singular: '경력',
						},
						admin: {
							components: {
								RowLabel: '@/components/payload/ProfileCareerRowLabel#ProfileCareerRowLabel',
							},
						},
						fields: [
							{
								name: 'title',
								type: 'text',
								label: '타이틀',
								required: true,
							},
							{
								name: 'content',
								type: 'textarea',
								label: '내용',
							},
						],
					},
				],
			},
		]),
		...sidebarFields([
			centersField,
			{
				name: 'slug',
				type: 'text',
				label: '슬러그',
				required: true,
				unique: true,
				hooks: {
					beforeValidate: [
						async ({ originalDoc, req, siblingData, value }) => {
							const baseSlug = profileSlugFromEnglishName(siblingData?.englishName) ?? profileSlugFromSlugValue(value);

							if (!baseSlug) {
								return value;
							}

							const previousBaseSlug = profileSlugFromEnglishName(originalDoc?.englishName);

							if (previousBaseSlug === baseSlug && isGeneratedProfileSlugForBase(originalDoc?.slug, baseSlug)) {
								return originalDoc?.slug;
							}

							return nextUniqueProfileSlug({
								baseSlug,
								currentId: originalDoc?.id,
								payload: req.payload,
							});
						},
					],
				},
				admin: {
					components: {
						Field: '@/components/payload/ProfileSlugField#ProfileSlugField',
					},
					placeholder: '영문명 입력 시 자동 입력됩니다.',
					readOnly: true,
				},
			},
			...publishingFields,
			authorNameField,
		]),
		adminCollapsible('레거시/원본', [...profileLegacyFields, legacyMetaField]),
	],
};
