#!/usr/bin/env node

const _ = require('lodash');
const fs = require('fs');
const langs = [
  'de',
  'cn',
  'jp',
  'ko',
  'nl',
  'ru',
];
const argv = require('minimist')(process.argv.slice(2));
const enData = require('../src/renderer/l10n/en');
const enKeys = Object.keys(enData).sort();

if (argv.todo) {
  todo();
} else if (argv.merge) {
  merge();
} else {
  console.log('Please run with either --todo or --merge');
  process.exit(1);
}


function todo(){
  langs.map(lang => {
    console.log(`---------------\nComparing language: ${lang}`);
    const path = require('path');
    const filePath = path.resolve('.', 'src', 'renderer', 'l10n', lang)
    const data = require(filePath);
    const keys = Object.keys(data).sort();
    const newKeys = _.differenceWith(enKeys, keys, _.isEqual);
    const newData = {};

    console.log(`${newKeys.length} new keys found.`);

    newKeys.map(key => {
      newData[key] = enData[key];
    });

    // console.log(JSON.stringify(newData, null, 2));

    const newFilePath = path.resolve('.', 'src', 'renderer', 'l10n', `todo-${lang}.json`);
    fs.writeFileSync(newFilePath, JSON.stringify(newData, null, 2), { encoding: 'utf8' });
  });
}

function merge(){
  langs.map(lang => {
    console.log(`---------------\nMerging language: ${lang}`);
    const path = require('path');
    const filePath = path.resolve('.', 'src', 'renderer', 'l10n', lang)
    const fileTodoPath = path.resolve('.', 'src', 'renderer', 'l10n', `todo-${lang}.json`);
    const data = require(filePath);
    const todoData = require(fileTodoPath);
    const todoKeys = Object.keys(todoData).sort();
    const newData = {};

    todoKeys.map(key => {
      data[key] = todoData[key];
    });

    const sortedAllKeys = Object.keys(data).sort();

    sortedAllKeys.map(key => {
      newData[key] = data[key];
    });

    const newFilePath = path.resolve('.', 'src', 'renderer', 'l10n', `${lang}.json`);
    fs.writeFileSync(newFilePath, JSON.stringify(newData, null, 2), { encoding: 'utf8' });
  });
}
