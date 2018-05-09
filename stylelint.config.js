module.exports = {
  extends: 'stylelint-config-sass-guidelines',
  plugins: ['stylelint-scss'],
  processors: ['stylelint-processor-html'],
  rules: {
    'selector-max-id': false,
    'at-rule-no-unknown': false,
    'font-family-no-missing-generic-family-keyword': false,
    'function-name-case': [
      true,
      {
        ignoreAtRules: ['toRem'],
      },
    ],
    'max-nesting-depth': 15,
    'selector-max-compound-selectors': 15,
    'scss/selector-no-redundant-nesting-selector': false,
  },
};
