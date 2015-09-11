/**
 * clouds-base
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var common = require('./common');


//------------------------------------------------------------------------------
var define = {};

// UNKNOWN
define.UNKNOWN = 0;

// PING: new msgId
define.PING = 1;

// PONG: msgId
define.PONG = 2;

// RESULT: msgId, ...
define.RESULT = 3;

// REGISTER_SERVICE: new msgId, name
define.REGISTER_SERVICE = 4;

// UNREGISTER_SERVICE: new msgId, name
define.UNREGISTER_SERVICE = 5;

// CALL_SERVICE: new msgId, name, ...(args)
define.CALL_SERVICE = 6;

//------------------------------------------------------------------------------

function Handler (handlers) {
  this._handlers = common.merge(handlers || {});
}

Handler.prototype.set = function (cmd, fn) {
  this._handlers[cmd] = fn;
};

Handler.prototype.process = function (cmd, msgId, list) {
  var fn = this._handlers[cmd] || this._handlers[define.UNKNOWN];
  if (!fn) throw new Error('unhandle command type `' + cmd + '`');
  fn.call(null, cmd, msgId, list);
};

Handler.create = function (handlers) {
  return new Handler(handlers);
};

Handler.define = define;
module.exports = exports = Handler;
