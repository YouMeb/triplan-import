'use strict';

var mysql = require('mysql');
var thunkify = require('thunkify');
var config = require('../config');

var conn = module.exports = mysql.createConnection(config.mysql);
var oldQuery = conn.query.bind(conn);

conn.query = function (query) {
  return function (cb) {
    oldQuery(query, function (err, rows, fields) {
      if (err) {
        return cb(err);
      }
      cb(null, {
        rows: rows,
        fields: fields
      });
    });
  };
};

conn.connect = thunkify(conn.connect.bind(conn));
