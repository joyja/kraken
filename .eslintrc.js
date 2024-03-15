module.exports = {
  "env": {
		"es2021": true,
		"node": true
  },
  "extends": [
		"standard-with-typescript",
		"prettier"
  ],
  "overrides": [
		{
			"env": {
					"node": true
			},
			"files": [
					".eslintrc.{js,cjs}"
			],
			"parserOptions": {
					"sourceType": "script"
			}
		}
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module",
  },
  "plugins": [
		"prettier"
  ],
  "rules": {
    "no-unused-vars": "warn",
		'@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: false }]
  }
}
