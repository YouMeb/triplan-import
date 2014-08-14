'use strict';

module.exports = function (t) {
  return function (cb) {
    setTimeout(cb, t);
  };
};
