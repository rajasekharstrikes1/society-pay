import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json", "./tsconfig.dev.json"],
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "quotes": ["error", "double"],
      "import/no-unresolved": "off",
      "indent": ["error", 2],
      "@typescript-eslint/no-non-null-assertion": "off"
    },
  },
  {
    ignores: ["lib/**/*", "generated/**/*"],
  },
];
