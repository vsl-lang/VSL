module.exports = {
  "extends": "eslint:recommended",
  "env": {
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": 8,
    "sourceVersion": "module"
  },
  "parser": "babel-eslint",
  "rules": {
    "no-console": [0],
    "no-unused-vars": [0],
    "no-undef": [0],
    "no-constant-condition": [1, { checkLoops: false }]
  }
};