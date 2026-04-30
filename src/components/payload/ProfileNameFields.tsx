'use client';

import type { ChangeEvent, InputHTMLAttributes, KeyboardEvent } from 'react';
import type { UIFieldClientComponent, Validate } from 'payload';

import { TextInput, useField } from '@payloadcms/ui';

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

const requiredTextValidate: Validate<string> = value => {
	return String(value ?? '').trim() ? true : '이 입력란은 필수입니다.';
};

export const ProfileNameFields: UIFieldClientComponent = () => {
	const nameField = useField<string>({
		path: 'name',
		validate: requiredTextValidate,
	});
	const englishNameField = useField<string>({
		path: 'englishName',
		validate: requiredTextValidate,
	});
	const nameValue = typeof nameField.value === 'string' ? nameField.value : '';
	const englishNameValue = typeof englishNameField.value === 'string' ? englishNameField.value : '';

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
					nameField.setValue(event.currentTarget.value);
				}}
				path="name"
				required
				showError={nameField.showError}
				value={nameValue}
			/>
			<TextInput
				htmlAttributes={englishNameInputAttributes}
				label="영문명"
				onChange={(event: ChangeEvent<HTMLInputElement>) => {
					englishNameField.setValue(sanitizeProfileEnglishName(event.currentTarget.value));
				}}
				onKeyDown={event => {
					if (!isAllowedEnglishNameKey(event)) {
						event.preventDefault();
					}
				}}
				path="englishName"
				placeholder="예: Kim Minji"
				required
				showError={englishNameField.showError}
				value={englishNameValue}
			/>
		</div>
	);
};
