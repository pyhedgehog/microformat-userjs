#!/usr/bin/env node

var test = require('tape-catch');
var Promise = require('q').Promise;

var userjs = require('../lib/userjs');
var urlcache = require('../lib/urlcache');
var cache = new urlcache.SqliteCache();

test('intro', function(t) {
  t.pass('urlcache.DBVER ' + urlcache.DBVER);
  t.true(cache.db, 'cache.db ' + cache.db);
  cache.ready(function() {
    t.pass('cache.size '+cache.size);
    process.nextTick(onnext);
    t.end();
  }, function() {
    t.pass('urlcache.DBVER ' + urlcache.DBVER);
    t.false(cache.error, 'cache.error ' + cache.error);
    t.false(cache.db, 'cache.db ' + cache.db);
    process.nextTick(onnext);
    t.end(cache.error);
  });
  var sleeper = setInterval(function() {
    console.log('ping');
    if(!cache || !cache.db || queue.length===0) {
      clearInterval(sleeper);
    }
  },1000);
  sleeper.ref();
});

var lj1 = 'http://news.livejournal.com/148366.html';
var lj2 = 'http://grrm.livejournal.com/257002.html';
var lj3 = 'http://ru-spb.livejournal.com/profile';
var testsList = [
  [lj1, 'hcard1-livejournal.user.js'],
  [lj1, 'hcard2-livejournal.user.js', true],
  [lj2, 'adr-livejournal.user.js'],
  [lj3, 'adr-livejournal.user.js']
  //['http://bigbilet.ru/place/artbene', 'event-bigbilet.user.js']
];

var quiet = true;
var verboseWarning = false;
var verboseError = false;

function showErrors(errors, verbose) {
  if(quiet) { return; }
  if(!errors) { return; }
  console.log('errors:');
  errors.forEach(function(err) {
    var s='';
    if(verbose && err.data) {
      if(err.data.filename) { s+='\n  ' + err.data.filename; }
      if(err.data.error) { s+=('\n' + err.data.error).replace('\n','\n    '); }
    }
    console.error('  '+(err.type ? err.type+': ' : '')+err.message+s);
  });
}

function doTest(url, scriptName, jQueryify) {
  jQueryify = !!jQueryify;
  var ondone;
  var promise = new Promise(function(resolve) { ondone=resolve; });
  test(scriptName+' '+url, function(t) {
    var obj = new userjs.UserJSApply(url, scriptName, jQueryify, cache);
    var ref;
    var refElem;
    var firstScript = true;
    obj.on('warn', onWarn);
    obj.once('error', onError);
    obj.once('close', onClose);
    obj.on('load', onBeforeUserJS);
    obj.on('userjs', onAfterUserJS);

    function onBeforeUserJS() {
      //refElem = obj.window.document.body.lastChild.outerHTML;
      t.doesNotThrow(function() {
          refElem = obj.window.document.body.lastChild.textContent.trim();
        }, null, 'onload-refElem');
      ref = obj.getMFcount();
      t.doesNotThrow(function() {
          ref = obj.getMFcount();
        }, null, 'onload-mfCount');
      //t.skip('onload-mfCount = '+ref);
    }
    function onAfterUserJS(scriptResult) {
      var check;
      t.doesNotThrow(function() {
          check = obj.getMFcount();
        }, null, 'onuserjs-mfCount');
      //t.skip('onuserjs-mfCount = '+check);
      //t.skip('mf: '+ref+' -> '+check);
      if(firstScript) {
        t.equals((ref < check), true,
          'mf count should increase ('+ref+' -> '+check+')');
      }
      firstScript = false;
      if((scriptResult !== undefined) &&
         (scriptResult !== null) &&
         scriptResult
        ) {
        t.equals(check - ref, scriptResult, 'scriptResult = '+scriptResult);
        ref = check;
      }
      //var newElem = obj.window.document.body.lastChild.outerHTML;
      var newElem;
      t.doesNotThrow(function() {
          newElem = obj.window.document.body.lastChild.textContent.trim();
        }, null, 'onuserjs-newElem');
      if(newElem != refElem) {
        t.skip(newElem);
      }
    }
    function onWarn(msg, errors) {
      showErrors(errors, verboseWarning);
    }
    function onError(msg, errors) {
      showErrors(errors, verboseError);
      t.end(msg);
      console.log('###- '+scriptName);
      ondone(''+msg);
    }
    function onClose() {
      t.end();
      console.log('###+ '+scriptName);
      ondone('ok');
    }
  });
  return promise;
}

var queue = [];
testsList.forEach(function(arr) { queue.push(arr); });
process.on('test-queue', onqueue);
function onnext() {
  process.emit('test-queue', onqueue);
}
function onqueue() {
  var arr = queue.pop();
  if(arr === undefined) {
    console.log('queue-end');
    process.exit();
  }
  doTest.apply(null, arr).then(function() { process.nextTick(onnext); });
}
