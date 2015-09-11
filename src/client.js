/**
 * clouds-base
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var assert = require('assert');
var socket = require('clouds-socket');
var common = require('./common');
var CMD = require('./cmd').define;
var wrapSocket = require('./socket').create;
var debug = common.debug('client');

//------------------------------------------------------------------------------

/**
 * create client
 * @param  {Object} options
 *   - {String} host
 *   - {Number} port
 *   - {String} path
 * @return {Socket}
 */

function Client (options) {
  var self = this;
  self._options = common.merge(options);
  self._packCallArguments = options.packCallArguments || common.packCallArguments;
  self._unpackCallArguments = options.unpackCallArguments || common.unpackCallArguments;

  Client._counter++;
  self._debug = common.debug('client:#' + Client._counter);

  self._services = {};

  //----------------------------------------------------------------------------
  self._socket = wrapSocket(socket.createClient(self._options));

  //-------------------------
  self._socket.origin.on('connect', function () {
    self.emit('connect');
  });
  self._socket.origin.on('error', function (err) {
    self.emit('error', err);
  });
  self._socket.origin.on('exit', function () {
    self.emit('exit');
  });

  //-------------------------
  self._socket.handler.set(CMD.UNKNOWN, function (cmd, msgId, list) {
    console.error('UNKNOWN Message: cmd=%s, msgId=%s, list=%s', cmd, msgId, list);
  });

  self._socket.handler.set(CMD.PING, function (cmd, msgId, list) {
    self._socket.sendPong(msgId);
  });

  self._socket.handler.set(CMD.CALL_SERVICE, function (cmd, msgId, list) {
    if (list.length !== 2) {
      self._socket.sendResult(msgId, [self._packCallArguments(new Error('bad call request format'))]);
      return;
    }
    var name = list[0].toString();
    var args = self._unpackCallArguments(list[1]);
    var fn = self._services[name];
    if (!fn) {
      self._socket.sendResult(msgId, [self._packCallArguments(new Error('no available service'))]);
      return;
    }
    args.push(function () {
      var args = Array.prototype.slice.call(arguments);
      var data = self._packCallArguments.apply(null, args);
      self._socket.sendResult(msgId, [data]);
    });
    try {
      fn.apply(null, args);
    } catch (err) {
      args[args.length - 1](err);
    }
  });
}

common.inheritsEventEmitter(Client);

Client._counter = 0;

Client.prototype.register = function (name, fn, callback) {
  var self = this;
  self._debug('register: name=%s', name);
  self._services[name] = fn;
  var cb = callback ? function (msgId, list) {
    var args = self._unpackCallArguments(list[0]);
    callback.apply(null, args);
  } : null;
  self._socket.send(CMD.REGISTER_SERVICE, null, [name], cb);
};

Client.prototype.unregister = function (name, callback) {
  var self = this;
  self._debug('unregister: name=%s', name);
  var cb = callback ? function (msgId, list) {
    var args = self._unpackCallArguments(list[0]);
    callback.apply(null, args);
  } : null;
  self._socket.send(CMD.REGISTER_SERVICE, null, [name], cb);
};

Client.prototype.call = function (name, args, callback) {
  var self = this;
  self._debug('call: name=%s, args=%s', name, args);
  var cb = callback ? function (msgId, list) {
    var args = self._unpackCallArguments(list[0]);
    callback.apply(null, args);
  } : null;
  var data = self._packCallArguments.apply(null, args);
  self._socket.send(CMD.CALL_SERVICE, null, [name, data], cb);
};


Client.create = function (options) {
  return new Client(options);
};

//------------------------------------------------------------------------------

module.exports = Client;
