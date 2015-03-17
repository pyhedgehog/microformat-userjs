// ==UserScript==
// @id             hcard-livejournal@pyhedgehog.github.com
// @name           hCard enricher for livejournal users
// @version        1.0
// @homepage       https://github.com/pyhedgehog/microformat-userjs/
// @namespace      https://github.com/pyhedgehog/microformat-userjs/
// @author         Michael P. Dubner <pywebmail@mail.ru> http://pyhedgehog.livejorunal.com/
// @description    Example of userscript enriching livejournal site with hCard microformat (using LJ-preloaded jQuery)
// @include        *://*.livejournal.com/*
// @run-at         document-end
// @grant          unsafeWindow console
// ==/UserScript==
(function mfenrich_livejournal_hcard() {
  //if(window !== window.top) return;
  if(!(/^https?:\/\/.*\.livejournal\.com\/[0-9]+\.html(\?|$)/i).test(window.location.href)) return;
  var w = window;
  if(typeof unsafeWindow != "undefined") {
    w = unsafeWindow;
  }
  if(typeof console == "undefined") console = w.console;
  var dconsole = console;
  dconsole={log:function(){}};
  dconsole.log("hcard2-livejournal.user.js: "+window.location.href);
  window.setTimeout(function mfenrich_livejournal_hcard_do(){
    dconsole.log(w);
    dconsole.log("hcard2-livejournal.user.js: readyState="+window.document.readyState+"; jQuery is "+(typeof w.jQuery));
    if((window.document.readyState != "complete") || (typeof w.jQuery == "undefined")) {
      dconsole.log("hcard2-livejournal.user.js: continue");
      return window.setTimeout(mfenrich_livejournal_hcard_do,1000);
    }
    // first we adding child classes for full-name nickname and url
    w.jQuery('.i-ljuser-username').addClass('nickname fn url p-name u-url');
    // and photo
    w.jQuery('.i-ljuser-userhead').addClass('photo u-photo');
    var top = w.jQuery('.i-ljuser');
    var count = top.length;
    // then we adding top-level class of hCard microformat
    top.addClass('vcard h-card')
    // then we triggering DOMNodeInserted for all top-level elements of microformat
    // so Operator (or other microformat-parsing addon) can catch our changes.
    // When Operator migrates to MutationObserver it will be unnecessary.
      .trigger('DOMNodeInserted');
    w.jQuery('body').append('<p><a href="https://github.com/pyhedgehog/microformat-userjs" rel="nofollow">Handled hcard-livejournal by microformat enricher (found '+count+' contacts).</a></p>');
    dconsole.log('hcard2-livejournal.user.js: done');
  }, 0);
})();
