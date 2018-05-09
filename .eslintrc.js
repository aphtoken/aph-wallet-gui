module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'airbnb-base',
  globals: {
    __static: true,
    _: true,
    accounting: true,
    axios: true,
    moment: true
  },
  plugins: [
    'html'
  ],
  'rules': {
    'array-callback-return': 0,
    'arrow-body-style': 0,
    'global-require': 0,
    'import/extensions': 0,
    'import/first': 0,
    'import/newline-after-import': 0,
    'import/no-extraneous-dependencies': 0,
    'import/no-unresolved': 0,
    'import/prefer-default-export': 0,
    'max-len': [2, 120],
    'no-console': 0,
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0, // allow debugger during development
    'no-multi-assign': 0,
    'no-param-reassign': 0,
    'no-shadow': 0,
    'no-underscore-dangle': 0,
    'sort-imports': ['error'],
    'sort-keys': ['error', 'asc', {'caseSensitive': true, 'natural': false}],
    'sort-vars': ['error'],
  }
}
