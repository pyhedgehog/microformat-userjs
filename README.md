Status: [![Build Status](https://travis-ci.org/pyhedgehog/microformat-userjs.svg)](https://travis-ci.org/pyhedgehog/microformat-userjs)
[![Code Climate](https://codeclimate.com/github/pyhedgehog/microformat-userjs.svg)](https://codeclimate.com/github/pyhedgehog/microformat-userjs)
[![Test Coverage](https://codeclimate.com/github/pyhedgehog/microformat-userjs/badges/coverage.svg)](https://codeclimate.com/github/pyhedgehog/microformat-userjs)
[![Dependency Status](https://david-dm.org/pyhedgehog/microformat-userjs.svg)](https://david-dm.org/pyhedgehog/microformat-userjs)
[![devDependency Status](https://david-dm.org/pyhedgehog/microformat-userjs/dev-status.svg)](https://david-dm.org/pyhedgehog/microformat-userjs#info=devDependencies)

Community: [![Open Issues](https://img.shields.io/github/issues/pyhedgehog/microformat-userjs.svg)](https://github.com/pyhedgehog/microformat-userjs/issues)
[![Stars](https://img.shields.io/github/stars/pyhedgehog/microformat-userjs.svg)](https://github.com/pyhedgehog/microformat-userjs/stargazers)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/pyhedgehog/microformat-userjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=body_badge)

[![Docs](https://img.shields.io/badge/docs-2%2F5-green.svg)](https://github.com/pyhedgehog/microformat-userjs/wiki#enrichers-implemented-in-this-repository)
[![Install](https://img.shields.io/badge/install-5-green.svg)](https://github.com/pyhedgehog/microformat-userjs/tree/master/userjs)

# microformat-userjs
Site-specific scripts for enriching with microformats.

## Idea
There are beautiful idea for making some types of data represented on web pages accessible for automatic and semi-automatic parsing - [Microformats](http://microformats.org/).

However there are [huge flaw](http://microformats.org/wiki/advocacy) in microformat usage scenario - if we want to gather data from some site we have to force owner of this site to support microformats.
*It's often unachievable.*
We have to shift the burden to interested side - user of microformat instead of site owner.

There are technology that can help - user scripts:
  1. It's supported on almost every browser:
    * Firefox: [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
    * Firefox: [Scriptish](https://addons.mozilla.org/en-US/firefox/addon/scriptish/)
    * Opera: [Violentmonkey](https://addons.opera.com/en/extensions/details/violent-monkey/)
    * Opera: [Tampermonkey](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)
    * IE6: [Turnabout](http://www.webcitation.org/getfile?fileid=1517f90a646a7a3a439f3d5ae51d9d9d9e35872d)
    * Chrome: [Tampermonkey](https://chrome.google.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    * Safari: [NinjaKit](http://steeev.freehostia.com/wp/2010/07/19/new-extension-for-safari-5-called-ninjakit-lets-you-install-gm-scripts/)
  1. Scripts written on JavaScript - language almost everybody can master.
  1. This technique (adding microformats using user scripts) supported by in-browser microformat engined (at least by [Operator](https://addons.mozilla.org/en-US/firefox/addon/operator/)).
  1. These scripts can be used to post-process data on server side.

## Scenarios

### Music Calendar
You are interested in several concert places (each with own site), and some artists/groups (each with own site). Every other week you go to each of sites and copy concerts you are interested in to your calendar. You have to create calendar event, fill starting time, summary, address and description at least. Now you can write microformat enricher for every site and add events as batches. And this will work whatever is "provider" for your calendar - google/yahoo/owncloud or local file - single interface for microformat parser should be written and will work with every site that have microformats or was enriched.

### Company Contacts
Let's pretend that you want to add some colleagues to your own address book to keep contact after any of you leave company. Company address books are rarely compatible with latest open-source standards, so you have to fill the gap.
