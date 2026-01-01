// ESLint flat config (ESLint 9+) for npm run lint
// Note: We also have .eslintrc.json for Next.js compatibility (though next lint is currently broken)
// This flat config is the primary linting configuration used by npm run lint
import babelParser from "@babel/eslint-parser"

export default [
  {
    ignores: ["node_modules/**", ".next/**", "out/**"],
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        React: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          // Allow unused vars that start with uppercase (React components) or underscore
          varsIgnorePattern: "^(_|[A-Z])",
        },
      ],
      "no-console": "off",
    },
  },
]
