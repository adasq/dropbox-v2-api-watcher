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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const octokit = new github.GitHub('ef2686bc3ccd2db0b5a097c6d1b1c8080e9f426a');
            const sha_latest_commit = yield octokit.git.getRef(Object.assign({}, config, { ref }));
            console.log(sha_latest_commit.data.object.sha);
            const commit = yield octokit.git.getCommit(Object.assign({}, config, { commit_sha: sha_latest_commit.data.object.sha }));
            console.log(commit.data.tree.sha);
            const blob = yield octokit.git.createBlob(Object.assign({}, config, { content: 'asdasdasd' + Date.now() }));
            console.log(blob.data.sha);
            const sha_new_tree = yield octokit.git.createTree(Object.assign({}, config, { tree: [
                    {
                        path: "test.text",
                        mode: "100644",
                        type: "blob",
                        sha: blob.data.sha,
                        base_tree: commit.data.tree.sha
                    }
                ] }));
            console.log(sha_new_tree.data.sha);
            const commit2 = yield octokit.git.createCommit(Object.assign({}, config, { message: '!!!!!', tree: sha_new_tree.data.sha, parents: [sha_latest_commit.data.object.sha] }));
            console.log(commit2.data);
            const result111 = yield octokit.git.updateRef(Object.assign({}, config, { ref, sha: commit2.data.sha }));
            console.log(result111.data);
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
