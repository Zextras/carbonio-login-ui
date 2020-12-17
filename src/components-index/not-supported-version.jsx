import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Snackbar } from '@zextras/zapp-ui';

export default function NotSupportedVersion() {
	const [ t ] = useTranslation();
	const [ isOpen, setOpen ] = useState(true);
	const onCloseCbk = useCallback(
		() => setOpen(false),
		[]
	);

	return (
		<Snackbar
			open={isOpen}
			label={t('unsupported_version', 'The server sent a not valid response. Please contact your server administrator')}
			onClose={onCloseCbk}
			autoHideTimeout={10000}
			type="error"
		/>
	);
}
