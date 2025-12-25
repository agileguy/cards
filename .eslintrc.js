module.exports = {
    env: {
          node: true,
          es2021: true,
          jest: true,
    },
    extends: [
          'eslint:recommended',
          'plugin:@typescript-eslint/recommended',
          'plugin:jest/recommended',
          'prettier',
        ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint', 'jest'],
    rules: {
          'no-unused-vars': 'off',
          '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
          'no-console': 'warn',
          'prefer-const': 'error',
          'eqeqeq': ['error', 'always'],
          'curly': ['error', 'all'],
          '@typescript-eslint/explicit-function-return-type': 'off',
          '@typescript-eslint/no-explicit-any': 'warn',
    },
};
