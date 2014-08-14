'use strict';

module.exports = function (n, str) {
  str || (str = '');
  n -= str.length;

  if (n <= 0) {
    return str;
  }

  return ' '.repeat(n) + str;
};
