/**
 * clouds-base test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var assert = require('assert');
var util = require('util');
var os = require('os');
var path = require('path');
var async = require('async');
var utils = require('lei-utils');
var socket = require('clouds-socket');


var basePort = 7001;
var unixDomainPath = path.resolve(os.tmpDir(), 'clouds-socket-' + Date.now() + '-');
var isUseUnixDomain = (process.env.TEST_USE_UNIX_DOMAIN == 'true');


global.async = async;
global.assert = assert;

exports.utils = utils;

exports.createClient = function (options) {
  return socket.createClient(options);
};

exports.createServer = function (options) {
  return socket.createServer(options);
};

exports.getListenAddress = function () {
  if (isUseUnixDomain) {
    return {path: unixDomainPath + (basePort++)};
  } else {
    return {port: basePort++, host: '127.0.0.1'};
  }
};

exports.exit = function () {
  var args = Array.prototype.slice.call(arguments);
  var callback = args.pop();
  async.eachSeries(args, function (client, next) {
    client.exit(next);
  }, callback);
};

exports.wait = function (ms) {
  return function (next) {
    setTimeout(next, ms);
  };
};

exports.randomString = function (len) {
  var buf = new Buffer(len);
  for (var i = 0; i < len; i++) {
    var c = 96 + parseInt(Math.random() * 26, 10);
    buf[i] = c;
  }
  return buf.toString();
};

exports.randomWait = function (fn) {
  setTimeout(fn, parseInt(Math.random() * 200));
};

exports.dump = function () {
  console.log('--------------------------------------------------------------------------------');
  function inspect (obj, i) {
    var prefix = (i === false ? '' : i + ': ');
    var type = typeof obj;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      console.log(prefix + obj);
    } else {
      console.log(prefix + '\n' + util.inspect(obj, {
        color: true,
        depth: 10
      }));
    }
  }
  var list = Array.prototype.slice.call(arguments);
  if (list.length > 1) {
    list.forEach(inspect);
  } else {
    inspect(list[0], false);
  }
};

