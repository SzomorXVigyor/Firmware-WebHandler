const js = require("@eslint/js");

module.exports = [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "commonjs",
			globals: {
				// Node.js globals
				global: "readonly",
				process: "readonly",
				Buffer: "readonly",
				__dirname: "readonly",
				__filename: "readonly",
				exports: "writable",
				module: "writable",
				require: "readonly",
				console: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
				setImmediate: "readonly",
				clearImmediate: "readonly",
			},
		},
		rules: {
			// Basic rules
			camelcase: [
				"error",
				{
					properties: "never",
				},
			],
			eqeqeq: "error",
			"max-depth": "error",
			"no-alert": "error",
			"no-array-constructor": "error",
			"no-console": [
				"error",
				{
					allow: ["warn", "error", "log"],
				},
			],
			"no-eval": "error",
			"no-implicit-coercion": "error",
			"no-lonely-if": "error",
			"no-nested-ternary": "error",
			"no-negated-condition": "error",
			"no-unneeded-ternary": "error",
			"no-undef-init": "error",
			"no-underscore-dangle": "error",
			"no-useless-concat": "error",
			"no-void": "error",
			"no-var": "error",
			"prefer-const": "error",
			"prefer-promise-reject-errors": "error",
			"prefer-template": "error",
			yoda: "error",
			"no-unused-vars": "off",
		},
		ignores: [
			// Dependencies
			"node_modules/",

			// Build outputs
			"dist/",
			"build/",
			"coverage/",

			// Data and uploads
			"data/",
			"uploads/",

			// Logs
			"*.log",
			"logs/",

			// Runtime files
			"*.pid",
			"*.seed",
			"*.pid.lock",

			// IDE files
			".vscode/",
			".idea/",

			// OS files
			".DS_Store",
			"Thumbs.db",

			// Git
			".git/",

			// Package managers
			".yarn/",
			".pnp.*",

			// Environment files
			".env",
			".env.local",
			".env.*.local",

			// Temporary files
			"tmp/",
			"temp/",

			// Documentation
			"docs/",

			// Configuration files that might have different formatting
			"*.min.js",
			"*.bundle.js",

			// Legacy or third-party code
			"vendor/",
			"lib/third-party/",
		],
	},
    // Public (frontend) browser files
    {
		files: ["public/**/*.js"],
		languageOptions: {
			globals: {
				window: "readonly",
				document: "readonly",
				localStorage: "readonly",
				navigator: "readonly",
				alert: "readonly",
				confirm: "readonly",
				prompt: "readonly",
				console: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
				requestAnimationFrame: "readonly",
				cancelAnimationFrame: "readonly",
                bootstrap: "readonly",
                fetch: "readonly",
                FormData: "readonly",
			},
		},
	},
	// Test files configuration
	{
		files: ["*.test.js", "*.spec.js", "test/**/*.js", "tests/**/*.js"],
		languageOptions: {
			globals: {
				// Test framework globals
				describe: "readonly",
				it: "readonly",
				before: "readonly",
				after: "readonly",
				beforeEach: "readonly",
				afterEach: "readonly",
				expect: "readonly",
				jest: "readonly",
				test: "readonly",
			},
		},
	},
];
