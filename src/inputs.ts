import * as core from "@actions/core";

const processArrayInput = (key: string, required = false): string[] => {
  return core
    .getInput(key, { required })
    .split(",")
    .map((e) => e.trim());
};

const inputs = {
  get token() {
    return core.getInput("repo-token", { required: true });
  },

  get files() {
    return processArrayInput("files");
  }
};

export default inputs;
