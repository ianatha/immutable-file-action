const git = require("isomorphic-git");
const fs = require("fs");

interface Commit {
  oid: any;
}

export async function commitsForFile(filepath, dir = ".") {
  let commits: Commit[] = await git.log({ fs, dir })
  let lastSHA = null
  let lastCommit: Commit|null = null
  let commitsThatMatter: (Commit|null)[] = []
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
