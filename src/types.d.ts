declare namespace NodeJS {
  export interface ProcessEnv {
    GITHUB_ACTION: string;
    GITHUB_WORKSPACE: string;
  }
}

interface PrFilesResponse {
  endCursor?: string;
  hasNextPage?: boolean;
  files: string[];
}

interface PrCommitsResponse {
  endCursor?: string;
  hasNextPage?: boolean;
  commits: string[];
}
