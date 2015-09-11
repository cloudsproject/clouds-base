/**
 * clouds-base
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var os = require('os');
var createDebug = require('debug');
var common = module.exports = exports = require('lei-utils').extend(exports);


exports.debug = function (name) {
  return createDebug('clouds:base:' + name);
};

var debug = exports.debug('common');


exports.default = {};


exports.callback = function (fn) {
  if (fn) return fn;
  return function (err) {
    debug('unhandle callback: error=%s, results=%j', err, arguments);
  };
};

exports.packBuffer = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    buf = new Buffer(buf.toString());
  }
  var len = buf.length;
  var newBuf = new Buffer(len + 4);
  newBuf.writeUInt32BE(len, 0);
  buf.copy(newBuf, 4);
  return newBuf;
};

exports.unpackBuffer = function (buf) {
  var len = buf.readUInt32BE(0);
  return {
    length: len,
    buffer: buf.slice(4, len + 4),
    restBuffer: buf.slice(len + 4)
  };
};

exports.packDataList = function (list) {
  list = list.map(exports.packBuffer);
  return Buffer.concat(list);
};

exports.unpackDataList = function (buf) {
  var list = [];
  do {
    var ret = exports.unpackBuffer(buf);
    list.push(ret.buffer);
    buf = ret.restBuffer;
  } while (buf.length > 0);
  return list;
};

/**
 * 打包消息
 * @param {Number} cmd 指令
 * @param {Number} msgId 消息ID
 * @param {Array} list 消息内容
 * @return {Buffer}
 */
exports.pack = function (cmd, msgId, list) {
  var buf = exports.packDataList(list);
  var newBuf = new Buffer(buf.length + 6);
  newBuf.writeUInt16BE(cmd, 0);
  newBuf.writeUInt32BE(msgId, 2);
  buf.copy(newBuf, 6);
  return newBuf;
};

exports.unpack = function (buf) {
  var cmd = buf.readUInt16BE(0);
  var msgId = buf.readUInt32BE(2);
  var newBuf = buf.slice(6);
  var list = exports.unpackDataList(newBuf);
  return [cmd, msgId].concat(list);
};

/**
 * 取唯一标识符
 *
 * @return {String}
 */
exports.uniqueId = function (type) {
  return [UID_PREFIX, process.pid, exports.uniqueId.counter++].join('.');
};

exports.uniqueId.counter = 0;

// client ID 前缀
var UID_PREFIX = common.md5(os.hostname()).substr(0, 8);

/**
 * 默认打包调用结果
 *
 * @return {String}
 */
exports.packCallArguments = function () {
  var args = Array.prototype.slice.call(arguments);
  args = args.map(function (item) {
    if (item instanceof Error) {
      var err = common.merge(item);
      err.message = item.message;
      return err;
    } else {
      return item;
    }
  });
  return JSON.stringify(args);
};

/**
 * 默认解包调用结果
 *
 * @param {String|Buffer} data
 * @return {Array}
 */
exports.unpackCallArguments = function (data) {
  data = data && data.toString();
  if (!data) return [null];
  try {
    var list = JSON.parse(data);
  } catch (err) {
    err.code = 'UNPACK_ARGUMENTS_ERROR';
    err.source = data;
    return [err];
  }
  return list;
};
