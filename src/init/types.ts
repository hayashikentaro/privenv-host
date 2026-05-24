export interface InitResult {
  ok: true;
  type: "init.result";
  files: {
    hostConfig: InitFileResult;
    vaultExample: InitFileResult;
    gitignore: InitFileResult;
    vault: {
      path: ".privenv/vault.json";
      created: false;
    };
  };
  warnings: string[];
}

export interface InitFileResult {
  path: string;
  created: boolean;
  updated: boolean;
  overwritten: boolean;
  skipped: boolean;
}
