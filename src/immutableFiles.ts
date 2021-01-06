import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";

import { getChangedFiles } from "./fileUtils";
import { getPrNumber, getSha } from "./githubUtils";
import inputs from "./inputs";
import { commitsForFile } from "./gitLog";

const CHECK_NAME = "Immutable Files";
const OWNER = github.context.repo.owner;
const REPO = github.context.repo.repo;

function files2annotations(x: string[]): any[] {
  return x.map((f) => {
    return {
      path: f,
      start_line: 1,
      end_line: 1,
      annotation_level: "failure",
      message: "You're not supposed to change this file after it's commited to master."
    }
  })
}

export async function runImmutableFiles({octokit, prNumber, OWNER, REPO}): Promise<void> {
  const {
    data: { id: checkId },
  } = await octokit.checks.create({
    owner: OWNER,
    repo: REPO,
    started_at: new Date().toISOString(),
    head_sha: getSha(),
    status: "in_progress",
    name: CHECK_NAME,
  });

  core.info("Fetching changed files.");

  const changedFiles = await getChangedFiles(octokit, inputs.files, prNumber, getSha());
  core.info(`${changedFiles.length} files match ${inputs.files}.`);

  const WORKSPACE_DIR = process.env["GITHUB_WORKSPACE"] + '/';

  let oldChangedFiles: string[] = [];

  for (let i in changedFiles) {
    const changedFile = changedFiles[i].slice(WORKSPACE_DIR.length)
    const commits = await commitsForFile(changedFile);
    if (commits.length > 1) {
      core.info(` * ${changedFile} = ${commits.length} commits`);
      oldChangedFiles.push(changedFiles[i])
    } else {
      core.info(` * ${changedFile} new file`);
    }
  }

  const success = (oldChangedFiles.length == 0);

  await octokit.checks.update({
    owner: OWNER,
    repo: REPO,
    completed_at: new Date().toISOString(),
    status: "completed",
    check_run_id: checkId,
    conclusion: (success ? "success" : "failure"),
    output: {
      title: "Immutable Files Check",
      summary: "Ensure no files in " + JSON.stringify(inputs.files) + " have been changed after committed",
      annotations: files2annotations(oldChangedFiles),
    },
  });
}
