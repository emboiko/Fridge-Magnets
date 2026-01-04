// ESLint flat config (ESLint 9+) for npm run lint
// Note: .eslintrc.json exists for Next.js compatibility, but this flat config is the primary linting configuration
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
          varsIgnorePattern: "^(_|[A-Z])",
        },
      ],
      "no-console": "off",
    },
  },
]
