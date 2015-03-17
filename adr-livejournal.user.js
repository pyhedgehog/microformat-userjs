// ==UserScript==
// @id             adr-livejournal@pyhedgehog.github.com
// @name           adr enricher for livejournal users
// @version        1.0
// @homepage       https://github.com/pyhedgehog/microformat-userjs/
// @namespace      https://github.com/pyhedgehog/microformat-userjs/
// @author         Michael P. Dubner <pywebmail@mail.ru> http://pyhedgehog.livejorunal.com/
// @description    Example of userscript enriching livejournal site with adr microformat (using plain DOM)
// @include        *://*.livejournal.com/*
// @run-at         document-end
// ==/UserScript==
(function mfenrich_livejournal_hcard() {
  var count=0;
  function add_locality(elem) { elem.className += ' locality p-locality'; return elem; }
  function add_adr(elem) {
    count+=1;
    // we adding top-level class of adr microformat
    elem.className += ' adr h-adr';
    Array.prototype.map.call(elem.getElementsByTagName('a'), add_locality);
    // then we triggering DOMNodeInserted for all top-level elements of microformat
    // so Operator (or other microformat-parsing addon) can catch our changes.
    var ev = new Event("DOMNodeInserted",{"bubbles":true});
    elem.dispatchEvent(ev);
    return elem;
  }
  function add_adr_check_href(elem) {
    Array.prototype.map.call(elem.getElementsByTagName('a'),
        function(elem)
        {
          if(elem.href.toLowerCase().indexOf('maps')>=0) add_adr(elem.parentNode);
          return elem;
        });
    return elem;
  }
  // add adr to profile location field
  Array.prototype.map.call(window.document.getElementsByClassName('b-profile-group-geo'), add_adr);
  // add adr to post location field for several LJ-styles
  Array.prototype.map.call(window.document.getElementsByClassName('metadata-location'), add_adr);
  Array.prototype.map.call(window.document.getElementsByClassName('p-location'), add_adr);
  Array.prototype.map.call(window.document.getElementsByClassName('lj-currents'), add_adr_check_href);
  //if(count==0) return;
  var p = '<p><a href="https://github.com/pyhedgehog/microformat-userjs" rel="nofollow">Handled by adr-livejournal microformat enricher (found '+count+' locations).</a></p>';
  window.document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend',p);
})();
