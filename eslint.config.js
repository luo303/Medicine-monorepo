import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import nextConfig from "eslint-config-next";

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
  ...nextConfig.map(config => ({
    ...config,
    files: ["apps/frontend/**/*.{ts,tsx,js,jsx}"],
    rules: {
      ...(config.rules || {}),
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-page-custom-font": "off"
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
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ["packages/**/*.{ts,js}", "*.{js,cjs,mjs}"],
    languageOptions: {
      ...(config.languageOptions || {}),
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...(config.rules || {}),
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  }))
);
