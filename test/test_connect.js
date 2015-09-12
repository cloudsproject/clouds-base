/**
 * clouds-base test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

var support = require('./support');
var base = require('../');


describe('clouds-base', function () {

  it('register & call #normal', function (done) {
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

  it('register & call #same client', function (done) {
    var address = support.getListenAddress();
    var gate = base.createGate(address);
    var c1 = base.createClient(address);

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
        c1.call('hello', ['world'], function (err, ret) {
          support.dump(arguments);
          assert.equal(err, null);
          assert.equal(ret, 'hello, world');
          next();
        });
      },
      function (next) {
        c1.call('hello', ['xxxx'], function (err, ret) {
          support.dump(arguments);
          assert.equal(err, null);
          assert.equal(ret, 'hello, xxxx');
          next();
        });
      },
      function (next) {
        c1.call('add', [1, 2], function (err, ret) {
          support.dump(arguments);
          assert.equal(err, null);
          assert.equal(ret, 3);
          next();
        });
      },
      function (next) {
        c1.call('add', [3.2, 4.3], function (err, ret) {
          support.dump(arguments);
          assert.equal(err, null);
          assert.equal(ret, 7.5);
          next();
        });
      },
      function (next) {
        c1.call('test', [12345, 'abcd'], function (err, a, b) {
          support.dump(arguments);
          assert.equal(err, null);
          assert.equal(a, 12345);
          assert.equal(b, 'abcd');
          next();
        });
      },
    ], done);
  });

  it('register & unregister & call & exit #multi worker', function (done) {
    var address = support.getListenAddress();
    var gate = base.createGate(address);
    var c1 = base.createClient(address);
    var c2 = base.createClient(address);
    var c3 = base.createClient(address);
    var c4 = base.createClient(address);
    var c5 = base.createClient(address);
    var c6 = base.createClient(address);
    var c7 = base.createClient(address);

    async.series([
      function (next) {
        c1.__counter = 0;
        c1.register('exchange', function (a, b, callback) {
          support.randomWait(function () {
            c1.__counter++;
            callback(null, b, a);
          });
        }, next);
      },
      function (next) {
        c2.__counter = 0;
        c2.register('exchange', function (a, b, callback) {
          support.randomWait(function () {
            c2.__counter++;
            callback(null, b, a);
          });
        }, next);
      },
      function (next) {
        c3.__counter = 0;
        c3.register('exchange', function (a, b, callback) {
          support.randomWait(function () {
            c3.__counter++;
            callback(null, b, a);
          });
        }, next);
      },
      function (next) {
        c4.__counter = 0;
        c4.register('exchange', function (a, b, callback) {
          support.randomWait(function () {
            c4.__counter++;
            callback(null, b, a);
          });
        }, next);
      },
      function (next) {
        c5.__counter = 0;
        c5.register('exchange', function (a, b, callback) {
          support.randomWait(function () {
            c5.__counter++;
            callback(null, b, a);
          });
        }, next);
      },
      function (next) {
        async.times(100, function (i, next) {
          var A = support.randomString(10);
          var B = support.randomString(10);
          c5.call('exchange', [A, B], function (err, a, b) {
            assert.equal(err, null);
            assert.equal(a, B);
            assert.equal(b, A);
            next();
          });
        }, next);
      },
      function (next) {
        assert.equal(c1.__counter + c2.__counter + c3.__counter + c4.__counter + c5.__counter, 100);
        assert.equal(c1.__counter, 20);
        assert.equal(c2.__counter, 20);
        assert.equal(c3.__counter, 20);
        assert.equal(c4.__counter, 20);
        assert.equal(c5.__counter, 20);
        c1.__counter = 0;
        c2.__counter = 0;
        c3.__counter = 0;
        c4.__counter = 0;
        c5.__counter = 0;
        next();
      },
      //------------------------------------------------------------------------
      function (next) {
        c5.unregister('exchange', next);
      },
      function (next) {
        async.times(100, function (i, next) {
          var A = support.randomString(10);
          var B = support.randomString(10);
          c5.call('exchange', [A, B], function (err, a, b) {
            assert.equal(err, null);
            assert.equal(a, B);
            assert.equal(b, A);
            next();
          });
        }, next);
      },
      function (next) {
        assert.equal(c1.__counter + c2.__counter + c3.__counter + c4.__counter, 100);
        assert.equal(c1.__counter, 25);
        assert.equal(c2.__counter, 25);
        assert.equal(c3.__counter, 25);
        assert.equal(c4.__counter, 25);
        c1.__counter = 0;
        c2.__counter = 0;
        c3.__counter = 0;
        c4.__counter = 0;
        next();
      },
      //------------------------------------------------------------------------
      function (next) {
        c1.exit(next);
      },
      function (next) {
        c2.exit(next);
      },
      function (next) {
        c3.exit(next);
      },
      function (next) {
        c4.exit(next);
      },
      function (next) {
        c6.__counter = 0;
        c6.register('exchange', function (a, b, callback) {
          support.randomWait(function () {
            c6.__counter++;
            callback(null, b, a);
          });
        }, next);
      },
      function (next) {
        c7.__counter = 0;
        c7.register('exchange', function (a, b, callback) {
          support.randomWait(function () {
            c7.__counter++;
            callback(null, b, a);
          });
        }, next);
      },
      function (next) {
        async.times(100, function (i, next) {
          var A = support.randomString(10);
          var B = support.randomString(10);
          c5.call('exchange', [A, B], function (err, a, b) {
            assert.equal(err, null);
            assert.equal(a, B);
            assert.equal(b, A);
            next();
          });
        }, next);
      },
      function (next) {
        assert.equal(c6.__counter + c7.__counter, 100);
        assert.equal(c6.__counter, 50);
        assert.equal(c7.__counter, 50);
        c6.__counter = 0;
        c7.__counter = 0;
        next();
      },
    ], done);
  });

});
