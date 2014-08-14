'usr strict';

var noop = function () {};

module.exports = Wait;

function Wait() {
  if (!(this instanceof Wait)) {
    return new Wait();
  }
}

Wait.prototype.then = function (cb) {
  if (this.cb && !this.isDone) {
    this.done();
  }
  this.isDone = false;
  this.cb = cb;
};

Wait.prototype.done = function () {
  this.isDone = true;
  this.cb && this.cb();
};

Wait.prototype.catch = noop;
Wait.prototype.throw = noop;
