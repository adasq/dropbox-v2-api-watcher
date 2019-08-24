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

    const createCommit = async ({
      owner,
      repo,
      to,
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
      const { data: { object } } = await octokit.git.getRef({ repo, owner, ref: 'heads/master' });
      let sha_latest_commit = object.sha;

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
        ref: `heads/master`,
        sha: new_commit.sha,
      });

      return new_commit.sha;
    }
    

    const packageJson = require('fs').readFileSync('package.json').toString();
    const packageJsonObj = JSON.parse(packageJson);
    const versions = packageJsonObj.version.split('.')
    versions[2] = (+versions[2] + 1).toString()
    const newVersion = versions.join('.');
    packageJsonObj.version = newVersion

    // await createPullRequest({
    //   owner: 'adasq',
    //   repo: 'sourcejs-muslim',
    //   from: `test-${Date.now()}`,
    //   to: 'master',
    //   title: 'test',
    //   body: 'test',
    //   commitMessage: 'test',
    //   files: [
    //     ['package.json', JSON.stringify(packageJsonObj, null, '  ')],
    //   ]
    // })

    const commitSha = await createCommit({
      owner: 'adasq',
      repo: 'sourcejs-muslim',
      to: 'master',
      commitMessage: `v${newVersion}`,
      files: [
        ['package.json', JSON.stringify(packageJsonObj, null, '  ')],
      ]
    })

    const createTag = async ({
      owner,
      repo,
      tag,
      sha
    }) => {
      const result123 = await octokit.git.createTag({
        owner,
        repo,
        tag: tag,
        message: tag,
        object: sha,
        type: 'commit'
      })
  
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/tags/${tag}`,
        sha: result123.data.sha
      })
    }
    
    await createTag({
      owner: 'adasq',
      repo: 'sourcejs-muslim',
      tag: `v${newVersion}`,
      sha: commitSha
    })

    const myInput = core.getInput('myInput');
    core.debug(`Hello ${myInput}`);
    core.warning(`!2Hello ${myInput}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
