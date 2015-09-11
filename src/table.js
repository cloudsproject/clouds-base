/**
 * clouds-base
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var common = require('./common');


function ServiceTable () {
  this._services = {};
  this._counters = {};
}

ServiceTable.prototype.register = function (name, connection) {
  if (!this._services[name]) this._services[name] = [];
  var i = this._services[name].indexOf(connection);
  if (i === -1) this._services[name].push(connection);
};

ServiceTable.prototype.unregister = function (name, connection) {
  if (!this._services[name]) this._services[name] = [];
  var i = this._services[name].indexOf(connection);
  if (i !== -1) this._services[name].splice(i, 1);
};

ServiceTable.prototype.unregisterAllByConnection = function (connection) {
  for (var n in this._services) {
    var i = this._services[n].indexOf(connection);
    if (i !== -1) this._services[n].splice(i, 1);
  }
};

ServiceTable.prototype.lookup = function (name) {
  var list = this._services[name];
  if (!list) return false;
  if (this._counters[name] > 0) {
    this._counters[name]++;
  } else {
    this._counters[name] = 0;
  }
  var i = this._counters[name] % this._services[name].length;
  return this._services[name][i];
};

module.exports = ServiceTable;
