import path from "path";
import js from '@eslint/js'; // For base ESLint recommended rules
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin"; // Import the TypeScript plugin
import reactPlugin from "eslint-plugin-react"; // Import the React plugin
import reactHooksPlugin from "eslint-plugin-react-hooks"; // Import the React Hooks plugin
import reactRefreshPlugin from "eslint-plugin-react-refresh"; // Import the React Refresh plugin

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
  // Apply base ESLint recommended rules for all JS/TS files
  js.configs.recommended,

  // Generic files (both node + browser globals available) - this is a fallback, specific overrides will take precedence
  {
    files: ["**/*.{js,cjs,mjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...nodeGlobals, ...browserGlobals }
    }
  },

  // TypeScript React source (type-aware). Keep project for src only.
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        project: path.resolve("./tsconfig.json"), // Assuming tsconfig.json is at root for src files
        tsconfigRootDir: path.resolve("."), // Correct way to get root dir in ESM for path.resolve
        ecmaFeatures: { jsx: true }
      },
      globals: { ...browserGlobals } // front-end code primarily browser
    },
    plugins: { // Explicitly define plugins here
      "@typescript-eslint": tsPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-refresh": reactRefreshPlugin // Include if react-refresh rules are used
    },
    rules: {
      // Merge recommended type-checked rules from @typescript-eslint
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...tsPlugin.configs['stylistic-type-checked'].rules,
      // Merge recommended rules from react plugin
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules, // For new JSX transform
      // Merge recommended rules from react-hooks plugin
      ...reactHooksPlugin.configs.recommended.rules,

      // Relax some strict TS rules temporarily (change to "error" later)
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/no-explicit-any": "off", // Keep this from previous config
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Keep this from previous config

      // React rules less strict for now
      "react/display-name": "off",
      "react/no-unescaped-entities": "warn",
      "react/react-in-jsx-scope": "off", // Not needed for React 17+ with new JSX transform
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }], // If react-refresh is used
    },
    settings: {
      react: { version: 'detect' }, // Detect React version automatically
    },
  },

  // Server / Node JS files (plain JavaScript)
  {
    files: ["server/**/*.js", "server.js"], // Target only JS files in server
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      // No parser specified, ESLint's default JS parser will be used
      globals: { ...nodeGlobals } // Node globals only
    },
    // No @typescript-eslint plugin or rules here
    rules: {
      "no-undef": "off", // Allow common Node globals
      "no-console": "off", // Allow console in server files
      // Ensure no React or TS-specific rules are applied to plain JS
      'react/react-in-jsx-scope': 'off', // Explicitly off if inherited
      'react/prop-types': 'off', // Explicitly off if inherited
    }
  },

  // Server / Node TS files (TypeScript, but without type information from a project)
  {
    files: ["server/**/*.ts"], // Target only TS files in server
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        project: false, // Explicitly disable project for server TS files if no server tsconfig
      },
      globals: { ...nodeGlobals }
    },
    plugins: {
      "@typescript-eslint": tsPlugin, // Include TS plugin for server TS files
    },
    rules: {
      // Disable all type-aware rules for server TS files if project: false
      // These rules require type information which is not available without a configured project
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-explicit-any": "off", // Allow any in server TS if not type-checked
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Keep warn for unused vars

      "no-undef": "off", // Allow common Node globals
      "no-console": "off", // Allow console in server files
      'react/react-in-jsx-scope': 'off', // Turn off React rules
      'react/prop-types': 'off', // Turn off React rules
      '@typescript-eslint/no-var-requires': 'off', // Allow require in Node.js files if needed
    }
  },

  // Config files that should NOT use parserOptions.project (avoid TS "file not found" errors)
  {
    files: ["vite.config.ts", "tailwind.config.ts", "postcss.config.cjs", "eslint.config.js", ".eslintrc.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser, // Still use TS parser for these files if they are TS
      parserOptions: { project: false }, // Disable type-aware parsing
      globals: { ...nodeGlobals } // Config files are typically Node.js environment
    },
    plugins: {
      "@typescript-eslint": tsPlugin, // Include TS plugin for config TS files
    },
    rules: {
      // Also disable type-aware rules for config files if project: false
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-var-requires": "off", // Allow require in CJS config files
    }
  }
];