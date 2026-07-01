'use client';

import type { SelectFieldClientComponent } from 'payload';

import { SelectField, useField } from '@payloadcms/ui';

const statusClassNames: Record<string, string> = {
	archived: 'bnb-publishing-status-select--archived',
	draft: 'bnb-publishing-status-select--draft',
	published: 'bnb-publishing-status-select--published',
};

function statusClassName(value: unknown) {
	return typeof value === 'string' ? statusClassNames[value] : undefined;
}

export const PublishingStatusSelectField: SelectFieldClientComponent = props => {
	const { value } = useField<string>({
		potentiallyStalePath: props.path,
	});
	const className = [
		props.field.admin?.className,
		'bnb-publishing-status-select',
		statusClassName(value),
	]
		.filter(Boolean)
		.join(' ');
	const field = {
		...props.field,
		admin: {
			...(props.field.admin ?? {}),
			className,
		},
	} as typeof props.field;

	return <SelectField {...props} field={field} />;
};
