'use client';

import type { TextFieldClientComponent } from 'payload';
import type { ChangeEvent, DragEvent } from 'react';

import { useRef, useState } from 'react';
import { useDocumentInfo, useField } from '@payloadcms/ui';
import { ImagePlus } from 'lucide-react';

import { getAdminImagePreviewSrc } from './adminImagePreviewSrc';
import { getTeacherImageSrc } from './teacherImageSrc';

const imageExtensions = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);

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

function validateRequiredImagePath(value: unknown) {
	return String(value ?? '').trim() ? true : '이 입력란은 필수입니다.';
}

export const ImagePathField: TextFieldClientComponent = ({ field, path: pathFromProps }) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const { collectionSlug } = useDocumentInfo();
	const [isProcessing, setIsProcessing] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);
	const [message, setMessage] = useState('');
	const [messageType, setMessageType] = useState<'error' | 'info'>('info');
	const { disabled, errorMessage, path: fieldPath, setValue, showError, value } = useField<string>({
		potentiallyStalePath: pathFromProps,
		validate: field.required ? validateRequiredImagePath : undefined,
	});
	const { value: sourceDb } = useField<string>({ path: 'sourceDb' });
	const { value: sourceId } = useField<string>({ path: 'sourceId' });
	const { value: sourceTable } = useField<string>({ path: 'sourceTable' });
	const fieldValue = typeof value === 'string' ? value : '';
	const label = typeof field.label === 'string' ? field.label : (pathFromProps ?? field.name);
	const imageSrc =
		collectionSlug === 'teachers' && fieldPath === 'profileImagePath'
			? getTeacherImageSrc(value, { sourceDb, sourceId, sourceTable })
			: getAdminImagePreviewSrc(value);
	const canPreview = imageSrc && isProbablyImage(imageSrc);
	const hasValue = Boolean(fieldValue.trim());
	const hasError = Boolean(showError);
	const fileName = imageSrc ? getFileName(imageSrc) : getFileName(fieldValue);
	const controlsDisabled = disabled || isProcessing;

	async function uploadFile(file: File) {
		setIsProcessing(true);
		setMessage('');
		setMessageType('info');

		try {
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
			const nextPath = typeof body.path === 'string' ? body.path : '';

			if (!nextPath) {
				throw new Error('업로드 응답에 이미지 경로가 없습니다.');
			}

			setValue(nextPath);
			setMessage('업로드되었습니다. 저장 버튼을 눌러 변경사항을 반영하세요.');
		} catch (error) {
			setMessageType('error');
			setMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsProcessing(false);
		}
	}

	function handleDragOver(event: DragEvent<HTMLButtonElement>) {
		event.preventDefault();
		if (!controlsDisabled) {
			setIsDragOver(true);
		}
	}

	function handleDragLeave() {
		setIsDragOver(false);
	}

	async function handleDrop(event: DragEvent<HTMLButtonElement>) {
		event.preventDefault();
		setIsDragOver(false);

		if (controlsDisabled) {
			return;
		}

		const file = event.dataTransfer.files?.[0];

		if (file) {
			await uploadFile(file);
		}
	}

	async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.currentTarget.files?.[0];

		event.currentTarget.value = '';

		if (file) {
			await uploadFile(file);
		}
	}

	async function handleDelete() {
		if (!fieldValue) {
			return;
		}

		setIsProcessing(true);
		setMessage('');
		setMessageType('info');

		try {
			const response = await fetch('/api/admin-images', {
				body: JSON.stringify({ path: fieldValue }),
				headers: {
					'Content-Type': 'application/json',
				},
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(await readErrorMessage(response));
			}

			setValue('');
			setMessage('이미지 값이 삭제되었습니다. 저장 버튼을 눌러 변경사항을 반영하세요.');
		} catch (error) {
			setMessageType('error');
			setMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setIsProcessing(false);
		}
	}

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: 'calc(var(--base) / 4)',
				marginBottom: 20,
				width: '100%',
			}}>
			<label
				style={{
					color: 'var(--theme-text)',
					fontSize: 13,
					fontWeight: 600,
				}}>
				{label}
				{field.required ? <span style={{ color: 'var(--theme-error-500)' }}> *</span> : null}
			</label>
			<input
				accept="image/avif,image/gif,image/jpeg,image/png,image/svg+xml,image/webp"
				disabled={controlsDisabled}
				onChange={handleFileChange}
				ref={inputRef}
				style={{ display: 'none' }}
				type="file"
			/>
			{hasValue ? (
				<div
					className="upload-field-card upload-field-card--size-medium"
					style={{
						alignItems: 'center',
						background: 'var(--theme-elevation-50)',
						border: `1px solid ${hasError ? 'var(--theme-error-500)' : 'var(--theme-border-color)'}`,
						borderRadius: 'var(--style-radius-s)',
						display: 'flex',
						gap: 'calc(var(--base) / 2)',
						padding: 'calc(var(--base) * 0.5)',
						width: '100%',
					}}>
					{canPreview ? (
						<a
							aria-label="이미지 확인"
							href={imageSrc}
							rel="noreferrer"
							style={{
								appearance: 'none',
								alignItems: 'center',
								background: 'var(--theme-elevation-100)',
								border: '1px solid var(--theme-border-color)',
								borderRadius: 'var(--style-radius-s)',
								cursor: 'pointer',
								display: 'flex',
								flex: '0 0 40px',
								height: 40,
								justifyContent: 'center',
								overflow: 'hidden',
								padding: 0,
								textDecoration: 'none',
								width: 40,
							}}
							target="_blank"
							title="이미지 확인">
							{/* eslint-disable-next-line @next/next/no-img-element */}
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
						</a>
					) : (
						<div
							aria-label="이미지 미리보기 없음"
							style={{
								alignItems: 'center',
								background: 'var(--theme-elevation-100)',
								border: '1px solid var(--theme-border-color)',
								borderRadius: 'var(--style-radius-s)',
								color: 'var(--theme-elevation-500)',
								display: 'flex',
								flex: '0 0 40px',
								fontSize: 11,
								fontWeight: 600,
								height: 40,
								justifyContent: 'center',
								overflow: 'hidden',
								padding: 0,
								width: 40,
							}}>
							<span
								aria-hidden="true"
								style={{
									color: 'var(--theme-elevation-500)',
									fontSize: 11,
									fontWeight: 600,
								}}>
								IMG
							</span>
						</div>
					)}
					<div
						style={{
							display: 'grid',
							flex: '1 1 auto',
							gap: 4,
							minWidth: 0,
						}}>
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
							{fileName}
						</div>
						<input
							disabled={controlsDisabled}
							onChange={event => setValue(event.currentTarget.value)}
							style={{
								background: 'var(--theme-input-bg, var(--theme-elevation-0))',
								border: '1px solid transparent',
								borderRadius: 'var(--style-radius-s)',
								color: 'var(--theme-elevation-600)',
								fontSize: 12,
								minWidth: 0,
								overflowWrap: 'anywhere',
								padding: 0,
							}}
							type="text"
							value={fieldValue}
						/>
					</div>
					<div
						style={{
							display: 'flex',
							flex: '0 0 auto',
							flexWrap: 'wrap',
							gap: 'calc(var(--base) / 4)',
							justifyContent: 'flex-end',
							marginLeft: 'auto',
						}}>
						<button
							disabled={controlsDisabled}
							onClick={() => inputRef.current?.click()}
							style={{
								background: 'var(--theme-elevation-100)',
								border: '1px solid var(--theme-border-color)',
								borderRadius: 'var(--style-radius-s)',
								color: 'var(--theme-text)',
								cursor: controlsDisabled ? 'not-allowed' : 'pointer',
								fontSize: 13,
								lineHeight: 1,
								padding: '8px 10px',
							}}
							type="button">
							교체
						</button>
						{canPreview ? (
							<a
								href={imageSrc}
								rel="noreferrer"
								style={{
									alignItems: 'center',
									background: 'var(--theme-elevation-100)',
									border: '1px solid var(--theme-border-color)',
									borderRadius: 'var(--style-radius-s)',
									color: 'var(--theme-text)',
									display: 'inline-flex',
									fontSize: 13,
									lineHeight: 1,
									padding: '8px 10px',
									textDecoration: 'none',
								}}
								target="_blank">
								보기
							</a>
						) : null}
						<button
							disabled={controlsDisabled}
							onClick={handleDelete}
							style={{
								background: 'var(--theme-error-50)',
								border: '1px solid var(--theme-error-150)',
								borderRadius: 'var(--style-radius-s)',
								color: 'var(--theme-error-700)',
								cursor: controlsDisabled ? 'not-allowed' : 'pointer',
								fontSize: 13,
								lineHeight: 1,
								padding: '8px 10px',
							}}
							type="button">
							삭제
						</button>
					</div>
				</div>
			) : (
				<button
					className="bnb-image-upload-trigger"
					disabled={controlsDisabled}
					onClick={() => inputRef.current?.click()}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					style={{
						background: isDragOver ? 'var(--theme-elevation-100)' : 'var(--bnb-admin-upload-bg)',
						border: `1px dashed ${hasError ? 'var(--theme-error-500)' : isDragOver ? 'var(--theme-text)' : 'var(--bnb-admin-upload-border)'}`,
						borderRadius: 'var(--style-radius-s)',
						color: 'var(--bnb-admin-upload-text)',
						cursor: controlsDisabled ? 'not-allowed' : 'pointer',
						display: 'inline-flex',
						gap: 8,
						alignItems: 'center',
						padding: 'calc(var(--base) * 0.5)',
						textAlign: 'left',
						transition: 'background 0.15s, border-color 0.15s',
					}}
					type="button">
					<span className="bnb-image-upload-trigger__icon">
						<ImagePlus aria-hidden="true" size={16} strokeWidth={2} />
					</span>
					<span className="bnb-image-upload-trigger__title">
						{isProcessing ? '업로드 중...' : isDragOver ? '여기에 놓기' : '이미지 선택'}
					</span>
				</button>
			)}
			{!hasValue ? (
				<input
					disabled={controlsDisabled}
					onChange={event => setValue(event.currentTarget.value)}
					placeholder="이미지 경로 또는 URL"
					style={{
						background: 'var(--theme-input-bg, var(--theme-elevation-0))',
						border: `1px solid ${hasError ? 'var(--theme-error-500)' : 'var(--theme-border-color)'}`,
						borderRadius: 'var(--style-radius-s)',
						color: 'var(--theme-text)',
						fontSize: 13,
						minWidth: 0,
						padding: '8px 10px',
					}}
					type="text"
					value={fieldValue}
				/>
			) : null}
			{message ? (
				<div
					style={{
						color: messageType === 'error' ? 'var(--theme-error-700)' : 'var(--theme-elevation-600)',
						fontSize: 12,
					}}>
					{message}
				</div>
			) : null}
			{showError && errorMessage ? <div style={{ color: 'var(--theme-error-700)', fontSize: 12 }}>{errorMessage}</div> : null}
		</div>
	);
};
