/**
 * clouds-base
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var common = require('./common');
var debug = common.debug('socket');
var CMD = require('./cmd').define;
var createHandler = require('./cmd').create;

//------------------------------------------------------------------------------

function WrapSocket (socket) {
  var self = this;
  self.origin = socket;
  self.handler = createHandler();
  self._msgId = 0;
  self._msgCallbacks = {};
  self.id = common.uniqueId();
  self._debug = common.debug('socket:#' + self.id);

  socket.on('data', function (data) {
    var ret = common.unpack(data);
    var cmd = ret[0];
    var msgId = ret[1];
    var list = ret.slice(2);
    self.handler.process(cmd, msgId, list);
  });

  self.handler.set(CMD.RESULT, function (cmd, msgId, list) {
    var info = self._msgCallbacks[msgId];
    if (!info) {
      self._debug('unhandle result callback: msgId=%s', msgId);
      return;
    }
    delete self._msgCallbacks[msgId];
    info.fn(msgId, list);
  });
}

common.inheritsEventEmitter(WrapSocket);

WrapSocket.prototype.msgId = function () {
  return ++this._msgId;
}

WrapSocket.prototype.sendPing = function (callback) {
  this.send(CMD.PING, null, callback);
};

WrapSocket.prototype.sendPong = function (msgId) {
  this.send(CMD.PONG, msgId);
};

WrapSocket.prototype.send = function (cmd, msgId, list, callback) {
  msgId = msgId || this.msgId();
  list = list || [];
  if (callback) this._msgCallbacks[msgId] = {
    t: Date.now(),
    fn: callback
  };
  var buf = common.pack(cmd, msgId, list);
  this.origin.send(buf);
};

WrapSocket.prototype.sendResult = function (msgId, list) {
  this.send(CMD.RESULT, msgId, list);
};

WrapSocket.prototype.destroy = function () {
  delete this.origin;
  delete this.handler;
  delete this._msgId;
  delete this._msgCallbacks;
  delete this.address;
};


WrapSocket.create = function (socket, handler) {
  return new WrapSocket(socket, handler);
};

//------------------------------------------------------------------------------

module.exports = WrapSocket;
