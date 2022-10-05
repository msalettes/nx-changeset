import github from '@actions/github';

async function updatePR() {
  const githubToken = process.env.GITHUB_TOKEN;
  const octokit = github.getOctokit(githubToken);
  const { context } = github;

  const labels = ['Work In Progress'];

  try {
    const response = await octokit.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo,
      issue_number: 2,
      labels,
    });

    console.log('Response: ', response);

  } catch (error) {
    console.log("DEBUG ~ file: test.mjs ~ line 21 ~ updatePR ~ error", error)
  }

}

updatePR();
