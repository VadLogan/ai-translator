import { useEffect, useState } from 'react';
import { disabledFields, type DisabledField } from '../../../settings/disabled-fields';

/** Fields turned off from the in-page icon: local to this browser, so read straight from storage. */
export function useDisabledFields() {
  const [fields, setFields] = useState<DisabledField[]>([]);
  useEffect(() => {
    void disabledFields.get().then(setFields);
    return disabledFields.watch(setFields);
  }, []);
  return { fields, enable: (field: DisabledField) => void disabledFields.remove(field.site, field.key) };
}
