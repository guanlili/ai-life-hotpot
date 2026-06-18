// Vite 配置：原生拼装 TanStack Start + React + Tailwind + tsconfig 别名 + Nitro（构建期）。
// 目标 Nitro preset = cloudflare-module（Worker 模块 + 静态资源，读 env.ASSETS），
// 由 wrangler.jsonc 部署为 Cloudflare Workers + Static Assets。
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig(({ command, mode }) => {
  // 把 VITE_* 环境变量注入为 import.meta.env.*
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define = Object.fromEntries(
    Object.entries(env).map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)]),
  );

  return {
    define,
    css: { transformer: "lightningcss" },
    resolve: {
      tsconfigPaths: true,
      alias: { "@": srcDir },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      exclude: ["@mediapipe/tasks-vision"],
      ignoreOutdatedRequests: true,
    },
    server: { host: "::", port: 8080 },
    plugins: [
      tailwindcss(),
      // SSR 入口指向 src/server.ts（带错误兜底的 fetch 处理器）
      tanstackStart({
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
      }),
      viteReact(),
      // 解决 @mediapipe/tasks-vision 缺失 sourcemap 报警告/错误的问题
      {
        name: "remove-mediapipe-sourcemap",
        load(id) {
          const [filePath] = id.split("?");
          if (filePath.includes("@mediapipe/tasks-vision") && /\.(mjs|js)$/.test(filePath)) {
            try {
              const code = fs.readFileSync(filePath, "utf-8");
              return {
                code: code.replace(/\/\/# sourceMappingURL=.*/g, ""),
                map: null,
              };
            } catch (e) {
              return null;
            }
          }
          return null;
        },
      },
      // 仅在构建期挂 Nitro，产出 Cloudflare Worker 模块
      ...(command === "build"
        ? [
            nitro({
              preset: "cloudflare-module",
              output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
              cloudflare: { nodeCompat: true, deployConfig: true },
            }),
          ]
        : []),
    ],
  };
});
