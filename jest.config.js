// eslint-disable-next-line @typescript-eslint/no-var-requires

const isTest = process.NODE_ENV === "test";
// ts-jest is inferior to babel-jest but build time on a small project doesn't need much.
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	verbose: true,
	globals: {
		useESM: !isTest,
	},
	moduleDirectories: ["node_modules/"],
	preset: "ts-jest",
	transform: { "^.+\\.ts$": "ts-jest" },
	moduleFileExtensions: ["js", "ts", "svelte"],
	testEnvironment: "node",

	// A list of paths to modules that run some code to configure or
	// set up the testing framework before each test.
	// setupFilesAfterEnv: [
	// 	"<rootDir>/tests/CustomMatchers/jest.custom_matchers.setup.ts",
	// ],
	// globalSetup: "./tests/global-setup.js",
};
