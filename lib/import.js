'use strict';

var os = require('os');
var fs = require('fs');
var gm = require('gm');
var path = require('path');
var chalk = require('chalk');
var thunkify = require('thunkify');
var mkdirp = thunkify(require('mkdirp'));
var uid = require('uid2');
var logger = require('./logger');
var pkg = require('../package');
var s3 = require('./s3');
var config = require('../config');
var db = require('./db');

var dir = process.argv[2];
var readdir = thunkify(fs.readdir);
var stat = thunkify(fs.stat);

module.exports = function *() {
  if (dir) {
    dir = path.resolve(process.cwd(), dir);
  } else {
    dir = process.cwd();
  }

  var tmpdir = path.join(os.tmpdir(), String(process.pid));

  logger.log('%s %s\n'
    , chalk.cyan(pkg.name)
    , chalk.yellow(pkg.version));

  logger.log('目前位置: %s', chalk.grey(process.cwd()));
  logger.log('圖片目錄: %s', chalk.grey(dir));
  logger.log('暫存目錄: %s', chalk.grey(tmpdir));
  logger.log();

  logger.start('建立暫存目錄 %s ', tmpdir);
  yield logger.wait(mkdirp(tmpdir));

  logger.start('取得目錄清單');
  var dirs = yield logger.wait(getAllDirs(dir));

  logger.start('connect to rds');
  yield logger.wait(db.connect());

  try {
    logger.log();
    logger.log('開始匯入 %s 個子目錄', dirs.length);
    logger.log();
    yield startImport(dirs, tmpdir);
    logger.log();
  } catch (e) {}

  db.end();
};

function *getAllDirs(dir) {
  var results = [];
  var dirs = yield readdir(dir);  
  var sub;

  while (sub = dirs.shift()) {
    sub = path.join(dir, sub);
    let s = yield stat(sub);
    if (s.isDirectory()) {
      results.push(sub);
    }
  }

  return results;
}

function *startImport(dirs, tmpdir) {
  var dir;
  while (dir = dirs.shift()) {
    logger.start('匯入 %s ', path.basename(dir));
    yield logger.wait(importDir(dir, tmpdir));
  }
}

function *importDir(dir, tmpdir) {
  var dirname = path.basename(dir);
  var files = yield getImages(dir);
  var file, cover = false;

  while (file = files.shift()) {
    let name = uid(32);
    let key = 'import/' + groupName(name, 4).join('/');
    let normal = path.join(tmpdir, dirname + '-' + name + '830x510');
    let landmark = path.join(tmpdir, dirname + '-' + name + '200x200');
    let isCover = false;

    if (!cover) {
      isCover = true;
      cover = true;
    }

    yield [
      resizeImage(file, normal, 830, 510),
      resizeImage(file, landmark, 200, 200)
    ];

    normal = {
      ACL: 'public-read',
      Key: key + name + '830x510',
      Body: fs.createReadStream(normal),
      Bucket: config.s3.bucket
    };

    landmark = {
      ACL: 'public-read',
      Key: key + name + '200x200',
      Body: fs.createReadStream(landmark),
      Bucket: config.s3.bucket
    };

    yield [
      s3.putObject(normal),
      s3.putObject(landmark)
    ];

    normal = createQuery(normal.Key, dirname, isCover);

    yield db.query(normal);
  }
}

function *getImages(dir) {
  var results = [];
  var files = yield readdir(dir);
  var file;

  while (file = files.shift()) {
    if (/^\./.test(file)) {
      continue;
    }

    file = path.join(dir, file);
    let s = yield stat(file);
    if (s.isFile()) {
      results.push(file);
    }
  }

  return results;
}

function resizeImage(src, dist, width, height) {
  return function(cb) {
    gm(src)
      .resize(width, height)
      .noProfile()
      .write(dist, cb)
  };
}

function groupName(name, step) {
  var group = [];
  var len = name.length;
  var i;

  for (i = 0; i < len; i += step) {
    group.push(name.slice(i, i + step));
  }

  return group;
}

function createQuery(key, landmarkNo, isCover) {
  var url = ''
    + 'http://s3-' + config.aws.region + '.amazonaws.com'
    + '/' + config.s3.bucket
    + '/' + key;

  var type = isCover ? 'cover' : 'photo';

  var query = ''
    + 'INSERT INTO `landmark_medias` '
    + '(`landmark_id`, `src`, `type`) '
    + 'SELECT `landmarks`.`landmark_no`, "' + url + '", "' + type + '" '
    + 'FROM `landmarks`'
    + 'WHERE `landmarks`.`landmark_no` = "' + landmarkNo + '";';

  return query;
}
