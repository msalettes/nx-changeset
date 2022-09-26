import shelljs from 'shelljs';

import jsonFilePlus from 'json-file-plus';
import * as fs from 'fs';

import * as path from 'path';
import {
  getPackageVersion,
  getPackageNameList,
  getPackageShortName,
  getPackageList,
  ROMA_DS_PACKAGE_NAME,
  ROMA_PACKAGE_NAME,
  ROMA_DOC_PACKAGE_NAME,
  getFullPackageVersion,
} from './monorepo.mjs';


const CHANGESET_CONFIG_FILE_PATH = '.changeset/config.json';

const getPackagesWithChangesets = () => {
  // Get package list
  const result = shelljs.exec('yarn changeset status');

  if (result.code === 0) {
    const matches = result.stdout.match(/(@changeset\/[\w-]+)/g);

    return matches !== null ? matches : [];
  }

  return [];
};

async function changesetVersion(packageName) {
  console.log('Create new version for the following package: ', packageName);

  if (packageName) {
    const changesetConfigFile = await jsonFilePlus(CHANGESET_CONFIG_FILE_PATH);
    const fixedConfig = await changesetConfigFile.get('fixed');

    const packagesToVersion = fixedConfig.find((fixedPackages) =>
      fixedPackages.includes(packageName)
    ) ?? [packageName];

    // changeset do not want to ignore @mirakl/roma-documentation when version @mirakl/roma
    if (packageName === ROMA_PACKAGE_NAME) {
      packagesToVersion.push(ROMA_DOC_PACKAGE_NAME);
    }

    const allPackages = await getPackageNameList();
    const packagesToIgnore = allPackages.filter(
      (pkgName) => !packagesToVersion.includes(pkgName)
    );

    /**
     * Update 'ignore' property inside '.changeset/config.json' to ensure to version
     * only wanted package because we can not use the --ignore command when having an ignore config
     * (By default, changeset version all packages having changeset files)
     */
    changesetConfigFile.set({
      ignore: changesetConfigFile.data.ignore.concat(packagesToIgnore),
    });

    console.log('Ignored packages:', packagesToIgnore.join(','));
    await changesetConfigFile.save();

    const versionResult = shelljs.exec('yarn changeset version');
    if (versionResult.code !== 0) {
      throw new Error('Changeset creation has failed!');
    }
    // reset 'ignore' property value inside '.changeset/config.json'
    shelljs.exec(`git checkout ${CHANGESET_CONFIG_FILE_PATH}`);
  }
}

async function createVersion({ context, octokit, packageName, baseBranch }) {
  const repositoryPathname = `${context.repo.owner}/${context.repo.repo}`;

  const packageShortName = getPackageShortName(packageName);
  const versionBranch = `changeset-release-${packageShortName}`;

  try {
    shelljs.exec(`git checkout -b ${versionBranch}`, { silent: true });

    await changesetVersion(packageName);

    shelljs.exec(`git push -f origin ${versionBranch}`);

    // Get changelog content
    const changelogContents = fs.readFileSync(
      path.join(
        `${process.cwd()}/packages/${packageShortName}`,
        'CHANGELOG.md'
      ),
      'utf8'
    );

    const newPackageVersion = await getPackageVersion(packageName);
    const fullPackageVersion = getFullPackageVersion(
      packageShortName,
      newPackageVersion
    );


    const versionPRBody = `## ${fullPackageVersion}`;

    // Check if pr already exists
    const prSearchQuery = `repo:${repositoryPathname}+state:open+head:${versionBranch}+base:${baseBranch}`;
    const prSearchQueryResult = await octokit.rest.search.issuesAndPullRequests(
      {
        q: prSearchQuery,
      }
    );

    const prTitle = `release(${packageShortName}): new version ${newPackageVersion}`;
    if (prSearchQueryResult.data.items.length === 0) {
      console.log(`creating pull request for ${packageName}`);
      const { data: newPullRequest } = await octokit.rest.pulls.create({
        base: baseBranch,
        head: versionBranch,
        title: prTitle,
        body: versionPRBody,
        ...context.repo,
      });
      console.log('PR created, ID: ', newPullRequest.number);
    } else {
      const [pullRequest] = prSearchQueryResult.data.items;

      console.log(`updating found pull request #${pullRequest.number}`);
      await octokit.rest.pulls.update({
        pull_number: pullRequest.number,
        title: prTitle,
        body: versionPRBody,
        ...context.repo,
      });
    }
  } catch (error) {
    // List if there are still uncommitted files
    shelljs.exec('git status');

    // delete uncommitted files
    shelljs.exec('git reset --hard HEAD');
    console.error(
      `PR creation or update failed for ${packageName}: ${error.message}`
    );
  } finally {
    // Switch back to the base branch
    shelljs.exec(`git checkout ${baseBranch}`);
  }
}

async function createReleasePR({ context, octokit, baseBranch = 'main' }) {
  const unpublishedPackages = getPackagesWithChangesets();
  /**
   * packages which are not publishable on registry or directly published (ex: roma-design-system)
   */
  const privatePackages = await getPackageList().then((packages) =>
    packages
      .filter(
        ({ private: isPrivate, name }) =>
          isPrivate || name === ROMA_DS_PACKAGE_NAME
      )
      .map(({ name }) => name)
  );
  const packagesToVersion = unpublishedPackages.filter(
    (pkg) => !privatePackages.includes(pkg)
  );
  console.log('Packages to release:', packagesToVersion);

  // eslint-disable-next-line no-restricted-syntax
  for (const packageName of packagesToVersion) {
    /**
     * This tasks can not be parallelize because during this process
     * there are switches of branches (between baseBranch and targetBranch)
     */
    // eslint-disable-next-line no-await-in-loop
    await createVersion({ context, octokit, packageName, baseBranch });
  }
}

export default createReleasePR;
