import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";

import { getChangedFiles } from "./fileUtils";
import { getPrNumber, getSha } from "./githubUtils";
import inputs from "./inputs";

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

async function run(): Promise<void> {
  const prNumber = getPrNumber();

  try {
    const octokit = new Octokit({
      auth: inputs.token,
      log: {
        debug: core.debug,
        info: core.info,
        warn: core.warning,
        error: core.error,
      },
    });
    core.info(`PR: ${prNumber}, SHA: ${getSha()}, OWNER: ${OWNER}, REPO: ${REPO}`);
    
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

    core.debug("Fetching changed files.");

    const changedFiles = await getChangedFiles(octokit, inputs.files, prNumber, getSha());
    core.debug(`${changedFiles.length} files match ${inputs.files}.`);
    
    const success = (changedFiles.length == 0);
    
    await octokit.checks.update({
      owner: OWNER,
      repo: REPO,
      completed_at: new Date().toISOString(),
      status: "completed",
      check_run_id: checkId,
      conclusion: (success ? "success" : "failure"),
      output: {
        title: "Immutable Files Check",
        summary: "Ensure no files in " + JSON.stringify(inputs.files) + " have been changed",
        annotations: files2annotations(changedFiles),
      },
    });
  } catch (err) {
    core.setFailed(err.message ? err.message : "error checking files.");
  }
}

run();
