/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_KEY_GPT_3_5?: string;
  readonly API_KEY_GPT_4?: string;
  readonly API_KEY_DEEPSEEK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
