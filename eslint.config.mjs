import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
const config = [
	{
		ignores: [
			"node_modules/**",
			".next/**",
			".open-next/**",
			"out/**",
			"public/**",
			".wrangler/**",
			"dist/**",
			"cloudflare-env.d.ts",
		],
	},
	...nextCoreWebVitals,
	...nextTypescript,
	{
		files: ["**/*.{ts,tsx}"],
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/consistent-type-imports": "error",
		},
	},
	prettierConfig,
];

export default config;
