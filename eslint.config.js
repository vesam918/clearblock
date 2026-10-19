export default [
  {
    ignores: ["dist/**", "release/**", "legacy-adblock-6.49.0/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.js", "scripts/**/*.mjs", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        chrome: "readonly",
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        URL: "readonly",
        Blob: "readonly",
        FileReader: "readonly",
        HTMLElement: "readonly",
        customElements: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        Map: "readonly",
        WebSocket: "readonly",
        fetch: "readonly",
        process: "readonly"
      },
    },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-undef": "error",
      "prefer-const": "error"
    }
  }
];
