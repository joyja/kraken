import js from '@eslint/js'
import ts from 'typescript-eslint'
import globals from 'globals'
import svelte from 'eslint-plugin-svelte'
import prettier from 'eslint-plugin-prettier/recommended'

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'package/'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { vars: 'all', args: 'after-used', ignoreRestSiblings: false },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'package/', '**/generated/'],
  },
]

// {

// 	"env": {
// 		"es2021": true,
// 		"node": true
//   },
//   "extends": [
// 		"standard-with-typescript",
// 		"prettier"
//   ],
//   "overrides": [
// 		{
// 			"env": {
// 					"node": true
// 			},
// 			"files": [
// 					".eslintrc.{js,cjs}"
// 			],
// 			"parserOptions": {
// 					"sourceType": "script"
// 			}
// 		}
//   ],
//   "parser": "@typescript-eslint/parser",
//   "parserOptions": {
// 		"ecmaVersion": "latest",
// 		"sourceType": "module",
//   },
//   "plugins": [
// 		"prettier",
// 		"svelte"
//   ],
//   "rules": {
//     "no-unused-vars": "warn",
// 		'@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: false }]
//   },
// 	"ignores": [
// 		".eslintrc.js",
// 		".DS_Store",
// 		"node_modules",
// 		"/build",
// 		"/.svelte-kit",
// 		"/package",
// 		".env",
// 		".env.*",
// 		"!.env.example",
// 		"pnpm-lock.yaml",
// 		"package-lock.json",
// 		"yarn.lock",
// 	]
// }
