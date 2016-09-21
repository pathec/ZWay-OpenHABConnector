# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

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
