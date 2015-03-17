// ==UserScript==
// @id             hcard-livejournal@pyhedgehog.github.com
// @name           hCard enricher for livejournal users
// @version        1.1
// @homepage       https://github.com/pyhedgehog/microformat-userjs/
// @namespace      https://github.com/pyhedgehog/microformat-userjs/
// @author         Michael P. Dubner <pywebmail@mail.ru> http://pyhedgehog.livejorunal.com/
// @description    Example of userscript enriching livejournal site with hCard microformat (using plain DOM)
// @include        *://*.livejournal.com/*
// @run-at         document-end
// ==/UserScript==
(function() {
  function add_p_name(elem) { elem.className += ' nickname fn url p-name u-url'; return elem; }
  function add_u_photo(elem) { elem.className += ' photo u-photo'; return elem; }
  function add_h_card(elem) {
    count+=1;
    // then we adding top-level class of hCard microformat
    elem.className += ' vcard h-card';
    // then we triggering DOMNodeInserted for all top-level elements of microformat
    // so Operator (or other microformat-parsing addon) can catch our changes.
    var ev = new Event("DOMNodeInserted",{"bubbles":true});
    elem.dispatchEvent(ev);
    return elem;
  }
  var count=0;
  //if(window !== window.top) return;
  if(!(/^https?:\/\/.*\.livejournal\.com\/[0-9]+\.html(\?|$)/i).test(window.location.href)) return;
  // first we adding child classes for full-name nickname and url
  Array.prototype.map.call(window.document.getElementsByClassName('i-ljuser-username'), add_p_name);
  // and photo
  Array.prototype.map.call(window.document.getElementsByClassName('i-ljuser-userhead'), add_u_photo);
  Array.prototype.map.call(window.document.getElementsByClassName('i-ljuser'), add_h_card);
  var p = '<p><a href="https://github.com/pyhedgehog/microformat-userjs" rel="nofollow">Handled by hcard-livejournal microformat enricher (found '+count+' contacts).</a></p>';
  window.document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend',p);
})();
