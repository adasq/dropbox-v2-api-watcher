import * as core from '@actions/core';
const github = require('@actions/github');

const config = {
  owner: 'adasq',
  repo: 'greenbot',
}
const ref = 'heads/master'

async function run() {
  try {
    const octokit = new github.GitHub('22ffdfb2b815c22603d33701b709922a3de04e99');



    const sha_latest_commit = await octokit.git.getRef({
      ...config,
      ref
    })
    console.log(sha_latest_commit.data.object.sha)

    const commit = await octokit.git.getCommit({
      ...config,
      commit_sha: sha_latest_commit.data.object.sha
    })

    console.log(commit.data.tree.sha);


    const blob = await octokit.git.createBlob({
      ...config,
      content: 'asdasdasd'
    })

    console.log(blob.data.sha);


    const sha_new_tree = await octokit.git.createTree({
      ...config,
      tree: [
        {
          path: "test.text",
          mode: "100644",
          type: "blob",
          sha: blob.data.sha,
          base_tree: commit.data.tree.sha
        }
      ]
    })

    console.log(sha_new_tree.data.sha);

    const commit2 = await octokit.git.createCommit({
      ...config,
      message: '!!!!!',
      tree: sha_new_tree.data.sha,
      parents: [sha_latest_commit.data.object.sha]
    })

    console.log(commit2.data)

    const result111 = await octokit.git.updateRef({
      ...config,
      ref,
      sha: commit2.data.sha
    })

    console.log(result111.data)

    const myInput = core.getInput('myInput');
    core.debug(`Hello ${myInput}`);
    core.warning(`!2Hello ${myInput}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
