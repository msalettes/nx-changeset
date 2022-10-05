import github from '@actions/github';
import core from '@actions/core';

async function updatePR(octokit) {
  const { context } = github;
  console.log("DEBUG ~ file: test.mjs ~ line 6 ~ updatePR ~ context", context.repo);

  const labels = ['Work In Progress'];

  try {

    // const { data: newPullRequest } = await octokit.rest.pulls.create({
    //   base: 'main',
    //   head: 'chore-test-wfs',
    //   title: 'Test fwfew',
    //   body: 'test pr create',
    //   ...context.repo,
    // });

    console.log('PR created, ID: ', newPullRequest.number);
    const pr = await octokit.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: 2,
    });

    console.log("DEBUG ~ file: test.mjs ~ line 17 ~ updatePR ~ pr", pr)


    // console.log(octokit.rest.issues);
    const response = await octokit.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: newPullRequest.number,
      labels,
    });

    console.log('Response: ', response);

  } catch (error) {
    console.log("DEBUG ~ file: test.mjs ~ line 21 ~ updatePR ~ error", error)
  }
}

(async () => {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    core.setFailed('Please add the GITHUB_TOKEN to the changesets action');

    return;
  }

  try {
    const octokit = github.getOctokit(githubToken);
    await updatePR(octokit);
  } catch (error) {
    console.error('The automated release failed with %O', error);
    core.setFailed(error.message);
  }
})();
