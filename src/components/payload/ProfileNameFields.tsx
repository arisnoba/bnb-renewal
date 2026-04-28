'use client';

import type { ChangeEvent, InputHTMLAttributes, KeyboardEvent } from 'react';
import type { UIFieldClientComponent } from 'payload';

import { TextInput, useFormFields } from '@payloadcms/ui';

type FieldState = {
	errorMessage?: string;
	showError?: boolean;
	value?: unknown;
};

function sanitizeProfileEnglishName(value: unknown) {
	return String(value ?? '').replace(/[^A-Za-z,\s]/g, '');
}

function isAllowedEnglishNameKey(event: KeyboardEvent<HTMLInputElement>) {
	if (event.metaKey || event.ctrlKey || event.altKey) {
		return true;
	}

	if (event.key.length !== 1) {
		return true;
	}

	return /^[A-Za-z,\s]$/.test(event.key);
}

const englishNameInputAttributes = {
	autoCapitalize: 'words',
	autoComplete: 'off',
	autoCorrect: 'off',
	inputMode: 'latin',
	lang: 'en',
	spellCheck: false,
} as unknown as InputHTMLAttributes<HTMLInputElement>;

export const ProfileNameFields: UIFieldClientComponent = () => {
	const fields = useFormFields(([formFields]) => formFields);
	const dispatchFields = useFormFields(([, dispatch]) => dispatch);
	const nameField = fields.name as FieldState | undefined;
	const englishNameField = fields.englishName as FieldState | undefined;
	const nameValue = typeof nameField?.value === 'string' ? nameField.value : '';
	const englishNameValue = typeof englishNameField?.value === 'string' ? englishNameField.value : '';

	function setFieldValue(path: 'englishName' | 'name', value: string) {
		dispatchFields({
			path,
			type: 'UPDATE',
			value,
		});
	}

	return (
		<div
			style={{
				display: 'grid',
				gap: 10,
				gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
				marginBottom: 20,
			}}>
			<TextInput
				label="이름"
				onChange={(event: ChangeEvent<HTMLInputElement>) => {
					setFieldValue('name', event.currentTarget.value);
				}}
				path="name"
				required
				showError={nameField?.showError}
				value={nameValue}
				Error={nameField?.showError && nameField.errorMessage ? <div style={{ color: 'var(--theme-error-700)', fontSize: 12 }}>{nameField.errorMessage}</div> : undefined}
			/>
			<TextInput
				htmlAttributes={englishNameInputAttributes}
				label="영문명"
				onChange={(event: ChangeEvent<HTMLInputElement>) => {
					setFieldValue('englishName', sanitizeProfileEnglishName(event.currentTarget.value));
				}}
				onKeyDown={event => {
					if (!isAllowedEnglishNameKey(event)) {
						event.preventDefault();
					}
				}}
				path="englishName"
				placeholder="예: Kim Minji"
				required
				showError={englishNameField?.showError}
				value={englishNameValue}
				Error={englishNameField?.showError && englishNameField.errorMessage ? <div style={{ color: 'var(--theme-error-700)', fontSize: 12 }}>{englishNameField.errorMessage}</div> : undefined}
			/>
		</div>
	);
};
