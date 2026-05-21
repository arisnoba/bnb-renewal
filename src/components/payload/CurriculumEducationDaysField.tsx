'use client';

import type { DefaultCellComponentProps, TextFieldClientComponent } from 'payload';

import { FieldError, FieldLabel, useField } from '@payloadcms/ui';

import {
	curriculumEducationDayOptions,
	formatCurriculumEducationDays,
} from '../../lib/curriculumEducationDays';

function useDayField(path: string) {
	return useField<boolean>({
		path,
	});
}

export const CurriculumEducationDaysCell = ({ rowData }: DefaultCellComponentProps) => {
	return <span>{formatCurriculumEducationDays(rowData)}</span>;
};

export const CurriculumEducationDaysField: TextFieldClientComponent = () => {
	const educationDaysField = useField<string>({
		path: 'educationDays',
	});
	const mondayField = useDayField('educationDayMonday');
	const tuesdayField = useDayField('educationDayTuesday');
	const wednesdayField = useDayField('educationDayWednesday');
	const thursdayField = useDayField('educationDayThursday');
	const fridayField = useDayField('educationDayFriday');
	const saturdayField = useDayField('educationDaySaturday');
	const sundayField = useDayField('educationDaySunday');
	const fields = [
		{ ...curriculumEducationDayOptions[0], field: mondayField },
		{ ...curriculumEducationDayOptions[1], field: tuesdayField },
		{ ...curriculumEducationDayOptions[2], field: wednesdayField },
		{ ...curriculumEducationDayOptions[3], field: thursdayField },
		{ ...curriculumEducationDayOptions[4], field: fridayField },
		{ ...curriculumEducationDayOptions[5], field: saturdayField },
		{ ...curriculumEducationDayOptions[6], field: sundayField },
	];
	const isDisabled = fields.some(({ field }) => field.disabled);
	const selectedValues = fields
		.filter(({ field }) => field.value === true)
		.map(({ label }) => label);

	function setDayValue(path: string, value: boolean) {
		const targetLabel = fields.find((item) => item.path === path)?.label;
		const nextValues = value
			? Array.from(new Set([...selectedValues, targetLabel].filter(Boolean)))
			: selectedValues.filter((label) => label !== targetLabel);

		fields.find((item) => item.path === path)?.field.setValue(value);
		educationDaysField.setValue(nextValues.join(','));
	}

	return (
		<div
			className={[
				'field-type',
				'text',
				'bnb-admin-required-field',
				'bnb-curriculum-days-field',
				educationDaysField.showError ? 'error' : '',
			]
				.filter(Boolean)
				.join(' ')}
			style={{
				display: 'grid',
				gap: 8,
				margin: '0 0 20px',
			}}>
			<FieldLabel label="수업요일" path={educationDaysField.path} />
			<div
				className="field-type__wrap"
				style={{
					position: 'relative',
				}}>
				<FieldError path={educationDaysField.path} showError={educationDaysField.showError} />
				<div
					className="bnb-curriculum-days-field__options"
					style={{
						display: 'grid',
						gap: 8,
						gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
						padding: 0,
						width: '100%',
					}}>
					{fields.map(({ field, label, path }) => {
						const isSelected = field.value === true;

						return (
							<button
								aria-pressed={isSelected}
								disabled={isDisabled}
								key={path}
								onClick={() => setDayValue(path, !isSelected)}
								style={{
									background: isSelected ? 'var(--theme-success-500)' : 'var(--theme-elevation-50)',
									border: `1px solid ${isSelected ? 'var(--theme-success-600)' : 'var(--theme-border-color)'}`,
									borderRadius: 'var(--style-radius-s)',
									color: isSelected ? 'var(--theme-text)' : 'var(--theme-elevation-800)',
									cursor: isDisabled ? 'not-allowed' : 'pointer',
									fontSize: 13,
									fontWeight: 600,
									height: 40,
									lineHeight: 1,
									minWidth: 0,
									opacity: isDisabled ? 0.6 : 1,
									padding: '0 10px',
								}}
								type="button">
								{label}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
};
