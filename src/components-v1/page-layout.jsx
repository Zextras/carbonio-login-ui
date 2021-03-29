/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import React, { useLayoutEffect, useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { Container, Padding, Row, Text, Tooltip, Link, useScreenMode, useSetCustomTheme } from '@zextras/zapp-ui';
import { forEach, set } from 'lodash';

import { useTranslation } from 'react-i18next';
import logoChrome from '../../assets/logo-chrome.svg';
import logoFirefox from '../../assets/logo-firefox.svg';
import logoIE from '../../assets/logo-internet-explorer.svg';
import logoEdge from '../../assets/logo-edge.svg';
import logoSafari from '../../assets/logo-safari.svg';
import logoOpera from '../../assets/logo-opera.svg';
import logoYandex from '../../assets/logo-yandex.svg';
import logoUC from '../../assets/logo-ucbrowser.svg';
import bakgoundImage from '../../assets/bg-wood-dock.jpg';
import bakgoundImageRetina from '../../assets/bg-wood-dock-retina.jpg';
import logoZextras from '../../assets/logo-zextras.png';
import { getLoginConfig } from '../services/login-page-services';
import FormSelector from './form-selector';
import ServerNotResponding from '../components-index/server-not-responding';
import { prepareUrlForForward, generateColorSet } from '../utils';

function modifyTheme(draft, variant, changes) {
	forEach(changes, (v, k) => set(draft, k, v));
}

function ModifiedTheme({ changes }) {
	const proxyFn = useCallback((draft, variant) => modifyTheme(draft, variant, changes), []);
	useSetCustomTheme(proxyFn);

	return null;
}

const LoginContainer = styled(Container)`
	padding: 0 100px;
	background: url(${(props) => props.backgroundImage}) no-repeat 75% center/cover;
	justify-content: center;
	align-items: flex-start;
	${({ screenMode }) => screenMode === 'mobile' && css`
		padding: 0 12px;
		align-items: center;	
	`}
	${({ isDefaultBg }) => isDefaultBg && css`
		@media (-webkit-min-device-pixel-ratio: 1.5), (min-resolution: 144dpi) { 
			background: url(${bakgoundImageRetina}) no-repeat 75% center/cover;
		}
	`}
`;

const FormContainer = styled.div`
	max-width: 100%;
	max-height: 100vh;
	box-shadow: 0px 0px 20px -7px rgba(0,0,0,0.3);
`;

const FormWrapper = styled(Container)`
	width: auto;
	height: auto;
	background-color: ${({ theme }) => theme.palette.gray6.regular};
	padding: 48px 48px 0;
	width: 436px;
	max-width: 100%;
	max-height: 620px;
	height: 100vh;
	overflow-y: auto;
	${({ screenMode }) => screenMode === 'mobile' && css`
		padding: 20px 20px 0;
		width: 360px;
		max-height: 100%;
		height: auto;
	`}
`;

const PhotoLink = styled(Link)``;
const PhotoCredits = styled(Text)`
	position: absolute;
	bottom: ${({ theme }) => theme.sizes.padding.large};
	right: ${({ theme }) => theme.sizes.padding.large};
	opacity: 50%;
	&, ${PhotoLink} {
	 	color: #fff;
	}
	 
	@media(max-width: 767px) {
		display: none;
	}
`;

export default function PageLayout({ version }) {
	const [t] = useTranslation();
	const screenMode = useScreenMode();
	const [logo, setLogo] = useState(null);
	const [serverError, setServerError] = useState(false);

	const urlParams = new URLSearchParams(window.location.search);
	const [destinationUrl, setDestinationUrl] = useState(prepareUrlForForward(urlParams.get('destinationUrl')));
	const [domain, setDomain] = useState(urlParams.get('domain') ?? destinationUrl);

	const [bg, setBg] = useState(bakgoundImage);
	const [isDefaultBg, setIsDefaultBg] = useState(true);
	const [editedTheme, setEditedTheme] = useState({});

	useLayoutEffect(() => {
		let componentIsMounted = true;

		getLoginConfig(version, domain, domain)
			.then((res) => {
				if(!destinationUrl) setDestinationUrl(prepareUrlForForward(res.publicUrl));
				if(!domain) setDomain(res.zimbraDomainName);

				const _logo = {};

				if (componentIsMounted) {
					if (res.loginPageBackgroundImage) {
						setBg(res.loginPageBackgroundImage);
						setIsDefaultBg(false);
					}

					if (res.loginPageLogo) {
						_logo.image = res.loginPageLogo;
						_logo.width = '100%';
					}
					else {
						_logo.image = logoZextras;
						_logo.width = '221px';
					}

					if (res.loginPageSkinLogoUrl) {
						_logo.url = res.loginPageSkinLogoUrl;
					}
					else {
						_logo.url = '';
					}

					if (res.loginPageTitle) {
						document.title = res.loginPageTitle;
					}
					else {
						document.title = t('zextras_authentication', 'Zextras Authentication');
					}

					if (res.loginPageFavicon) {
						const link = document.querySelector('link[rel*=\'icon\']') || document.createElement('link');
						link.type = 'image/x-icon';
						link.rel = 'shortcut icon';
						link.href = res.loginPageFavicon;
						document.getElementsByTagName('head')[0].appendChild(link);
					}

					if (res.loginPageColorSet) {
						const colorSet = res.loginPageColorSet;
						if (colorSet.primary) {
							setEditedTheme((et) => ({
								...et,
								'palette.primary': generateColorSet({ regular: `#${colorSet.primary}` })
							}));
						}
						if (colorSet.secondary) {
							setEditedTheme((et) => ({
								...et,
								'palette.secondary': generateColorSet({ regular: `#${colorSet.secondary}` })
							}));
						}
					}
					setLogo(_logo);
				}
			})
			.catch(() => {
				// It should never happen, If the server doesn't respond this page will not be loaded
				if (componentIsMounted)
					setServerError(true);
			});
		return () => {
			componentIsMounted = false;
		};
	}, []);

	if (serverError)
		return <ServerNotResponding/>;

	if (logo) {
		const logoHtml = (
			<img
				alt="Logo"
				src={logo.image}
				width={logo.width}
				style={{
					maxWidth: '100%',
					maxHeight: '150px',
					display: 'block',
					marginLeft: 'auto',
					marginRight: 'auto'
				}}
			/>
		);

		return (
			<LoginContainer screenMode={screenMode} isDefaultBg={isDefaultBg} backgroundImage={bg}>
				<ModifiedTheme changes={editedTheme} />
				<FormContainer>
					<FormWrapper mainAlignment="space-between" screenMode={screenMode}>
						<Container mainAlignment="flex-start" height="auto">
							<Padding value="28px 0 28px" crossAlignment="center">
								<Container crossAlignment="center">
									{logo.url
										? <a href={logo.url}>{logoHtml}</a>
										: logoHtml
									}
								</Container>
							</Padding>
						</Container>
						<FormSelector domain={domain} destinationUrl={destinationUrl} />
						<Container crossAlignment="flex-start" height="auto"
							padding={{ bottom: 'extralarge', top: 'extralarge' }}>
							<Text>{t('supported_browsers', 'Supported browsers')}</Text>
							<Row padding={{ top: 'medium', bottom: 'extralarge' }} wrap="nowrap">
								<Padding all="extrasmall" right="small">
									<Tooltip label="Chrome">
										<img
											alt=""
											src={logoChrome}
											width="18px"
										/>
									</Tooltip>
								</Padding>
								<Padding all="extrasmall" right="small">
									<Tooltip label="Firefox">
										<img
											alt=""
											src={logoFirefox}
											width="18px"
										/>
									</Tooltip>
								</Padding>
								<Padding all="extrasmall" right="small">
									<Tooltip label="Internet Explorer 11+">
										<img
											alt=""
											src={logoIE}
											width="18px"
										/>
									</Tooltip>
								</Padding>
								<Padding all="extrasmall" right="small">
									<Tooltip label="Edge">
										<img
											alt=""
											src={logoEdge}
											width="18px"
										/>
									</Tooltip>
								</Padding>
								<Padding all="extrasmall" right="small">
									<Tooltip label="Safari">
										<img
											alt=""
											src={logoSafari}
											width="18px"
										/>
									</Tooltip>
								</Padding>
								<Padding all="extrasmall" right="small">
									<Tooltip label="Opera">
										<img
											alt=""
											src={logoOpera}
											width="18px"
										/>
									</Tooltip>
								</Padding>
								<Padding all="extrasmall" right="small">
									<Tooltip label="Yandex">
										<img
											alt=""
											src={logoYandex}
											width="18px"
										/>
									</Tooltip>
								</Padding>
								<Padding all="extrasmall" right="small">
									<Tooltip label="UC">
										<img
											alt=""
											src={logoUC}
											width="18px"
										/>
									</Tooltip>
								</Padding>
							</Row>
							<Text
								size="small"
								overflow="break-word"
							>
								Copyright &copy;
								{` ${new Date().getFullYear()} Zextras, `}
								{t('all_rights_reserved', 'All rights reserved')}
							</Text>
						</Container>
					</FormWrapper>
				</FormContainer>
				{ isDefaultBg && (
					<PhotoCredits>
						Photo by Pok Rie from <PhotoLink href="https://www.pexels.com/" target="_blank" rel="nofollow">Pexels</PhotoLink>
					</PhotoCredits>
				)}
			</LoginContainer>
		);
	}

	return null;
}
