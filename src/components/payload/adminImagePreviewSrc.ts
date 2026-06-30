'use client';

type AdminImagePreviewOptions = {
	fallbackPrefix?: unknown;
};

const rootHandledPrefixes = ['/api/admin-images', '/uploads/', '/_next/'];

function stringValue(value: unknown) {
	if (typeof value === 'number') {
		return String(value);
	}

	return typeof value === 'string' ? value.trim() : '';
}

function adminPreviewObjectKeySrc(objectKey: string) {
	const normalized = objectKey.replace(/^\/+/, '').split('?')[0] ?? '';

	if (!normalized.startsWith('media/') && !normalized.startsWith('legacy/')) {
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

function apiMediaObjectKeySrc(parsed: URL, fallbackPrefix: string) {
	if (!parsed.pathname.startsWith('/api/media/file/')) {
		return '';
	}

	const filename = parsed.pathname.split('/').filter(Boolean).pop() ?? '';
	const prefix = stringValue(parsed.searchParams.get('prefix')) || fallbackPrefix;

	if (!filename || !prefix) {
		return '';
	}

	return adminPreviewObjectKeySrc(`${prefix}/${decodeURIComponent(filename)}`);
}

export function getAdminImagePreviewSrc(value: unknown, options: AdminImagePreviewOptions = {}) {
	const trimmed = stringValue(value);

	if (!trimmed) {
		return '';
	}

	try {
		const parsed = new URL(trimmed, 'http://local.test');
		const apiMediaSrc = apiMediaObjectKeySrc(parsed, stringValue(options.fallbackPrefix));

		if (apiMediaSrc) {
			return apiMediaSrc;
		}
	} catch {
		// Keep the plain fallback below for unusual but harmless input strings.
	}

	const objectKeySrc = adminPreviewObjectKeySrc(trimmed);

	if (objectKeySrc) {
		return objectKeySrc;
	}

	if (/^(https?:)?\/\//.test(trimmed)) {
		return trimmed;
	}

	if (rootHandledPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
		return trimmed;
	}

	return trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/^\/+/, '')}`;
}
