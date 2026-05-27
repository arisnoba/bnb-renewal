'use client';

import type { DateFieldClientComponent } from 'payload';
import { useEffect } from 'react';

import { DateTimeField, useField } from '@payloadcms/ui';

export const AuditionScheduleStartDateField: DateFieldClientComponent = props => {
  const { value } = useField<string>({
    potentiallyStalePath: props.path,
  });
  const endDateField = useField<string>({
    path: 'scheduleEndDate',
  });
  const endDateValue = endDateField.value;

  useEffect(() => {
    if (!value || endDateValue) {
      return;
    }

    endDateField.setValue(value);
  }, [endDateField, endDateValue, value]);

  return <DateTimeField {...props} />;
};
