clouds-base
===========

## 安装

```bash
$ npm install clouds-base --save
```


## Gate

```javascript
var createGate = require('clouds-base').createGate;

var gate = createGate({
  // TCP连接
  host: '127.0.0.1',
  port: 7001
  // UNIX domain 连接
  // path: '/tmp/clouds.sock'
});

// 退出
gate.exit(function () {
  console.log('Gate server exited');
});
```


## Client

```javascript
var createClient = require('clouds-base').createClient;

var client = createClient({
  // TCP连接
  host: '127.0.0.1',
  port: 7001
  // UNIX domain 连接
  // path: '/tmp/clouds.sock'
});

// 注册服务
client.register('method', function (a, b, callback) {
  callback(null, b, a);
});

// 注销服务
client.unregister('method', function (err) {
  console.log('done');
});

// 调用服务
client.call('method', [a, b], function (err, ret) {
  if (err) {
    console.error(err);
  } else {
    console.log(ret);
  }
});

// 退出
client.exit(function () {
  console.log('client exited');
});
```


## 测试代码覆盖率

86% coverage 550 SLOC


## 授权协议

MIT
