import type { Metadata } from 'next';
import type { ServerFunctionClient } from 'payload';

import '@payloadcms/next/css';
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts';

import config from '../../../payload.config';
import './admin.css';
import { importMap } from './admin/importMap.js';

export const metadata: Metadata = {
	description: '배우앤배움 통합 관리 시스템',
	title: '배우앤배움 통합 관리',
};

export default function PayloadLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const serverFunction: ServerFunctionClient = async args => {
		'use server';

		return handleServerFunctions({
			...args,
			config,
			importMap,
		});
	};

	return (
		<RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
			{children}
		</RootLayout>
	);
}
