'use strict';

var co = require('co');
var util = require('util');
var chalk = require('chalk');
var spin = require('./spin');
var pad = require('./pad');
var timeout = require('./timeout');

var slice = Array.prototype.slice;
var isDone, error;
var indent = 4;
var errorCounter = 0;
var successCounter = 0;

exports.start = function () {
  var args = arguments;

  co(function *() {
    var s = spin('⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏');
    var msg = util.format.apply(null, args);

    isDone = false;
    error = null;

    while (!isDone) {
      process.stdout.write(''
        + '\r' + chalk.cyan(pad(indent, s.next().value))
        + ' ' + chalk.grey(msg));

      yield timeout(100);
    }

    if (error) {
      process.stdout.write(''
          + '\r' + chalk.red(pad(indent, '✗'))
          + ' ' + chalk.grey(msg) + '\n\n');

      error.stack.split('\n').forEach(function (line) {
        process.stdout.write(pad(indent + 1) + chalk.grey(line) + '\n');
      });

      process.stdout.write('\n');
    } else {
      process.stdout.write(''
        + '\r' + chalk.green(pad(indent, '✓'))
        + ' ' + chalk.grey(msg) + '\n');
    }
  })();
};

exports.success = function () {
  isDone = true;
  successCounter++;
};

exports.error = function (err) {
  isDone = true;
  error = err;
  errorCounter++;
};

exports.log = function () {
  var msg = util.format.apply(null, arguments) + '\n';
  process.stdout.write(pad(indent + 1) + msg);
};

exports.wait = function *(gen) {
  var result;

  try {
    result = yield gen;
  } catch (e) {
    this.error(e);
    yield timeout(101);
    throw e;
  }

  this.success();
  yield timeout(101);

  return result;
};

exports.report = function () {
  return {
    success: successCounter,
    error: errorCounter
  };
};
