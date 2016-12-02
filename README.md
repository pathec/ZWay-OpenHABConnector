# OpenHAB connector

This module register openHAB items that will notified after status changed.

## Installation

The preferred way of installing this module is via the "Z-Wave.Me App Store"
available in 2.2.0 and higher. For stable module releases no access token is
required. If you want to test the latest pre-releases use 'sse_zwickau_beta' as
app store access token.

For developers and users of older Z-Way versions installation via Git is
recommended.

```shell
cd /opt/z-way-server/automation/userModules
git clone https://github.com/pathec/ZWay-OpenHABConnector.git OpenHABConnector
```

## Configuration

It is not necessary to make the configuration manually. The configuration is performed via the public device interface by openHAB.

### OpenHAB servers

A list of openHAB servers. Each server consists of an alias, IP address and port.

## Virtual Devices

A virtual device with interfaces for subscribing and unsubscribing of openHAB items is generated. The user interface displays a list of all registered openHAB items.

### Commands

- registerOpenHabItem(openHAB alias, openHAB item name, Z-Way virtual device name)
- removeOpenHabItem(openHAB alias, openHAB item name)
- notifyAll()
- state()
- clearAll()
- refreshListener()

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

Copyright (C) 2016 by [Software-Systementwicklung Zwickau](http://www.software-systementwicklung.de/) Research Group

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

<br>
<img src="doc/BMWi_4C_Gef_en.jpg" width="200">
