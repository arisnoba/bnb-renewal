'use client';

const imageExtensions = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);

function decodeFileName(fileName: string) {
	try {
		return decodeURIComponent(fileName);
	} catch {
		return fileName;
	}
}

function fileNameFromPath(pathname: string) {
	const fileName = pathname.split('/').filter(Boolean).pop();

	return fileName ? decodeFileName(fileName) : '';
}

function fileNameFromValue(value: unknown) {
	const src = typeof value === 'string' ? value.trim() : '';

	if (!src) {
		return '';
	}

	try {
		const parsed = new URL(src, 'http://local.test');
		const adminImageKey =
			parsed.pathname === '/api/admin-images' ? parsed.searchParams.get('key') : '';

		return fileNameFromPath(adminImageKey || parsed.pathname);
	} catch {
		return fileNameFromPath(src.split('?')[0] ?? '');
	}
}

function fileExtension(fileName: string) {
	const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';

	return extension || '';
}

export function getImagePathFieldFileName(primary: unknown, fallback?: unknown) {
	return fileNameFromValue(primary) || fileNameFromValue(fallback) || String(primary ?? fallback ?? '');
}

export function isProbablyImagePath(value: unknown) {
	const fileName = fileNameFromValue(value);
	const extension = fileExtension(fileName);

	return extension ? imageExtensions.has(extension) : true;
}
