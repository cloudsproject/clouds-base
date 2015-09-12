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
var ServiceTable = require('./table');
var debug = common.debug('gate');

//------------------------------------------------------------------------------

/**
 * create gate
 * @param  {Object} options
 *   - {String} host
 *   - {Number} port
 * @return {Socket}
 */

function Gate (options) {
  this._options = common.merge(options);
  this._packCallArguments = options.packCallArguments || common.packCallArguments;
  this._unpackCallArguments = options.unpackCallArguments || common.unpackCallArguments;

  Gate._counter++;
  this._debug = common.debug('gate:#' + Gate._counter);
  this._exited = false;

  this._servicesTable = new ServiceTable();

  this._listen();
}

common.inheritsEventEmitter(Gate);

Gate._counter = 0;

Gate.prototype._listen = function () {
  var self = this;

  self._server = socket.createServer(self._options);

  self._server.on('exit', function () {
    self.emit('exit');
  });
  self._server.on('error', function (err) {
    self.emit('err', err);
  });

  self._server.on('connection', function (s) {
    var client = wrapSocket(s);
    self._debug('new connection: %s', client.id);

    client.origin.on('exit', function () {
      self._servicesTable.unregisterAllByConnection(client);
      client.destroy();
      s = null;
      client = null;
    });

    // REGISTER_SERVICE
    client.handler.set(CMD.REGISTER_SERVICE, function (cmd, msgId, list) {
      if (list.length !== 1) {
        client.sendResult(msgId, [self._packCallArguments(common.invalidCommandArgumentLengthError(1))]);
        return;
      }
      var name = list[0].toString();
      self._servicesTable.register(name, client);
      client.sendResult(msgId, [self._packCallArguments(null, 'OK')]);
    });

    // UNREGISTER_SERVICE
    client.handler.set(CMD.UNREGISTER_SERVICE, function (cmd, msgId, list) {
      if (list.length !== 1) {
        client.sendResult(msgId, [self._packCallArguments(common.invalidCommandArgumentLengthError(1))]);
        return;
      }
      var name = list[0].toString();
      self._servicesTable.unregister(name, client);
      client.sendResult(msgId, [self._packCallArguments(null, 'OK')]);
    });

    // CALL_SERVICE
    client.handler.set(CMD.CALL_SERVICE, function (cmd, msgId, list) {
      if (list.length !== 2) {
        client.sendResult(msgId, [self._packCallArguments(common.invalidCommandArgumentLengthError(2))]);
        return;
      }
      var name = list[0].toString();
      var args = list[1];
      var worker = self._servicesTable.lookup(name);
      if (!worker) {
        client.sendResult(msgId, [self._packCallArguments(common.noAvailableWorkerError(name))]);
        return;
      }
      worker.send(CMD.CALL_SERVICE, null, [name, args], function (_, list) {
        client.sendResult(msgId, list);
      });
    });
  });

};

Gate.prototype.exit = function (callback) {
  var self = this;
  if (self._exited) return callback && callback();
  self.once('exit', function () {
    delete self._servicesTable;
    delete self._server;
    delete self._packCallArguments;
    delete self._unpackCallArguments;
    delete self._options;
    delete self._debug;
    self._exited = true;
  });
  self.once('exit', callback);
  self._server.exit();
  self._server.exit();
};


Gate.create = function (options) {
  return new Gate(options);
};

//------------------------------------------------------------------------------

module.exports = Gate;
