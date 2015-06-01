Status:
<!--[![Build Status](https://travis-ci.org/pyhedgehog/microformat-userjs.svg)](https://travis-ci.org/pyhedgehog/microformat-userjs)-->
![Build Status](https://img.shields.io/badge/build-unavailable-lightgrey.svg)
[![Code Climate](https://codeclimate.com/github/pyhedgehog/microformat-userjs.svg)](https://codeclimate.com/github/pyhedgehog/microformat-userjs)
[![Test Coverage](https://codeclimate.com/github/pyhedgehog/microformat-userjs/badges/coverage.svg)](https://codeclimate.com/github/pyhedgehog/microformat-userjs)
[![Dependency Status](https://david-dm.org/pyhedgehog/microformat-userjs.svg)](https://david-dm.org/pyhedgehog/microformat-userjs)
[![devDependency Status](https://david-dm.org/pyhedgehog/microformat-userjs/dev-status.svg)](https://david-dm.org/pyhedgehog/microformat-userjs#info=devDependencies)

Docs:
[![Manuals](https://pyhedgehog.github.io/microformat-userjs/images/docs.svg)](https://github.com/pyhedgehog/microformat-userjs/wiki#enrichers-implemented-in-this-repository)
[![Install](https://pyhedgehog.github.io/microformat-userjs/images/install.svg)](https://github.com/pyhedgehog/microformat-userjs/tree/master/userjs/)
[![Open Issues](https://img.shields.io/github/issues/pyhedgehog/microformat-userjs.svg)](https://github.com/pyhedgehog/microformat-userjs/issues)
[![Stars](https://img.shields.io/github/stars/pyhedgehog/microformat-userjs.svg)](https://github.com/pyhedgehog/microformat-userjs/stargazers)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/pyhedgehog/microformat-userjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=body_badge)

# microformat-userjs
Site-specific scripts for enriching with microformats.

## Current Status
Writing initial bunch of user-scripts needed by alpha-user.
Testing on Firefox+Scriptish.

## Idea
There is beautiful idea for making some types of data represented on web pages accessible for automatic and semi-automatic parsing - [Microformats](http://microformats.org/).

However there is a [huge flaw](http://microformats.org/wiki/advocacy) in microformat usage scenario - if we want to gather data from some site we have to force owner of this site to support microformats.
*It's often impossible to do.*
We have to shift the task to interested side - user of microformat instead of site owner.

There is a technology that can help - user scripts:
  1. It's supported on almost every browser:
    * Firefox: [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
    * Firefox: [Scriptish](https://addons.mozilla.org/en-US/firefox/addon/scriptish/)
    * Opera: [Violentmonkey](https://addons.opera.com/en/extensions/details/violent-monkey/)
    * Opera: [Tampermonkey](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)
    * IE6: [Turnabout](http://www.webcitation.org/getfile?fileid=1517f90a646a7a3a439f3d5ae51d9d9d9e35872d)
    * IE7Pro: [IEScripts](http://web.archive.org/web/20121228011634/http://www.iescripts.org/)
    * Chrome: [Tampermonkey](https://chrome.google.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    * Safari: [NinjaKit](http://steeev.freehostia.com/wp/2010/07/19/new-extension-for-safari-5-called-ninjakit-lets-you-install-gm-scripts/)
  1. Scripts written on JavaScript - language almost everybody can master.
  1. This technique (adding microformats using user scripts) supported by in-browser microformat engines (at least by [Operator](https://addons.mozilla.org/en-US/firefox/addon/operator/)).
  1. These scripts can be used to post-process data on server side.

## Scenarios

### Music Calendar
You are interested in several concert places (each with its own site), and some artists/groups (each with its own site). Every other week you go to each of sites and copy concerts you are interested in to your calendar. You have to create calendar event, fill starting time, summary, address and description at least. Now you can write or find microformat enricher for every site and add events as batches. And this will work whatever is "provider" for your calendar - google/yahoo/owncloud or local file. Single interface for microformat parser should be written and will work with every site that have microformats or was enriched.

### Company Contacts
Let's pretend that you want to add some colleagues to your own address book to keep contact after any of you leave company. Company address books are rarely compatible with latest open-source standards, so you have to fill the gap.

## TODO
* Complete initial set of user-scripts.
* Complete node-based test environment.
* Improve node-based test environment:
 * Support `@exclude`
 * Support `@match` (and `@exclude-match`)
 * Support [`@priority`](https://github.com/scriptish/scriptish/wiki/Manual%3A-Metadata-Block#priority-new-in-scriptish)
 * Support `@require`
 * Support `GM_*` functions
 * Support `@resource`
* Write enrichers technology advertizement. (Help wanted)
* Write standard enricher installation instructions for each possible environment. (Help wanted)
* Write standard recomendation for site-owners: (Help wanted)
 * Why we aren't stealing data.
 * Why user better love their site.
 * How they may change their site.
* Write standard recommendation for unparsable site-owners (i.e. personal musicians blogs). (Help wanted)
