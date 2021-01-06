import * as core from "@actions/core";

import { runImmutableFiles } from "./immutableFiles";
import { getPrNumber, getSha } from "./githubUtils";
import { Octokit } from "@octokit/rest";
import inputs from "./inputs";
import * as github from "@actions/github";
import { runCommitMessages } from "./commitMessages";

const OWNER = github.context.repo.owner;
const REPO = github.context.repo.repo;

async function run(): Promise<void> {
  try {
    const prNumber = getPrNumber();

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

    await runImmutableFiles({octokit, prNumber, OWNER, REPO});
    await runCommitMessages();
  } catch (err) {
    core.setFailed(err.message ? err.message : "error");
  }
}

run();
