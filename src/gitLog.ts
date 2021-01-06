import git, { ReadCommitResult } from "isomorphic-git";

const fs = require("fs");

export async function getCommitMessage(sha: string, dir = "."): Promise<string>{
  let commits: ReadCommitResult[] = await git.log({fs, dir, ref: sha, depth: 1});
  return commits[0].commit.message;
}

export async function commitsForFile(filepath, dir = ".") {
  let commits: ReadCommitResult[] = await git.log({ fs, dir })
  let lastSHA: string|null = null
  let lastCommit: ReadCommitResult|null = null
  let commitsThatMatter: (ReadCommitResult|null)[] = []
  for (let commit of commits) {
    try {
      let o = await git.readObject({ fs, dir, oid: commit.oid, filepath })
      if (o.oid !== lastSHA) {
        if (lastSHA !== null) commitsThatMatter.push(lastCommit)
        lastSHA = o.oid
      }
    } catch (err) {
      // file no longer there
      commitsThatMatter.push(lastCommit)
      break;
    }
    lastCommit = commit
  }
  return commitsThatMatter
}
