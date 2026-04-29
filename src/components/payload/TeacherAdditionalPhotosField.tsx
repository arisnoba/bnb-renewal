'use client';

import type { ChangeEvent } from 'react';

import { useField } from '@payloadcms/ui';
import { useRef, useState } from 'react';

import { getTeacherImageSrc } from './teacherImageSrc';

type PhotoField = {
	disabled: boolean;
	setValue: (value: unknown, disableModifyingForm?: boolean) => void;
	value?: string;
};

const imageExtensions = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);

function stringValue(value: unknown) {
	return typeof value === 'string' ? value.trim() : '';
}

function getFileName(src: string) {
	const pathname = src.split('?')[0] ?? '';
	const fileName = pathname.split('/').filter(Boolean).pop();

	if (!fileName) {
		return src;
	}

	try {
		return decodeURIComponent(fileName);
	} catch {
		return fileName;
	}
}

function isProbablyImage(src: string) {
	const pathname = src.split('?')[0] ?? '';
	const extension = pathname.split('.').pop()?.toLowerCase();

	return extension ? imageExtensions.has(extension) : true;
}

async function readErrorMessage(response: Response) {
	const fallback = '이미지 처리 중 오류가 발생했습니다.';

	try {
		const body = (await response.json()) as { error?: unknown };

		return typeof body.error === 'string' ? body.error : fallback;
	} catch {
		return fallback;
	}
}

async function uploadFile(file: File) {
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch('/api/admin-images', {
		body: formData,
		method: 'POST',
	});

	if (!response.ok) {
		throw new Error(await readErrorMessage(response));
	}

	const body = (await response.json()) as { path?: unknown };
	const path = typeof body.path === 'string' ? body.path : '';

	if (!path) {
		throw new Error('업로드 응답에 이미지 경로가 없습니다.');
	}

	return path;
}

export const TeacherAdditionalPhotosField = () => {
	const inputRef = useRef<HTMLInputElement>(null);
	const photo1 = useField<string>({ path: 'photoImage1' });
	const photo2 = useField<string>({ path: 'photoImage2' });
	const photo3 = useField<string>({ path: 'photoImage3' });
	const photo4 = useField<string>({ path: 'photoImage4' });
	const photo5 = useField<string>({ path: 'photoImage5' });
	const photo6 = useField<string>({ path: 'photoImage6' });
	const { value: sourceDb } = useField<string>({ path: 'sourceDb' });
	const { value: sourceId } = useField<string>({ path: 'sourceId' });
	const { value: sourceTable } = useField<string>({ path: 'sourceTable' });
	const [isProcessing, setIsProcessing] = useState(false);
	const [message, setMessage] = useState('');
	const [messageType, setMessageType] = useState<'error' | 'info'>('info');
	const photoFields: PhotoField[] = [photo1, photo2, photo3, photo4, photo5, photo6];
	const values = photoFields.map((field) => stringValue(field.value));
	const visibleValues = values.filter(Boolean);
	const controlsDisabled = isProcessing || photoFields.some((field) => field.disabled);

	function updateValues(nextValues: string[]) {
		photoFields.forEach((field, index) => {
			field.setValue(nextValues[index] ?? '');
		});
	}

	async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		const files = Array.from(event.currentTarget.files ?? []);

		event.currentTarget.value = '';

		if (files.length === 0) {
			return;
		}

		const emptySlotCount = values.filter((value) => !value).length;

		if (files.length > emptySlotCount) {
			setMessageType('error');
			setMessage(`추가 사진은 최대 ${photoFields.length}개까지 등록할 수 있습니다.`);
			return;
		}

		setIsProcessing(true);
		setMessage('');
		setMessageType('info');

		try {
			const uploadedPaths = [];

			for (const file of files) {
				uploadedPaths.push(await uploadFile(file));
			}

			const nextValues = [...values];

			for (const uploadedPath of uploadedPaths) {
				const emptyIndex = nextValues.findIndex((value) => !value);

				if (emptyIndex >= 0) {
					nextValues[emptyIndex] = uploadedPath;
				}
			}

			updateValues(nextValues);
			setMessage(`${uploadedPaths.length}개 이미지가 추가되었습니다. 저장 버튼을 눌러 반영하세요.`);
		} catch (error) {
			setMessageType('error');
			setMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsProcessing(false);
		}
	}

	function removeItem(index: number) {
		const nextValues = values.filter((_, currentIndex) => currentIndex !== index);

		updateValues([...nextValues, ...Array(photoFields.length - nextValues.length).fill('')]);
	}

	function moveItem(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;

		if (nextIndex < 0 || nextIndex >= visibleValues.length) {
			return;
		}

		const nextValues = [...visibleValues];
		const [item] = nextValues.splice(index, 1);

		if (!item) {
			return;
		}

		nextValues.splice(nextIndex, 0, item);
		updateValues([...nextValues, ...Array(photoFields.length - nextValues.length).fill('')]);
	}

	return (
		<section
			style={{
				display: 'grid',
				gap: 'calc(var(--base) * 0.75)',
				marginBottom: 'var(--base)',
			}}>
			<div>
				<div
					style={{
						color: 'var(--theme-text)',
						fontSize: 13,
						fontWeight: 600,
						marginBottom: 8,
					}}>
					갤러리 이미지 업로드
				</div>
				<input
					accept="image/avif,image/gif,image/jpeg,image/png,image/svg+xml,image/webp"
					disabled={controlsDisabled}
					multiple
					onChange={handleFileChange}
					ref={inputRef}
					style={{ display: 'none' }}
					type="file"
				/>
				<button
					disabled={controlsDisabled || visibleValues.length >= photoFields.length}
					onClick={() => inputRef.current?.click()}
					style={{
						background: 'var(--theme-elevation-50)',
						border: '1px dashed var(--theme-border-color)',
						borderRadius: 'var(--style-radius-s)',
						color: 'var(--theme-elevation-700)',
						cursor:
							controlsDisabled || visibleValues.length >= photoFields.length ? 'not-allowed' : 'pointer',
						display: 'grid',
						gap: 6,
						padding: 'calc(var(--base) * 0.85)',
						textAlign: 'left',
						width: '100%',
					}}
					type="button">
					<span style={{ color: 'var(--theme-text)', fontSize: 14, fontWeight: 600 }}>
						{isProcessing ? '업로드 중...' : '이미지 업로드'}
					</span>
					<span style={{ fontSize: 12 }}>
						프로필 이미지를 제외한 강사진 슬라이드 이미지를 등록합니다.
					</span>
				</button>
				{message ? (
					<p
						style={{
							color: messageType === 'error' ? 'var(--theme-error-700)' : 'var(--theme-elevation-600)',
							fontSize: 12,
							marginBottom: 0,
						}}>
						{message}
					</p>
				) : null}
			</div>

			<div style={{ display: 'grid', gap: 'calc(var(--base) / 2)' }}>
				{visibleValues.length === 0 ? (
					<div
						style={{
							background: 'var(--theme-elevation-50)',
							border: '1px solid var(--theme-border-color)',
							borderRadius: 'var(--style-radius-s)',
							color: 'var(--theme-elevation-600)',
							fontSize: 13,
							padding: 'calc(var(--base) * 0.6)',
						}}>
						등록된 추가 사진이 없습니다.
					</div>
				) : null}
				{visibleValues.map((value, index) => {
					const imageSrc = getTeacherImageSrc(value, { sourceDb, sourceId, sourceTable });
					const canPreview = imageSrc && isProbablyImage(imageSrc);
					const fileName = imageSrc ? getFileName(imageSrc) : getFileName(value);

					return (
						<article
							key={`${value}-${index}`}
							style={{
								alignItems: 'start',
								background: 'var(--theme-elevation-50)',
								border: '1px solid var(--theme-border-color)',
								borderRadius: 'var(--style-radius-s)',
								display: 'grid',
								gap: 'calc(var(--base) / 2)',
								gridTemplateColumns: '72px minmax(0, 1fr) auto',
								padding: 'calc(var(--base) * 0.5)',
							}}>
							<a
								href={imageSrc || undefined}
								rel="noreferrer"
								style={{
									alignItems: 'center',
									background: 'var(--theme-elevation-100)',
									border: '1px solid var(--theme-border-color)',
									borderRadius: 'var(--style-radius-s)',
									color: 'var(--theme-elevation-500)',
									display: 'flex',
									fontSize: 11,
									fontWeight: 600,
									height: 72,
									justifyContent: 'center',
									overflow: 'hidden',
									textDecoration: 'none',
									width: 72,
								}}
								target="_blank">
								{canPreview ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										alt=""
										loading="lazy"
										src={imageSrc}
										style={{
											display: 'block',
											height: '100%',
											objectFit: 'cover',
											width: '100%',
										}}
									/>
								) : (
									'IMG'
								)}
							</a>
							<div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
								<div
									style={{
										color: 'var(--theme-text)',
										fontSize: 13,
										fontWeight: 600,
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
									title={fileName}>
									{index + 1}. {fileName}
								</div>
								<input
									disabled={controlsDisabled}
									onChange={(event) => {
										const nextValues = [...visibleValues];
										nextValues[index] = event.currentTarget.value;
										updateValues([...nextValues, ...Array(photoFields.length - nextValues.length).fill('')]);
									}}
									placeholder="이미지 경로 또는 URL"
									style={{
										background: 'var(--theme-input-bg, var(--theme-elevation-0))',
										border: '1px solid var(--theme-border-color)',
										borderRadius: 'var(--style-radius-s)',
										color: 'var(--theme-text)',
										fontSize: 12,
										minWidth: 0,
										padding: '8px 10px',
									}}
									type="text"
									value={value}
								/>
							</div>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
								<button
									disabled={controlsDisabled || index === 0}
									onClick={() => moveItem(index, -1)}
									style={actionButtonStyle(controlsDisabled || index === 0)}
									type="button">
									위
								</button>
								<button
									disabled={controlsDisabled || index === visibleValues.length - 1}
									onClick={() => moveItem(index, 1)}
									style={actionButtonStyle(controlsDisabled || index === visibleValues.length - 1)}
									type="button">
									아래
								</button>
								<button
									disabled={controlsDisabled}
									onClick={() => removeItem(index)}
									style={{
										...actionButtonStyle(controlsDisabled),
										background: 'var(--theme-error-50)',
										borderColor: 'var(--theme-error-150)',
										color: 'var(--theme-error-700)',
									}}
									type="button">
									삭제
								</button>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
};

export const TeacherAdditionalPhotoHiddenField = () => null;

function actionButtonStyle(disabled: boolean) {
	return {
		background: 'var(--theme-elevation-100)',
		border: '1px solid var(--theme-border-color)',
		borderRadius: 'var(--style-radius-s)',
		color: 'var(--theme-text)',
		cursor: disabled ? 'not-allowed' : 'pointer',
		fontSize: 12,
		lineHeight: 1,
		padding: '8px 10px',
		whiteSpace: 'nowrap' as const,
	};
}
