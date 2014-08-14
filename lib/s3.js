'use strict';

var thunkify = require('thunkify');
var awsConfig = require('../config').aws;
var AWS = require('aws-sdk');

var config = new AWS.Config(awsConfig);
var s3 = module.exports = new AWS.S3(config);

s3.putObject = thunkify(s3.putObject.bind(s3));
