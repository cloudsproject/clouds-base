/**
 * clouds-base
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var Table = require('./src/table');
exports.Table = Table;
exports.createTable = Table.create;

var Gate = require('./src/gate');
exports.Gate = Gate;
exports.createGate = Gate.create;

var Client = require('./src/client');
exports.Client = Client;
exports.createClient = Client.create;
