[![Build Status](https://travis-ci.org/cgrail/github-chrome-fullname.svg?branch=master)](https://travis-ci.org/cgrail/github-chrome-fullname)
[![Coverage Status](https://coveralls.io/repos/cgrail/github-chrome-fullname/badge.svg?branch=master)](https://coveralls.io/r/cgrail/github-chrome-fullname?branch=master)

SAP GitHub Full-Name
=====================

Chrome/Firefox extension to display full-name(s) instead of SAP D- / I-User in GitHub Enterprise.

[![Chrome Extension screenshot](https://github.com/cgrail/github-chrome-fullname/raw/master/chrome-store-screenshot.png)](https://chrome.google.com/webstore/detail/sap-github-full-name/dpbnhgcdklhbhlemnffdbikcbfggcocd)

Installation
------------

You can install the Chrome Extension from the Chrome Webstore:

https://chrome.google.com/webstore/detail/sap-github-full-name/dpbnhgcdklhbhlemnffdbikcbfggcocd

The Firefox version can be installed from the Firefox Addon Page:

https://addons.mozilla.org/de/firefox/addon/sap-github/

How To Build
------------
```bash
docker run --rm -it -v $(pwd):/workspace -w /workspace --entrypoint=sh node:16.3.0-alpine3.13 -c 'yarn init'
docker run --rm -it -v $(pwd):/workspace -w /workspace --entrypoint=sh node:16.3.0-alpine3.13 -c 'yarn install'
docker run --rm -it -v $(pwd):/workspace -w /workspace --entrypoint=sh node:16.3.0-alpine3.13 -c 'yarn run build'
```

Todo
----

- Enable configuration of Enterprise Github instance

Contributors
------------

- Initial version by Thomas Uhde https://github.com/acidix
- Revised and enhanced by Christian Grail https://www.linkedin.com/in/cgrail
- Revised by Arwed Mett https://www.linkedin.com/in/arwed-mett-4b5784123/
