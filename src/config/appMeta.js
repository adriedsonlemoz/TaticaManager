export const APP_NAME = 'Tática Manager';
export const APP_VERSION = '1.0.0-beta.14';
const betaMatch = APP_VERSION.match(/^(\d+\.\d+)\.0-beta\.(\d+)$/);
export const APP_VERSION_LABEL = betaMatch ? `v${betaMatch[1]} beta.${betaMatch[2]}` : `v${APP_VERSION}`;
