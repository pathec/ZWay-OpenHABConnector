# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.1.4] - 2016-12-02
### Fixed
- improve logging by more information
- add BMWi note

## [0.1.3] - 2016-09-24
### Fixed
- *core.start* event unsubscribing during module stop (the callback function never removed only added until the limit was reached)
    - fix error: *warning: possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit.* (this resulted in an *Internal server error* with HTTP status 500)
- disable removing event listener at module start (this resulted in a warning *Removing event listener failed - callback function not found!*)

## [0.1.2] - 2016-09-22
### Added
- add mapping for *switch rgb* from *rgb* to *hsb* color

## [0.1.1] - 2016-09-21
### Added
- add mapping for *sensor binary* with probe type *door-window* from *ON* to *OPEN* and *OFF* to *CLOSED*

## [0.1.0] - 2016-09-03
### Added
- initial commmit with basic observer mechanism, including:
    - a infrastructure to store openHAB items
    - event listener initialization for virtual devices and notification of registered openHAB items
    - CRUD functions for data access
    - a virtual device with some commands as public API
