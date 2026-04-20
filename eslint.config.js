// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const { allExtensions } = require('eslint-config-expo/flat/utils/extensions.js');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
    expoConfig,
    {
        ignores: ['dist/*'],
    },
    {
        settings: {
            'import/extensions': allExtensions,
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
                node: { extensions: allExtensions },
            },
        },
    },
    eslintConfigPrettier,
]);
