// ==UserScript==
// @id             hcard-wigloo-amdocs@pyhedgehog.github.com
// @name           hCard enricher for Amdocs Wigloo pages
// @version        1.1
// @homepage       https://github.com/pyhedgehog/microformat-userjs/
// @namespace      https://github.com/pyhedgehog/microformat-userjs/
// @author         Michael P. Dubner <pywebmail@mail.ru> http://pyhedgehog.livejorunal.com/
// @description    Microformat enriching script for contacts on Amdocs Wigloo site
// @include        *://wigloo/*
// @include        *://wigloo.corp.amdocs.com/*
// @run-at         document-end
// @grant          unsafeWindow
// ==/UserScript==
(function() {
  function add_p_name(elem) { elem.className += ' nickname fn url p-name u-url'; return elem; }
  function add_u_photo(elem) { elem.className += ' photo u-photo'; return elem; }
  function add_u_email(elem) { elem.className += ' email u-email'; return elem; }
  function find_u_email(elem) { Array.prototype.map.call(elem.getElementsByTagName('a'), add_u_email); return elem; }
  function add_p_tel_cell(elem) { elem.className += ' tel p-tel p-tel-cell'; return elem; }
  function add_h_card(elem) {
    count+=1;
    // then we adding top-level class of hCard microformat
    elem.className += ' vcard h-card';
    // then we triggering DOMNodeInserted for all top-level elements of microformat
    // so Operator (or other microformat-parsing addon) can catch our changes.
    //var ev = new Event("DOMNodeInserted",{"bubbles":true});
    var ev = window.document.createEvent("MutationEvents");
    ev.initMutationEvent("DOMNodeInserted", true, false, elem, null, null, null, null);
    elem.dispatchEvent(ev);
    return elem;
  }
  function add_colleague_p_name(elem) {
    if(elem.getElementsByClassName('hovering_picture').length>0) return elem;
    if(elem.pathname!='/profile.aspx') return elem;
    return add_p_name(elem);
  }
  function find_colleague_p_name(elem) {
    Array.prototype.map.call(elem.getElementsByTagName('a'), add_colleague_p_name);
    return elem;
  }
  var count=0;
  var elem;
  Array.prototype.map.call(window.document.getElementsByClassName('main_header_caption'), add_p_name);
  elem = window.document.getElementById('ctl00_ctl00_PlaceHolderMain_ProfileInnerContents_cpContactDetails_lbMobilePhone');
  if(elem) { add_p_tel_cell(elem); }
  elem = window.document.getElementById('ctl00_ctl00_PlaceHolderMain_ProfileInnerContents_cpContactDetails_lbUserEmail');
  if(elem) { find_u_email(elem); }
  Array.prototype.map.call(window.document.getElementsByClassName('hovering_picture'), add_u_photo);
  elem = window.document.getElementById('ctl00_ctl00_PlaceHolderMain_ProfileInnerContents_cpContactDetails_pnlContents');
  if(elem) {
    Array.prototype.map.call(window.document.getElementsByClassName('contents_with_top_border'), add_h_card);
  }
  elem = window.document.getElementById('ctl00_ctl00_PlaceHolderMain_ProfileInnerContents_ColleaguesView1_Grid1');
  if(elem) {
    Array.prototype.map.call(elem.getElementsByClassName('Row'), find_colleague_p_name).map(add_h_card);
  }
  //var p = window.document.createElement('p');
  //p.innerHTML = '<a href="https://github.com/pyhedgehog/microformat-userjs" rel="nofollow">Handled by hcard-livejournal microformat enricher (found '+count+' contacts).</a>';
  //window.document.getElementsByTagName('body')[0].appendChild(p);
  return count;
})();
