import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const ignores = ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/coverage/**", "**/*.d.ts"];

export default defineConfig(
  {
    ignores,
    languageOptions: {
      parserOptions: {
        project: false,
        projectService: false,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  // ===== 后端配置 (NestJS) =====
  {
    files: ["apps/backend/**/*.{ts,js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-case-declarations": "off"
    }
  },
  // ===== 前端配置 (Next.js) =====
  {
    files: ["apps/frontend/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        project: false,
        projectService: false,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-case-declarations": "off",
      "react-hooks/set-state-in-effect": "off"
    }
  },
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
      "no-undef": "off"
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
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
);
