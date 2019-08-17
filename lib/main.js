"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = require('@actions/github');
const config = {
    owner: 'adasq',
    repo: 'greenbot',
};
const ref = 'heads/master';
// Customize this stuff:
const owner = 'adasq';
const repo = 'greenbot';
// Constants
const FILE = '100644'; // commit mode
const content = 'a3' + Date.now();
const branchName = `branch-no-${Date.now()}`;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const octokit = new github.GitHub('');
            function createBlob(content) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { data: { sha: blob_sha } } = yield octokit.git.createBlob(Object.assign({}, config, { encoding: "utf-8", content }));
                    return blob_sha;
                });
            }
            // 1. Get the sha of the last commit
            const { data: { object } } = yield octokit.git.getRef({ repo, owner, ref });
            let sha_latest_commit = object.sha;
            console.log('sha_latest_commit', sha_latest_commit);
            // 1.1 create branch...
            const branch = yield octokit.git.createRef(Object.assign({}, config, { ref: `refs/heads/${branchName}`, sha: sha_latest_commit }));
            sha_latest_commit = branch.data.object.sha;
            console.log('branch sha_latest_commit', sha_latest_commit);
            // 2. Find and store the SHA for the tree object that the heads/master commit points to.
            const { data: { tree } } = yield octokit.git.getCommit({ repo, owner, commit_sha: sha_latest_commit });
            const sha_base_tree = tree.sha;
            // 3. Create some content
            const blob1_sha = yield createBlob(content);
            const blob2_sha = yield createBlob(content + '111');
            // 4. Create a new tree with the content in place
            const { data: new_tree } = yield octokit.git.createTree({
                repo,
                owner,
                base_tree: sha_base_tree,
                tree: [
                    {
                        path: 'test3.xd',
                        mode: FILE,
                        type: 'blob',
                        sha: blob1_sha,
                    }, {
                        path: 'test4.xd',
                        mode: FILE,
                        type: 'blob',
                        sha: blob2_sha,
                    }
                ],
            });
            // 5. Create a new commit with this tree object
            const { data: new_commit } = yield octokit.git.createCommit({
                repo,
                owner,
                message: "new commit",
                tree: new_tree.sha,
                parents: [
                    sha_latest_commit
                ],
            });
            console.log('new_commit', new_commit);
            // 6. Move the reference to point at new commit.
            const { data: { object: updated_ref } } = yield octokit.git.updateRef({
                repo,
                owner,
                ref: `heads/${branchName}`,
                sha: new_commit.sha,
            });
            const pr = yield octokit.pulls.create(Object.assign({}, config, { title: 'title', body: `content
new line...`, head: branchName, base: 'master' }));
            console.log(pr.data);
            const myInput = core.getInput('myInput');
            core.debug(`Hello ${myInput}`);
            core.warning(`!2Hello ${myInput}`);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
