import path from "path";
import js from '@eslint/js';
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

/** Build a globals object with readonly entries */
const makeGlobals = (names) => Object.fromEntries(names.map((n) => [n, "readonly"]));

const nodeGlobals = makeGlobals([
  "Buffer",
  "process",
  "global",
  "__dirname",
  "__filename",
  "module",
  "exports",
  "require",
  "console",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval"
]);

const browserGlobals = makeGlobals([
  "window",
  "document",
  "navigator",
  "fetch",
  "localStorage",
  "URL",
  "FormData",
  "alert",
  "sessionStorage"
]);

export default [
  js.configs.recommended,

  // All TypeScript/React files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        project: path.resolve("./tsconfig.json"),
        tsconfigRootDir: path.resolve("."),
        ecmaFeatures: { jsx: true }
      },
      globals: { ...nodeGlobals, ...browserGlobals }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...tsPlugin.configs['stylistic-type-checked'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,

      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

      "react/display-name": "off",
      "react/no-unescaped-entities": "warn",
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // Config files - no type-aware parsing
  {
    files: ["tailwind.config.ts", "postcss.config.mjs", "eslint.config.js", "next.config.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser,
      parserOptions: { project: false },
      globals: { ...nodeGlobals }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-explicit-any": "off",
    }
  }
];
