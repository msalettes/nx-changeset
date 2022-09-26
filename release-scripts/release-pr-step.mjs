/* eslint-disable no-console */
import core from '@actions/core';

import github from '@actions/github';

import createReleasePR from './release-pr.mjs';

(async () => {
  const githubToken = process.env.GITHUB_TOKEN;
  const baseBranch = process.env.BASE_BRANCH || 'main';

  if (!githubToken) {
    core.setFailed('Please add the GITHUB_TOKEN to the changesets action');

    return;
  }

  try {
    const octokit = github.getOctokit(githubToken);
    const { context } = github;
    console.log("DEBUG ~ file: release-pr-step.mjs ~ line 11 ~ baseBranch", baseBranch)

    await createReleasePR({ context, octokit, baseBranch });
  } catch (error) {
    console.error('The automated release failed with %O', error);
    core.setFailed(error.message);
  }
})();
