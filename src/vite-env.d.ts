/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 大模型 API key,构建时烤进前端 bundle(仅适合额度受限的 demo key) */
  readonly VITE_LLM_KEY?: string;
}
