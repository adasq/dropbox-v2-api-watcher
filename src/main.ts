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

async function run() {
  try {

    const octokit = new github.GitHub(process.env.TOKEN);

    const createPullRequest = async ({
      owner,
      repo,
      from,
      to,
      title,
      body,
      commitMessage,
      files
    }) => {
      async function createBlob(content) {
        const { data: { sha: blob_sha } } = await octokit.git.createBlob({
          owner,
          repo,
          encoding: "utf-8",
          content,
        });
        return blob_sha;
      }

      // 1. Get the sha of the last commit
      const { data: { object } } = await octokit.git.getRef({ repo, owner, ref: 'heads/' + to });
      let sha_latest_commit = object.sha;

      console.log('sha_latest_commit', sha_latest_commit)
      // 1.1 create branch...
      const branch = await octokit.git.createRef({
        owner,
          repo,
        ref: `refs/heads/${from}`,
        sha: sha_latest_commit
      })

      sha_latest_commit = branch.data.object.sha;

      console.log('branch sha_latest_commit', sha_latest_commit)

      // 2. Find and store the SHA for the tree object that the heads/master commit points to.
      const { data: { tree } } = await octokit.git.getCommit({ repo, owner, commit_sha: sha_latest_commit })
      const sha_base_tree = tree.sha;

      // 3. Create some content
      const blob_shas = await Promise.all(files.map(([path, content]) => createBlob(content)))
      
      console.log(blob_shas);
      
      // 4. Create a new tree with the content in place
      const { data: new_tree } = await octokit.git.createTree({
        repo,
        owner,
        base_tree: sha_base_tree, // if we don't set this, all other files will show up as deleted.
        tree: files.map(([path], index) => {
          return {
            path: path,
            mode: FILE,
            type: 'blob',
            sha: blob_shas[index],
          }
        }),
      });

      // 5. Create a new commit with this tree object
      const { data: new_commit } = await octokit.git.createCommit({
        repo,
        owner,
        message: commitMessage,
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
        ref: `heads/${from}`,
        sha: new_commit.sha,
      });

      console.log('updated_ref', updated_ref)

      const pr = await octokit.pulls.create({
        repo,
        owner,
        title,
        body,
        head: from,
        base: to
      })

      console.log(pr.data)
    }

    await createPullRequest({
      owner: 'adasq',
      repo: 'dropbox-v2-api',
      from: `branch-no-${Date.now()}`,
      to: 'testing-gh-actions',
      title: 'PR title',
      body: 'PR body',
      commitMessage: 'ver update',
      files: [
        ['test321', 'content of test321 xxx'],
        ['dist/api.json', require('fs').readFileSync('dist/api.json').toString()]
      ]
    })

    const myInput = core.getInput('myInput');
    core.debug(`Hello ${myInput}`);
    core.warning(`!2Hello ${myInput}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
