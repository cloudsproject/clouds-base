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

  this._servicesTable = new ServiceTable();

  this._listen();
}

common.inheritsEventEmitter(Gate);

Gate._counter = 0;

Gate.prototype._listen = function () {
  var self = this;

  self._server = socket.createServer(self._options);

  self._server.on('connection', function (s) {
    var client = wrapSocket(s);
    self._debug('new connection: %s', client.id);

    client.on('exit', function () {
      self._servicesTable.unregisterAllByConnection(client);
      client.destroy();
      s = null;
      client = null;
    });

    // REGISTER_SERVICE
    client.handler.set(CMD.REGISTER_SERVICE, function (cmd, msgId, list) {
      if (list.length !== 1) {
        client.sendResult(msgId, [self._packCallArguments(new Error('bad call request format'))]);
        return;
      }
      var name = list[0].toString();
      self._servicesTable.register(name, client);
      client.sendResult(msgId, [self._packCallArguments(null, 'OK')]);
    });

    // UNREGISTER_SERVICE
    client.handler.set(CMD.UNREGISTER_SERVICE, function (cmd, msgId, list) {
      if (list.length !== 1) {
        client.sendResult(msgId, [self._packCallArguments(new Error('bad call request format'))]);
        return;
      }
      var name = list[0].toString();
      self._servicesTable.unregister(name, client);
      client.sendResult(msgId, [self._packCallArguments(null, 'OK')]);
    });

    // CALL_SERVICE
    client.handler.set(CMD.CALL_SERVICE, function (cmd, msgId, list) {
      if (list.length !== 2) {
        client.sendResult(msgId, [self._packCallArguments(new Error('bad call request format'))]);
        return;
      }
      var name = list[0].toString();
      var args = list[1];
      var worker = self._servicesTable.lookup(name);
      if (!worker) {
        client.sendResult(msgId, [self._packCallArguments(new Error('no available worker'))]);
        return;
      }
      worker.send(CMD.CALL_SERVICE, null, [name, args], function (msgId, list) {
        client.sendResult(msgId, list);
      });
    });
  });

};


Gate.create = function (options) {
  return new Gate(options);
};

//------------------------------------------------------------------------------

module.exports = Gate;