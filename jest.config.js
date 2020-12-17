module.exports = {
	transform: {
		"^.+\\.[t|j]sx?$": ['babel-jest', { configFile: './babel.config.jest.js' }]
	},
	moduleDirectories: [
		'node_modules',
		// add the directory with the test-utils.js file:
		'test/utils' // a utility folder
	],
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx'],
	// coverageDirectory: 'test/coverage',
	coverageReporters: ['text'],
	reporters: ['default', 'jest-junit'],
	// testMatch: ['/test/**/*.js?(x)'],
	setupFilesAfterEnv: [
		"<rootDir>/src/jest-env-setup.js"
	],
	setupFiles: [
		"<rootDir>/src/jest-polyfills.js"
	]
};
