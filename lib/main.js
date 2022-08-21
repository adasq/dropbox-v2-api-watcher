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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const octokit = new github.GitHub(process.env.TOKEN);
            const createPullRequest = ({ owner, repo, from, to, title, body, commitMessage, files }) => __awaiter(this, void 0, void 0, function* () {
                function createBlob(content) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const { data: { sha: blob_sha } } = yield octokit.git.createBlob({
                            owner,
                            repo,
                            encoding: "utf-8",
                            content,
                        });
                        return blob_sha;
                    });
                }
                // 1. Get the sha of the last commit
                const { data: { object } } = yield octokit.git.getRef({ repo, owner, ref: 'heads/' + to });
                let sha_latest_commit = object.sha;
                console.log('sha_latest_commit', sha_latest_commit);
                // 1.1 create branch...
                const branch = yield octokit.git.createRef({
                    owner,
                    repo,
                    ref: `refs/heads/${from}`,
                    sha: sha_latest_commit
                });
                sha_latest_commit = branch.data.object.sha;
                console.log('branch sha_latest_commit', sha_latest_commit);
                // 2. Find and store the SHA for the tree object that the heads/master commit points to.
                const { data: { tree } } = yield octokit.git.getCommit({ repo, owner, commit_sha: sha_latest_commit });
                const sha_base_tree = tree.sha;
                // 3. Create some content
                const blob_shas = yield Promise.all(files.map(([path, content]) => createBlob(content)));
                console.log(blob_shas);
                // 4. Create a new tree with the content in place
                const { data: new_tree } = yield octokit.git.createTree({
                    repo,
                    owner,
                    base_tree: sha_base_tree,
                    tree: files.map(([path], index) => {
                        return {
                            path: path,
                            mode: FILE,
                            type: 'blob',
                            sha: blob_shas[index],
                        };
                    }),
                });
                // 5. Create a new commit with this tree object
                const { data: new_commit } = yield octokit.git.createCommit({
                    repo,
                    owner,
                    message: commitMessage,
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
                    ref: `heads/${from}`,
                    sha: new_commit.sha,
                });
                console.log('updated_ref', updated_ref);
                const pr = yield octokit.pulls.create({
                    repo,
                    owner,
                    title,
                    body,
                    head: from,
                    base: to
                });
                console.log(pr.data);
            });
            yield createPullRequest({
                owner: 'adasq',
                repo: 'dropbox-v2-api',
                from: `dropbox-api-changes-detection-${Date.now()}`,
                to: 'master',
                title: 'Dropbox API changes detected',
                body: 'Updating API description',
                commitMessage: 'Dropbox API changes detected',
                files: [
                    ['dist/api.json', require('fs').readFileSync('dist/api.json').toString()]                   
                ]
            });
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
