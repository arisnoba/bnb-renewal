'use client';

import { getAdminImagePreviewSrc } from './adminImagePreviewSrc';

type TeacherImageContext = {
	sourceDb?: unknown;
	sourceId?: unknown;
	sourceTable?: unknown;
};

function stringValue(value: unknown) {
	if (typeof value === 'number') {
		return String(value);
	}

	return typeof value === 'string' ? value.trim() : '';
}

function encodePathSegments(path: string) {
	return path
		.split('/')
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join('/');
}

function stripLegacyTeacherPrefix(path: string) {
	return path
		.replace(/^web\/data\/teacher\//, '')
		.replace(/^data\/teacher\//, '')
		.replace(/^legacy\/teachers\//, '');
}

export function getTeacherImageSrc(value: unknown, context: TeacherImageContext) {
	const trimmed = stringValue(value);

	if (!trimmed) {
		return '';
	}

	const fallback = trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/^\/+/, '')}`;
	const mediaSrc = getAdminImagePreviewSrc(trimmed);

	if (mediaSrc !== fallback) {
		return mediaSrc;
	}

	if (trimmed.startsWith('/api/') || trimmed.startsWith('/uploads/') || trimmed.startsWith('/_next/')) {
		return fallback;
	}

	const sourceDb = stringValue(context.sourceDb);
	const sourceTable = stringValue(context.sourceTable);
	const sourceId = stringValue(context.sourceId);

	if (!sourceDb || !sourceTable || !sourceTable.startsWith('g5_teacher')) {
		return fallback;
	}

	let sourcePath = stripLegacyTeacherPrefix(trimmed.replace(/^\/+/, ''));

	if (sourcePath.startsWith(`${sourceDb}/${sourceTable}/`)) {
		return getAdminImagePreviewSrc(`/legacy/teachers/${encodePathSegments(sourcePath)}`);
	}

	if (sourceId && !sourcePath.includes('/')) {
		sourcePath = `${sourceId}/${sourcePath}`;
	}

	return getAdminImagePreviewSrc(
		`/legacy/teachers/${encodePathSegments(`${sourceDb}/${sourceTable}/${sourcePath}`)}`,
	);
}
