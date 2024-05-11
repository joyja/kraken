import js from '@eslint/js'
import ts from 'typescript-eslint'
import globals from 'globals'
import svelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
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
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			'no-unused-vars': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ vars: 'all', args: 'after-used', ignoreRestSiblings: false }
			],
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			'no-unused-vars': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ vars: 'all', args: 'after-used', ignoreRestSiblings: false }
			],
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'package/', '**/generated/']
	}
]
