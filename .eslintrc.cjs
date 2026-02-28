module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended' // Add prettier to extends
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'postcss.config.js', 'tailwind.config.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh', 'react', 'prettier'], // Add prettier to plugins
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    'quotes': ['error', 'single', { 'avoidEscape': true }], // Prefer single quotes, allow escaping
    'semi': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'comma-dangle': ['error', 'always-multiline'],
    'react/react-in-jsx-scope': 'off', // Not needed for React 17+ with new JSX transform
    'react/prop-types': 'off', // Disable prop-types for TypeScript projects
    'prettier/prettier': ['error', { singleQuote: true, semi: true }] // Enforce prettier rules
  },
};