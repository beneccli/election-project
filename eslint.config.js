import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Site files: React/Next.js rules run via `next lint` inside site/.
    // At the root level we only apply base + TS rules, relaxed for JSX/React.
    files: ["site/**/*.ts", "site/**/*.tsx"],
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: [
      "node_modules/",
      "site/node_modules/",
      "site/.next/",
      "site/out/",
      "site/next-env.d.ts",
      "scripts/logs/",
      "*.js",
      "!eslint.config.js",
    ],
  },
);

