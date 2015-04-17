#!/usr/bin/env node
/*if(global.v8debug) {
  global.v8debug.Debug.setBreakOnUncaughtException();
}*/
var userjs = require('../lib/userjs');
var util = require('util');
var scriptsregistry = require('../lib/scriptsregistry');
var i;
var url;
var sl;
var jQueryify;
var queue = [];

for(i=2; i<process.argv.length; i++) {
  url = process.argv[i];
  //sl = scriptsregistry.url2scriptinfo(url);
  //jQueryify = sl.some(function(si){return si.wantsJQuery(); });
  //sl = sl.map(function(si){return si.scriptName;});
  queue.push(url);
}
process.on('main-url-queue', onqueue);
process.emit('main-url-queue');
function onqueue() {
  var url = queue.pop();
  if(url === undefined) { return process.exit(); }
  //var obj = new userjs.UserJSApply(url, sl, jQueryify);
  var obj = new userjs.UserJSApply(url);
  var arr;
  obj.on('load', function() {
    arr = obj.getMFarray();
    console.log('getMFcount(load) =', obj.getMFcount());
  });
  obj.on('userjs', function(res, script) {
    //console.log('userjs-res =', res);
    //console.log('userjs-script =', script.scriptName);
    arr = obj.getMFarray();
    //console.log('getMFarray =', JSON.stringify(arr, undefined, 4));
    console.log('getMFcount('+script+', '+res+') =', obj.getMFcount());
    /*for(var k in arr) {
      console.log(' ', k, '=', arr[k].length);
    }*/
  });
  obj.once('error', function(err) {
    console.error(err);
    process.emit('main-url-queue', onqueue);
  });
  obj.once('close', function() {
    console.log('getMFarray =', JSON.stringify(arr, undefined, 4));
    process.emit('main-url-queue', onqueue);
  });
}
