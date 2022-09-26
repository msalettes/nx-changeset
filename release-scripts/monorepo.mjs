import jsonFilePlus from 'json-file-plus';
import { getPackages } from '@manypkg/get-packages';

export const ROMA_PACKAGE_NAME = '@mirakl/roma';
export const ROMA_DS_PACKAGE_NAME = '@mirakl/roma-design-system';
export const ROMA_DOC_PACKAGE_NAME = '@mirakl/roma-documentation';

export const NPM_SCOPE = '@mirakl';
/**
 * Return a array of string corresponding to the list of package name
 */
export async function getPackageList() {
  // Get package list
  const { packages } = await getPackages(process.cwd());

  return packages.map(({ packageJson }) => packageJson);
}

export function getPackageShortName(packageName) {
  return packageName.split('/')[1];
}

export function getPackageNameFromShortName(packageShortName) {
  return `${NPM_SCOPE}/${packageShortName}`;
}

export function getFullPackageVersion(packageShortName, packageVersion) {
  return `${getPackageNameFromShortName(packageShortName)}@${packageVersion}`;
}

export async function getPackageNameList() {
  // Get package list
  const packages = await getPackageList();

  return packages.map(({ name }) => name);
}

export async function getPackageVersion(packageName, cwd = process.cwd()) {
  const packageShortName = getPackageShortName(packageName);
  const packageJson = await jsonFilePlus(
    `${cwd}/packages/${packageShortName}/package.json`
  );

  return packageJson.get('version');
}
