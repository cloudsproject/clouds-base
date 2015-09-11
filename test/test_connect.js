/**
 * clouds-base test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var support = require('./support');
var base = require('../');


describe('clouds-base', function () {

  it('normal register & call', function (done) {
    var address = support.getListenAddress();
    var gate = base.createGate(address);
    var c1 = base.createClient(address);
    var c2 = base.createClient(address);

    c1.register('hello', function (msg, callback) {
      support.randomWait(function () {
        callback(null, 'hello, ' + msg);
      });
    });

    c1.register('add', function (a, b, callback) {
      support.randomWait(function () {
        callback(null, Number(a) + Number(b));
      });
    });

    c1.register('test', function (a, b, callback) {
      support.randomWait(function () {
        callback(null, a, b);
      });
    });

    async.series([
      function (next) {
        c2.call('hello', ['world'], function (err, ret) {
          support.dump(arguments);
          assert.equal(err, null);
          assert.equal(ret, 'hello, world');
          next();
        });
      },
      function (next) {
        c2.call('hello', ['xxxx'], function (err, ret) {
          support.dump(arguments);
          assert.equal(err, null);
          assert.equal(ret, 'hello, xxxx');
          next();
        });
      },
      function (next) {
        c2.call('add', [1, 2], function (err, ret) {
          support.dump(arguments);
          assert.equal(err, null);
          assert.equal(ret, 3);
          next();
        });
      },
      function (next) {
        c2.call('add', [3.2, 4.3], function (err, ret) {
          support.dump(arguments);
          assert.equal(err, null);
          assert.equal(ret, 7.5);
          next();
        });
      },
      function (next) {
        c2.call('test', [12345, 'abcd'], function (err, a, b) {
          support.dump(arguments);
          assert.equal(err, null);
          assert.equal(a, 12345);
          assert.equal(b, 'abcd');
          next();
        });
      },
    ], done);
  });

});
