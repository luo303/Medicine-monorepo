import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const ignores = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.next/**",
  "**/out/**",
  "**/coverage/**",
  "**/*.d.ts",
  "**/*.config.*"
];

export default defineConfig(
  {
    ignores
  },
  eslintConfigPrettier,
  // ===== 后端配置 (NestJS) =====
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ["apps/backend/**/*.{ts,js}"],
    languageOptions: {
      ...(config.languageOptions || {}),
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      ...(config.rules || {}),
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  })),
  // ===== 前端配置 (Next.js) =====
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ["apps/frontend/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ...(config.languageOptions || {}),
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      ...(config.rules || {}),
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  })),
  // ===== Worker 文件配置 =====
  {
    files: ["apps/frontend/public/workers/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.worker
      }
    },
    rules: {
      "no-var": "off"
    }
  },
  // ===== 共享包/工具配置 =====
  {
    files: ["packages/**/*.{ts,js}", "*.{js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node
      }
    }
  }
);
