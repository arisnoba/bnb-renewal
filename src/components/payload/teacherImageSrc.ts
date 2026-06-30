'use client';

type TeacherImageContext = {
	sourceDb?: unknown;
	sourceId?: unknown;
	sourceTable?: unknown;
};

const rootHandledPrefixes = ['/api/', '/legacy/', '/media/', '/uploads/', '/_next/'];

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

function mediaObjectKeySrc(path: string) {
	const normalized = path.replace(/^\/+/, '');

	if (!normalized.startsWith('media/')) {
		return '';
	}

	const segments = normalized.split('/').filter(Boolean);
	const filename = segments.pop();

	if (!filename) {
		return '';
	}

	segments.push(filename);

	return `/api/admin-images?key=${encodeURIComponent(segments.join('/'))}`;
}

export function getTeacherImageSrc(value: unknown, context: TeacherImageContext) {
	const trimmed = stringValue(value);

	if (!trimmed) {
		return '';
	}

	if (/^(https?:)?\/\//.test(trimmed)) {
		return trimmed;
	}

	const mediaSrc = mediaObjectKeySrc(trimmed);

	if (mediaSrc) {
		return mediaSrc;
	}

	if (rootHandledPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
		return trimmed;
	}

	const sourceDb = stringValue(context.sourceDb);
	const sourceTable = stringValue(context.sourceTable);
	const sourceId = stringValue(context.sourceId);
	const fallback = trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/^\/+/, '')}`;

	if (!sourceDb || !sourceTable || !sourceTable.startsWith('g5_teacher')) {
		return fallback;
	}

	let sourcePath = stripLegacyTeacherPrefix(trimmed.replace(/^\/+/, ''));

	if (sourcePath.startsWith(`${sourceDb}/${sourceTable}/`)) {
		return `/legacy/teachers/${encodePathSegments(sourcePath)}`;
	}

	if (sourceId && !sourcePath.includes('/')) {
		sourcePath = `${sourceId}/${sourcePath}`;
	}

	return `/legacy/teachers/${encodePathSegments(`${sourceDb}/${sourceTable}/${sourcePath}`)}`;
}
