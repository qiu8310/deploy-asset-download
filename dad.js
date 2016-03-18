#!/usr/bin/env node

var path = require('path');
var os = require('os');
var Download = require('download');
var async = require('async');
var Log = require('lac').log;

var DEFAULT_MAX = os.cpus().length * 2;
var DEFAULT_OUT_DIR = 'downloads';

var argv = require('yargs-cn')
  .version(require('./package.json').version).alias('v', 'version')
  .usage('$0 [选项] [RESOURCE_JSON_FILES = da-all.json]')
  .example('$0 all.json', '# 将 all.json 中的资源下载到本地的 ' + DEFAULT_OUT_DIR + ' 目录中')
  .example('$0 -o dist', '# 将 da-all.json 中的资源下载到本地的 dist 目录')
  .options({
    outDir: {
      alias: 'o',
      desc: '指定资源要下载到的目标文件夹',
      requiresArg: true,
      type: 'string',
      'default': DEFAULT_OUT_DIR
    },
    max: {
      alias: 'm',
      desc: '指定允许同时下载的文件数量',
      type: 'string',
      requiresArg: true,
      'default': DEFAULT_MAX
    }
  })
  .help('help').alias('h', 'help')
  .showHelpOnFail(false, '请使用 --help 查看可用的选项')
  .argv;

var files = argv._.length ? argv._ : ['./da-all.json'];
var outDir = argv.outDir || DEFAULT_OUT_DIR;
var max = parseInt(argv.max, 10) || DEFAULT_MAX;

var resources = files.reduce(function (res, file) {
  var obj = require(path.resolve(file)); // 可以是 Object, 也可以是 Array
  var k, v, dir, name;
  for (k in obj) {
    v = obj[k];
    dir = path.dirname(v.replace(/^https?:\/\/[^\/]+\//, ''));
    name = path.basename(v);
    res[path.join(outDir, dir, name)] = v;
  }
  return res;
}, {});




resources = unifyObjectValueLength(resources);
if (max === 0) {
  async.forEachOf(resources, download, error);
} else {
  async.forEachOfLimit(resources, max, download, error);
}

function download(remote, local, done) {

  Log('  **DOWNLOADING** ~%s~ TO ^%s^ **...**', remote, local);

  new Download()
    .get(remote.trim())
    .rename(path.basename(local))
    .dest(path.dirname(local))
    .run(done);
}

function error(err) {
  if (err) throw err;
  else Log('&\n  Finished!!!\n&');
}

function unifyObjectValueLength(obj) {
  var keys = Object.keys(obj);
  var res = {};
  var max = 0;
  keys.forEach(function (k) {
    if (obj[k].length > max) max = obj[k].length;
  });
  keys.forEach(function (k) {
    res[k] = obj[k] + new Array(max - obj[k].length + 1).join(' ');
  });
  return res;
}
