import * as core from "@actions/core";
import * as github from "@actions/github";
import { getCommitMessage } from "./gitLog";
import { Rule } from "./message-helper";

// import { getConfig } from "./config";
// import { getSettings } from "./settings-helper";
// import { Rule } from "./message-helper";
export interface RegexHeader {
  fixup: RegExp;
  type: RegExp;
  scope: RegExp;
  subject: RegExp;

  combined: RegExp;
}

export interface IConfig {
  // Format for header: <type>(<scope>): <subject>
  header: RegexHeader;

  // Body strictly has first line empty
  body: RegExp;

  // <scope> field will be compulsory
  compulsoryScope: boolean;

  // Max allowed header length
  maxHeaderLength: number;
};

export interface IGitActionSettings {

  // <scope> field will be compulsory
  compulsoryScope: boolean;

  // Maximum length that the header should have
  maxHeaderLength: number;

};

// Settings used while testing
export const getDefaultSettings = () => {
  return {
    compulsoryScope: false,
    maxHeaderLength: 50
  } as IGitActionSettings;
};

export function getConfig(settings: IGitActionSettings): IConfig {
  const config = {} as IConfig;
  config.header = {} as RegexHeader;

  config.header.fixup = /(fixup! )*/;
  config.header.type = /[a-zA-Z]+/;
  config.header.scope = /\(([0-9a-zA-Z\-]+)\)/;
  config.header.subject = /.+/; // Strictly has atleast on charater

  if (settings.compulsoryScope) {
    config.header.combined = /([a-zA-Z]+)(\(([0-9a-zA-Z\-]+)\))!?: (.+)/;
  } else {
    config.header.combined = /([a-zA-Z]+)(\(([0-9a-zA-Z\-]+)\))?!?: (.+)/;
  }

  config.body = /^\n(.+\s*)*/;

  config.compulsoryScope = settings.compulsoryScope;
  config.maxHeaderLength = settings.maxHeaderLength;

  return config;
};

export function getSettings(): IGitActionSettings {
  const settings = getDefaultSettings();

  settings.compulsoryScope = (core.getInput('compulsory-scope') || 'false').toLowerCase() === 'true';

  let _maxHeaderLength = parseInt((core.getInput('max-header-length') || '50'));
  if (_maxHeaderLength == NaN || _maxHeaderLength <= 0) {
    throw new Error('max-header-length should be valid non-zero positive integer')
  } else {
    settings.maxHeaderLength = _maxHeaderLength;
  }

  return settings;
};

export async function runCommitMessages(): Promise<void> {
  try {
    const commitSHA = github.context.sha;
    core.debug(`Commit Message SHA:${commitSHA}`);

    const message = await getCommitMessage(commitSHA);
    core.debug(`Commit Message Found:\n${message}`);

    const settings = getSettings();
    const config = getConfig(settings);
    const rule = new Rule(message, config);
    rule.check(); // raises an exception if any problem occurs

    // No problem occured. Commit message is OK
    core.info('Commit message is OK 😉🎉');
  } catch (err) {
    core.setFailed(`Action failed with error
        ${err.stack}`);
  }
};
