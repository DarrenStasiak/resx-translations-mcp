import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow functions that return Promise<void> without awaiting at the call
      // site — common in MCP handlers.
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
      // Permit unused vars when prefixed with underscore.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Allow non-null assertions where they are genuinely safe.
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "eslint.config.mjs", "tests/"],
  },
);
