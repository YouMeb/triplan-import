'use strict';

var co = require('co');

co(require('./lib/import'))(function (err) {
  if (err) {
    process.exit(1);
  }
});
