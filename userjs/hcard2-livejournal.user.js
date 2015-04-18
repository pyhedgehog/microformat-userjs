// ==UserScript==
// @id             hcard-livejournal@pyhedgehog.github.com
// @name           hCard enricher for livejournal users
// @version        1.2
// @homepage       https://github.com/pyhedgehog/microformat-userjs/
// @namespace      https://github.com/pyhedgehog/microformat-userjs/
// @author         Michael P. Dubner <pywebmail@mail.ru> http://pyhedgehog.livejorunal.com/
// @description    Example of userscript enriching livejournal site with hCard microformat (using LJ-preloaded jQuery)
// @include        *://*.livejournal.com/*
// @run-at         document-end
// @grant          unsafeWindow
// @grant          console
// @grant          jQuery
// ==/UserScript==
(function() {
  if(!(/^https?:\/\/.*\.livejournal\.com\/[0-9]+\.html(\?|$)/i).test(window.location.href)) { return; }
  var count = null;
  var res = null;
  var w = window;
  function fastResolve(value) { res = value; }
  var resolve = fastResolve;
  if(typeof unsafeWindow != 'undefined') {
    console.log('hcard2-livejournal.user.js: using unsafeWindow');
    w = unsafeWindow;
  }
  if(typeof console == 'undefined') { console = w.console; } // jshint ignore:line
  if(typeof Promise != 'undefined') {
    res = new Promise(function(f) { resolve=f; });
    res.then(fastResolve);
  }
  var dconsole = console;
  dconsole = {log:function() { }};
  dconsole.log('hcard2-livejournal.user.js: '+window.location.href);
  function mfEnrichLivejournalContactDo() {
    dconsole.log(w);
    dconsole.log('hcard2-livejournal.user.js: readyState='+window.document.readyState+'; jQuery is '+(typeof w.jQuery));
    if((window.document.readyState != 'complete') || (typeof w.jQuery == 'undefined')) {
      dconsole.log('hcard2-livejournal.user.js: continue');
      return window.setTimeout(mfEnrichLivejournalContactDo,1000);
    }
    // first we adding child classes for full-name nickname and url
    w.jQuery('.i-ljuser-username').addClass('nickname fn url p-name u-url');
    // and photo
    w.jQuery('.i-ljuser-userhead').addClass('photo u-photo');
    var top = w.jQuery('.i-ljuser');
    count = top.length;
    resolve(count);
    // then we adding top-level class of hCard microformat
    top.addClass('vcard h-card')
    // then we triggering DOMNodeInserted for all top-level elements of microformat
    // so Operator (or other microformat-parsing addon) can catch our changes.
    // When Operator migrates to MutationObserver it will be unnecessary.
      .trigger('DOMNodeInserted');
    w.jQuery('body').append('<p><a href="https://github.com/pyhedgehog/microformat-userjs" rel="nofollow">'+
                            'Handled hcard-livejournal by microformat enricher (found '+count+' contacts).</a></p>');
    console.log('hcard2-livejournal.user.js: done');
  }
  mfEnrichLivejournalContactDo();
  return res;
})();
