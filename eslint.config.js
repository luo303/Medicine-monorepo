import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const ignores = ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/coverage/**", "**/*.d.ts", "apps/**"];

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
  {
    files: ["*.{js,cjs,mjs}", "packages/shared/**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node
      },
      parserOptions: {
        project: false,
        projectService: false,
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
);
