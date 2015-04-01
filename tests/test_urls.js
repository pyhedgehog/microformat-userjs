#!/usr/bin/env node

var util = require('util');

var test = require('tape').test;
//var test = require('tape-catch');
var Promise = require('q').Promise;

var userjs = require('../lib/userjs');

var testsList = [
  ['http://news.livejournal.com/148366.html', 'hcard1-livejournal.user.js'],
  ['http://news.livejournal.com/148366.html', 'hcard2-livejournal.user.js', true],
  ['http://grrm.livejournal.com/257002.html', 'adr-livejournal.user.js'],
  ['http://ru-spb.livejournal.com/profile', 'adr-livejournal.user.js']
  //['http://bigbilet.ru/place/artbene', 'event-bigbilet.user.js']
];

quiet = true;
verbose_on_warning = false;
verbose_on_error = false;

function showErrors(errors, verbose) {
  if(quiet) return;
  if(!errors) return;
  console.log('errors:');
  errors.forEach(function(err) {
    var s='';
    if(verbose && err.data) {
      if(err.data.filename) s+="\n  "+err.data.filename;
      if(err.data.error) s+=('\n'+err.data.error).replace('\n','\n    ');
    }
    console.error("  "+(err.type?err.type+": ":"")+err.message+s);
  });
}

function doTest(url, scriptName, jQueryify) {
  var ondone;
  var promise = new Promise(function(resolve){ondone=resolve;});
  var testObj = test(scriptName+' '+url, function(t) {
    var obj = new userjs.UserJSApply(url, scriptName, !!jQueryify);
    var ref, refElem, first_userjs = true;
    obj.once('error', onError);
    obj.once('close', onClose);
    obj.on('load', onBeforeUserJS);
    obj.on('userjs', onAfterUserJS);

    function onBeforeUserJS() {
      //refElem = obj.window.document.body.lastChild.outerHTML;
      t.doesNotThrow(function() { refElem = obj.window.document.body.lastChild.textContent.trim(); }, null, 'onload-refElem');
      ref = obj.getMFcount();
      t.doesNotThrow(function() { ref = obj.getMFcount(); }, null, 'onload-mfCount');
      //t.skip('onload-mfCount = '+ref);
    }
    function onAfterUserJS(scriptResult) {
      var check;
      t.doesNotThrow(function(){check = obj.getMFcount(); }, null, 'onuserjs-mfCount');
      //t.skip('onuserjs-mfCount = '+check);
      //t.skip('mf: '+ref+' -> '+check);
      if(first_userjs)
        t.equals((ref < check), true, 'mf count should increase ('+ref+' -> '+check+')');
      first_userjs = false;
      if((scriptResult !== undefined) && (scriptResult !== null) && scriptResult) {
        t.equals(check - ref, scriptResult, 'scriptResult = '+scriptResult);
      ref = check;
      }
      //var newElem = obj.window.document.body.lastChild.outerHTML;
      var newElem;
      t.doesNotThrow(function() { newElem = obj.window.document.body.lastChild.textContent.trim(); }, null, 'onuserjs-newElem');
      if(newElem != refElem)
        t.skip(newElem);
    }
    function onWarn(msg, errors) {
      showErrors(errors, verbose_on_warning);
    }
    function onError(msg, errors) {
      showErrors(errors, verbose_on_error);
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
  //console.log(util.inspect(testObj));
  return promise;
}

var queue = []
testsList.forEach(function(arr){queue.push(arr);});
process.on('test-queue', onqueue);
function onnext() {
  process.emit('test-queue', onqueue);
}
process.nextTick(onnext);
function onqueue() {
  var arr = queue.pop();
  if(arr === undefined) {
    console.log('queue-end');
    process.exit();
  }
  doTest.apply(null, arr).then(function(){process.nextTick(onnext);});
}
