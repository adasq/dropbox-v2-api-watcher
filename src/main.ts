import * as core from '@actions/core';
const github = require('@actions/github');

const config = {
  owner: 'adasq',
  repo: 'greenbot',
}
const ref = 'heads/master'

// Customize this stuff:
const owner = 'adasq';
const repo = 'greenbot';

// Constants
const FILE = '100644'; // commit mode


const content = 'a3' + Date.now()
const branchName = `branch-no-${Date.now()}`



async function run() {
  try {

    const octokit = new github.GitHub('');

    async function createBlob(content) {
      const { data: { sha: blob_sha } } = await octokit.git.createBlob({
        ...config,
        encoding: "utf-8",
        content,
      });
      return blob_sha;
    }

    // 1. Get the sha of the last commit
    const { data: { object } } = await octokit.git.getRef({repo, owner, ref});
    let sha_latest_commit = object.sha;

    console.log('sha_latest_commit', sha_latest_commit)
    // 1.1 create branch...
    const branch = await octokit.git.createRef({
      ...config,
      ref: `refs/heads/${branchName}`,
      sha: sha_latest_commit
    })

    sha_latest_commit = branch.data.object.sha;

    console.log('branch sha_latest_commit', sha_latest_commit)

    // 2. Find and store the SHA for the tree object that the heads/master commit points to.
    const { data: { tree }} = await octokit.git.getCommit({repo, owner, commit_sha: sha_latest_commit})
    const sha_base_tree = tree.sha;
  
    // 3. Create some content
    const blob1_sha = await createBlob(content);
    const blob2_sha = await createBlob(content + '111');
  
    // 4. Create a new tree with the content in place
    const { data: new_tree } = await octokit.git.createTree({
      repo,
      owner,
      base_tree: sha_base_tree, // if we don't set this, all other files will show up as deleted.
      tree: [
        {
          path: 'test3.xd',
          mode: FILE,
          type: 'blob',
          sha: blob1_sha,
        },         {
          path: 'test4.xd',
          mode: FILE,
          type: 'blob',
          sha: blob2_sha,
        }
      ],
    });
  
    // 5. Create a new commit with this tree object
    const { data: new_commit } = await octokit.git.createCommit({
      repo,
      owner,
      message: "new commit",
      tree: new_tree.sha,
      parents: [
        sha_latest_commit
      ],
    });
  console.log('new_commit', new_commit)
    // 6. Move the reference to point at new commit.
    const { data: { object: updated_ref } } = await octokit.git.updateRef({
      repo,
      owner,
      ref: `heads/${branchName}`,
      sha: new_commit.sha, 
    });
    const pr = await octokit.pulls.create({
      ...config,
      title: 'title',
      body: `content
new line...`,
      head: branchName,
      base: 'master'
    })

    console.log(pr.data)


    const myInput = core.getInput('myInput');
    core.debug(`Hello ${myInput}`);
    core.warning(`!2Hello ${myInput}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
