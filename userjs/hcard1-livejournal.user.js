// ==UserScript==
// @id             hcard-livejournal@pyhedgehog.github.com
// @name           hCard enricher for livejournal users
// @version        1.2
// @homepage       https://github.com/pyhedgehog/microformat-userjs/
// @namespace      https://github.com/pyhedgehog/microformat-userjs/
// @author         Michael P. Dubner <pywebmail@mail.ru> http://pyhedgehog.livejorunal.com/
// @description    Example of userscript enriching livejournal site with hCard microformat (using plain DOM)
// @include        *://*.livejournal.com/*
// @run-at         document-end
// ==/UserScript==
(function() {
  var tools = {};
  tools.add_p_name = function(elem) { elem.className += ' nickname fn url p-name u-url'; return elem; };
  tools.add_u_photo = function(elem) { elem.className += ' photo u-photo'; return elem; };
  tools.add_h_card = function(elem) {
    count+=1;
    // then we adding top-level class of hCard microformat
    elem.className += ' vcard h-card';
    // then we triggering DOMNodeInserted for all top-level elements of microformat
    // so Operator (or other microformat-parsing addon) can catch our changes.
    var ev = window.document.createEvent('MutationEvents');
    ev.initMutationEvent('DOMNodeInserted', true, false, elem, null, null, null, null);
    elem.dispatchEvent(ev);
    return elem;
  };
  var count=0;
  //if(window !== window.top) return;
  if(!(/^https?:\/\/.*\.livejournal\.com\/[0-9]+\.html(\?|$)/i).test(window.location.href)) { return; }
  // first we adding child classes for full-name nickname and url
  Array.prototype.map.call(window.document.getElementsByClassName('i-ljuser-username'), tools.add_p_name);
  // and photo
  Array.prototype.map.call(window.document.getElementsByClassName('i-ljuser-userhead'), tools.add_u_photo);
  Array.prototype.map.call(window.document.getElementsByClassName('i-ljuser'), tools.add_h_card);
  var p = window.document.createElement('p');
  p.innerHTML = '<a href="https://github.com/pyhedgehog/microformat-userjs" rel="nofollow">'+
                'Handled by hcard-livejournal microformat enricher (found '+count+' contacts).</a>';
  window.document.getElementsByTagName('body')[0].appendChild(p);
  return count;
})();
