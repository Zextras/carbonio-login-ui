import React, { useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, PasswordInput, Row, Text } from '@zextras/zapp-ui';

const urlParams = new URLSearchParams(window.location.search);

export default function CredentialsForm({
	authError,
	submitCredentials,
	configuration,
	disableInputs,
	loading = false
}) {
	const [t] = useTranslation();

	const [username, setUsername] = useState(urlParams.get('username') || '');
	const [password, setPassword] = useState('');

	const submitUserPassword = useCallback((e) => {
		e.preventDefault();
		if (username && password) {
			let usernameModified = username;
			if (urlParams.has('virtualacctdomain')) {
				usernameModified = `${usernameModified.replace('@', '.')}@${urlParams.get('virtualacctdomain')}`;
			}
			else if (urlParams.has('customerDomain')){
				usernameModified = `${usernameModified.trim()}@${urlParams.get('customerDomain')}`;
			}
			submitCredentials(usernameModified, password);
		}
	}, [username, password, submitCredentials]);

	const samlButtonCbk = useCallback(() => {
		window.location.assign(`/zx/auth/startSamlWorkflow?redirectUrl=${configuration.destinationUrl}`);
	}, [configuration]);

	const samlButton = useMemo(() => {
		if (configuration.authMethods.includes('saml')) {
			return (
				<Button
					type="outlined"
					label={t('login_saml', 'Login SAML')}
					color="primary"
					disabled={disableInputs}
					onClick={samlButtonCbk}
				/>
			);
		}

		return (
			// used to keep the correct space where or not SAML is shown
			<div style={{ minHeight: '20px' }}/>
		);
	}, [configuration, disableInputs, samlButtonCbk, t]);

	const onChangeUsername = useCallback((ev) => setUsername(ev.target.value), [setUsername]);
	const onChangePassword = useCallback((ev) => setPassword(ev.target.value), [setPassword]);

	return (
		<form onSubmit={submitUserPassword} style={{ width: '100%' }}>
			<input type="submit" style={{ display: 'none' }}/>
			<Row padding={{ bottom: 'large' }}>
				<Input
					defaultValue={username}
					disabled={disableInputs}
					onChange={onChangeUsername}
					hasError={!!authError}
					autocomplete="username"
					label={t('username','Username')}
					backgroundColor="gray5"
				/>
			</Row>
			<Row padding={{ bottom: 'small' }}>
				<PasswordInput
					defaultValue={password}
					disabled={disableInputs}
					onChange={onChangePassword}
					hasError={!!authError}
					autocomplete="password"
					label={t('password', 'Password')}
					backgroundColor="gray5"
				/>
			</Row>
			<Text color="error" size="medium" overflow="break-word">
				{authError || <br/>}
			</Text>
			<Row orientation="vertical" crossAlignment="flex-start" padding={{ bottom: 'large', top: 'small' }}>
				<Button loading={loading} onClick={submitUserPassword} disabled={disableInputs} label={t('login','Login')} size="fill" />
			</Row>
			<Row mainAlignment="flex-end" padding={{ bottom: 'extralarge' }}>
				{samlButton}
			</Row>
		</form>
	);
}
