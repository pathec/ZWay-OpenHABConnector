/**
 * Copyright (C) 2016 by Software-Systementwicklung Zwickau Research Group
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @module OpenHABConnector
 */

/**
 * @class OpenHABConnector
 * @version 0.1.1
 * @author Patrick Hecker <pah111kg@fh-zwickau.de>
 *
 */
function OpenHABConnector (id, controller) {
    OpenHABConnector.super_.call(this, id, controller);

    var self = this;

    self.DEVICE_ID              = "OpenHabConnector";
    self.DB_NAME                = "OpenHabConnector";

    self.DB_TABLE_OPENHAB_ITEM  = "OpenHabConnector_OpenHabItem";  // filename
    // columns: openHabAlias | openHabItemName | vDevName | lastNotification | lastStatus | created | modified

    self.infoIntro = 'The following table lists all active openHAB observers (only for debugging - this feature will be removed in the stable version).';
    self.infoDataTemplate = '<div style="height: 400px; overflow: auto; font-size: 90%">'
        + '<table class="table table-striped table-condensed table-hover"><thead><tr>'
        + '<th>openHAB Alias</th>'
        + '<th>openHAB Item</th>'
        + '<th>Z-Way Device</th>'
        + '<th>Last notification</th>'
        + '<th>Last status</th>'
        + '<th>Created</th>'
        + '<th>Modified</th>'
        + '<th></th>'
        + '</tr></thead><tbody>%content%</tbody></table></div>';


    self.infoJavascript = '<script>'
        + 'function removeObserver(openHabAlias, openHabItemName) {'
        + ' $.ajax("/ZAutomation/api/v1/devices/OpenHabConnector/command/removeOpenHabItem?openHabAlias=" + openHabAlias + "&openHabItemName=" + openHabItemName);'
        + ' return 0;'
        + '}'
        + '</script>';

    // stores object references of callback funcitons for removing event listener
    self.callbackFunctions = [];
}

inherits(OpenHABConnector, AutomationModule);

_module = OpenHABConnector;

/**
 * This function is invoked at each server start
 */
OpenHABConnector.prototype.init = function (config) {
    OpenHABConnector.super_.prototype.init.call(this, config);

    var self = this;

	// this object defines the interface for the ZAutomation API and the UI (Elements)
	var vDev = self.controller.devices.create({
        deviceId: self.DEVICE_ID, // identifier for ZAutomation API
        defaults: {
            metrics: {
                title: 'OpenHAB Connector',
                text: self.infoIntro,
                icon: "/ZAutomation/api/v1/load/modulemedia/OpenHABConnector/icon.png"
            }
        },
        overlay: {
            deviceType: "text",
            metrics: {
                title: 'OpenHAB Connector',
                text: self.infoIntro,
				icon: "/ZAutomation/api/v1/load/modulemedia/OpenHABConnector/icon.png"
			}
        },
        handler: function (command, args) { // processing of incoming commands over ZAutomation API
            if(command === "registerOpenHabItem") {
                if(args.openHabAlias && args.openHabItemName && args.vDevName) {
                    var openHabItem = self.generateOpenHabItem(args.openHabAlias, args.openHabItemName, args.vDevName);
                    var status = self.registerOpenHabItem(openHabItem);
                    if(status == 1) {
                        console.log('Register:' + self.toStringOpenHabItem(openHabItem));

                        // add event listener and callback function for the virtual device
                        self.initEventListener(openHabItem);

                        self.controller.addNotification("notification", "Observer registered - openHAB item: " + openHabItem.openHabItemName, "module", "OpenHABConnector");

                        return { 'code': 1, 'message': 'OK' }
                    } else if(status == 0) {
                        console.log('Register:openHAB item allready exist')

                        return { 'code': 0, 'message': 'Register:openHAB item allready exist' }
                    }
                } else {
                    return { 'code': 2, 'message': 'OK - Error - missing parameter' }
                }
			} else if(command === "removeOpenHabItem") {
                if(args.openHabAlias && args.openHabItemName) {
                    var openHabItem = self.removeOpenHabItem(args.openHabAlias, args.openHabItemName);
                    if(openHabItem) {
                        console.log('Remove:' + self.toStringOpenHabItem(openHabItem));

                        // remove event listener for the associated virtual device
                        self.removeEventListener(openHabItem);

                        self.controller.addNotification("notification", "Observer removed - openHAB item: " + openHabItem.openHabItemName, "module", "OpenHABConnector");

                        return { 'code': 1, 'message': 'OK' }
                    } else {
                        console.log('Remove:openHAB item not found')

                        return { 'code': 0, 'message': 'Remove:openHAB item not found' }
                    }
                } else {
                    return { 'code': 2, 'message': 'OK - Error - missing parameter' }
                }
			} else if(command === "notifyAll") {
                var openHabItemData = self.getAllOpenHabItem();

                openHabItemData.forEach(function(it) {
                    self.notifyOpenHabItem(it);
                });

                return {
                    'code': 1,
                    'message': 'OK'
                }
            } else if(command === "state") {
                var openHABItem = loadObject(self.DB_TABLE_OPENHAB_ITEM);

                return {
                    'code': 1,
                    'message': 'OK',
                    'state': {
                        'openHABItem': openHABItem
                    },
                    'callbackFunctions': self.callbackFunctions
                }
			} else if(command === "clearAll") {
                var openHabItemData = self.getAllOpenHabItem();

                openHabItemData.forEach(function(it) {
                    self.removeOpenHabItem(it.openHabAlias, it.openHabItemName);

                    console.log('Remove:' + self.toStringOpenHabItem(it));

                    // remove event listener for the associated virtual device
                    self.removeEventListener(it);
                });

                return {
                    'code': 1,
                    'message': 'OK'
                }
			} else if(command === "refreshListener") {
                self.refreshListener(false);

                return {
                    'code': 1,
                    'message': 'OK'
                }
            }
        },
        moduleId: this.id
    });

    if(self.config.commonOptions.openHabServers) {
        self.openHabServers = self.config.commonOptions.openHabServers;
    }

    self.controller.on("core.start", function() {
        self.refreshListener(true);
    });

    // save virtual device obejct for later use (outside the scope of this function)
    self.vDev = vDev;

    self.refreshInfo();
};

/**
 * This function is initialize event listener for devices
 * @param {String} coreStart - context in which the function is invoked
 */
OpenHABConnector.prototype.refreshListener = function(coreStart) {
    var self = this;

    // load all registered openHAB items
    var openHabItemData = self.getAllOpenHabItem();

    // first remove all existing listener (when configuration changed and core.start not emitted)
    var index = 0;
    openHabItemData.forEach(function(it) {
        console.log("Removing event listener " + index + ': ' + self.toStringOpenHabItem(it));

        // remove event listener and callback function for the virtual device
        self.removeEventListener(it);

        index++;
    });

    // add all event listener
    index = 0; // reset index
    openHabItemData.forEach(function(it) {
        console.log("Initializing event listener " + index + ': ' + self.toStringOpenHabItem(it));

        // first check device and (alias) configuration - if not longer available: delete
        // load server by openHAB alias
        var server = _.findWhere(self.openHabServers, {openHabAlias: it.openHabAlias});
        if(server) {
            if(coreStart == true) {
                // real existing devices not available at this point!
                // add event listener and callback function for the virtual device
                self.initEventListener(it);
            } else {
                // load virtual device by id
                var vDev = self.controller.devices.get(it.vDevName);
                if(vDev) {
                    // add event listener and callback function for the virtual device
                    self.initEventListener(it);
                } else {
                    // delete
                    console.log("Delete listener: virtual device " + it.vDevName + " not longer available.")
                    self.removeOpenHabItem(it.openHabAlias, it.openHabItemName);
                }
            }
        } else {
            // delete
            console.log("Delete listener: openHAB server " + it.openHabAlias + " not longer available.")
            self.removeOpenHabItem(it.openHabAlias, it.openHabItemName);
        }

        index++;
    });
}

/**
 * This function is invoked at each server stop
 */
OpenHABConnector.prototype.stop = function () {
    var self = this;

    self.controller.off("core.start", function() {});

    // load all registered openHAB items
    var openHabItemData = self.getAllOpenHabItem();
    var index = 0;
    openHabItemData.forEach(function(it) {
        console.log("Removing event listener " + index + ': ' + self.toStringOpenHabItem(it));

        // remove event listener and callback function for the virtual device
        self.removeEventListener(it);

        index++;
    });

    self.controller.devices.remove(self.DEVICE_ID);

    OpenHABConnector.super_.prototype.stop.call(self);
};

/**
 * Initialize event listener for virtual device updates
 * @param {Object} openHabItem - openHAB item instance
 */
OpenHABConnector.prototype.initEventListener = function (openHabItem) {
    var self = this;

    console.log("Initialize event listener " + self.toStringOpenHabItem(openHabItem));

    // wrap method with a function
    var callbackFunction = function() {
        self.notifyOpenHabItem(openHabItem);
    }

    // store function-reference (needed for removing event listener)
    self.callbackFunctions.push({
        'openHabAlias': openHabItem.openHabAlias,
        'openHabItemName': openHabItem.openHabItemName,
        'callbackFunction': callbackFunction
    });

    self.controller.devices.on(openHabItem.vDevName, "change:metrics:level", callbackFunction);
}

/**
 * Notify openHAB item
 * @param {Object} openHabItem - openHAB item instance
 */
OpenHABConnector.prototype.notifyOpenHabItem = function (openHabItem) {
    console.log("Notify openHAB item ...");

    var self = this;

    var vDev = self.controller.devices.get(openHabItem.vDevName);

    if (vDev) {
        var level = "";
        var deviceType = vDev.get("deviceType");
        var probeType = vDev.get("probeType");

        // TODO universal convert function to transform Z-Way level to openHAB state type
        if(deviceType == "switchBinary" || deviceType == "sensorBinary" || deviceType == "switchControl") {
            if(vDev.get("metrics:level") == "on") {
                level = "ON";
            } else {
                level = "OFF";
            }
        }

        if(deviceType == "sensorBinary" && probeType == "door-window") {
            if(vDev.get("metrics:level") == "on") {
                level = "OPEN";
            } else {
                level = "CLOSED";
            }
        }

        // load server by openHAB alias
        var server = _.findWhere(self.openHabServers, {openHabAlias: openHabItem.openHabAlias});

        if(server) {
            console.log("OpenHAB server found");
            console.log('http://' + server.ipAddress + ':' + server.port + '/rest/items/' + openHabItem.openHabItemName + '/state');
            http.request({
                url: 'http://' + server.ipAddress + ':' + server.port + '/rest/items/' + openHabItem.openHabItemName + '/state',
                method: 'PUT',
                data: String(level),
                async: true,
                headers: {
                    'Content-Type': 'text/plain'
                },
                // dataType and contentType not available in Z-Way!!!
                // dataType: "json", // json, text - expected format
                // contentType: "text/plain", // text/plain, application/json - data to server
                success: function(res) {
                    console.log("openHAB item successully notified " + openHabItem.openHabItemName);

                    // update openHab item
                    openHabItem.lastNotification = new Date();
                    openHabItem.lastStatus = 'OK';
                    openHabItem.modified = new Date();

                    self.updateOpenHabItem(openHabItem);
                },
                error: function(res) {
                    console.log("openHAB item not notified " + openHabItem.openHabItemName);

                    // update openHab item
                    openHabItem.lastNotification = new Date();
                    openHabItem.lastStatus = 'Error';
                    openHabItem.modified = new Date();

                    self.updateOpenHabItem(openHabItem);

                    self.controller.addNotification("warning", "Observer not notified - openHAB item: " + openHabItem.openHabItemName + "(HTTP Status: " + res.status + ")", "module", "OpenHABConnector");
                }
            });
        } else {
            console.log("No openHAB server found");
        }

    }
}

/**
 * Remove event listener for virtual device updates
 * @param {Object} openHAB item
 */
OpenHABConnector.prototype.removeEventListener = function (openHabItem) {
    var self = this;

    console.log("Removing event listener " + self.toStringOpenHabItem(openHabItem));

    var callback = _.findWhere(self.callbackFunctions, {openHabAlias: openHabItem.openHabAlias, openHabItemName: openHabItem.openHabItemName}); // _.findWhere returns single object or undefined
    if(callback) {
        self.controller.devices.off(openHabItem.vDevName, "change:metrics:level", callback.callbackFunction);

        // remove callback function reference!
        self.callbackFunctions = _.without(self.callbackFunctions, _.findWhere(self.callbackFunctions, callback));
    } else {
        console.log("Removing event listener failed - callback function not found!");
    }

}

/**
 * Add openHAB item to db-file
 * @param {Object} openHabItem - openHAB item instance
 * @return {Number} status - 0 item allready exist - 1 new item inserted
 */
OpenHABConnector.prototype.registerOpenHabItem = function (openHabItem) {
    var self = this;

    // load db-file
    var tableOpenHabItem = loadObject(self.DB_TABLE_OPENHAB_ITEM);

    // create db-file, if neccessary
    if (!tableOpenHabItem) {
        tableOpenHabItem = {
            db: self.DB_NAME,
            created: Date.now(),
            data: []
        };
    }

    // if an entry of openHAB item exist returns null
    var found = _.findWhere(tableOpenHabItem.data, {openHabAlias: openHabItem.openHabAlias, openHabItemName: openHabItem.openHabItemName}); // _.findWhere returns single object or undefined
    if(found) {
        return 0;
    } else {
        // add new item and store db-file
        tableOpenHabItem.data.push(openHabItem);
        saveObject(self.DB_TABLE_OPENHAB_ITEM, tableOpenHabItem);

        self.refreshInfo();

        return 1;
    }
}

/**
 * Update openHAB item to db-file
 * @param {Object} openHabItem openHAB item instance
 * @return {Number} status -1 db not found / 0 item not found / 1 item updated
 */
OpenHABConnector.prototype.updateOpenHabItem = function (openHabItem) {
    var self = this;

    // load db-file
    var tableOpenHabItem = loadObject(self.DB_TABLE_OPENHAB_ITEM);

    // create db-file, if neccessary
    if (!tableOpenHabItem) {
        return -1;
    }

    // if an entry of openHAB item exist returns null
    var oldOpenHabItem = _.findWhere(tableOpenHabItem.data, {openHabAlias: openHabItem.openHabAlias, openHabItemName: openHabItem.openHabItemName}); // _.findWhere returns single object or undefined
    if(!oldOpenHabItem) {
        return 0;
    } else {
        // remove old item from array
        tableOpenHabItem.data = _.without(tableOpenHabItem.data, _.findWhere(tableOpenHabItem.data, oldOpenHabItem));

        // add new item and store db-file
        tableOpenHabItem.data.push(openHabItem);
        saveObject(self.DB_TABLE_OPENHAB_ITEM, tableOpenHabItem);

        self.refreshInfo();

        return 1;
    }
}

/**
 * Removes openHAB item from db-file
 * @param {String} openHabAlias - openHAB alias addresses the openHAB server
 * @param {String} openHabItemName- openHAB item name is the unique identifier for an openHAB item
 * @return {Object} removed object or null if an error occours
 */
OpenHABConnector.prototype.removeOpenHabItem = function (openHabAlias, openHabItemName) {
    var self = this;

    // load db-file
    var tableOpenHabItem = loadObject(self.DB_TABLE_OPENHAB_ITEM);

    // create db-file, if neccessary
    if (tableOpenHabItem) {
        var openHabItem = _.findWhere(tableOpenHabItem.data, {openHabAlias: openHabAlias, openHabItemName: openHabItemName});
        if(openHabItem) {
            // remove from array
            tableOpenHabItem.data = _.without(tableOpenHabItem.data, _.findWhere(tableOpenHabItem.data, openHabItem));
            // save new array
            saveObject(self.DB_TABLE_OPENHAB_ITEM, tableOpenHabItem);

            self.refreshInfo();

            return openHabItem;
        } else {
            return null; // no item found
        }
    } else {
        return null; // no db-file
    }
}

/**
 * Generates and updates text of virtual device
 */
OpenHABConnector.prototype.refreshInfo = function () {
    var self = this;

    var openHabItemData = self.getAllOpenHabItem();
    var infoDataContent = "";

    openHabItemData.forEach(function(it) {
        infoDataContent += "<tr><td>" + it.openHabAlias + "</td>"
            + "<td>" + it.openHabItemName + "</td>"
            + "<td>" + it.vDevName + "</td>"
            + "<td>" + self.formatDate(new Date(it.lastNotification)) + "</td>"
            + "<td>" + it.lastStatus + "</td>"
            + "<td>" + self.formatDate(new Date(it.created)) + "</td>"
            + "<td>" + self.formatDate(new Date(it.modified)) + "</td>"
            + '<td><button class="btn btn-default" onclick="removeObserver(&apos;' + it.openHabAlias + '&apos;, &apos;' + it.openHabItemName + '&apos;)"><i class="fa fa-remove"></i></button></td></tr>';
    });

    if(self.vDev) {
        self.vDev.set("metrics:text", self.infoIntro + "<br><br>" + self.infoDataTemplate.replace("%content%", infoDataContent) + self.infoJavascript);
    }
}

/**
 * The method formats a date object on the pattern "2016-07-20 13:18:02"
 * @return {String} formatted date
 */
OpenHABConnector.prototype.formatDate = function (date) {
    var dateMonth = date.getMonth() + 1;
    if(dateMonth < 10) {
        dateMonth = "0" + dateMonth;
    }

    var dateDay = date.getDate();
    if(dateDay < 10) {
        dateDay = "0" + dateDay;
    }

    var dateHours = date.getHours();
    if(dateHours < 10) {
        dateHours = "0" + dateHours;
    }

    var dateMinutes = date.getMinutes();
    if(dateMinutes < 10) {
        dateMinutes = "0" + dateMinutes;
    }

    var dateSeconds = date.getSeconds();
    if(dateSeconds < 10) {
        dateSeconds = "0" + dateSeconds;
    }

    return date.getFullYear() + "-" + dateMonth + "-" + dateDay + " "
        + dateHours + ":" + dateMinutes + ":" + dateSeconds;
}

/**
 * Returns an array of openHAB items from db-file
 * @return {Array} pure data, without db-structure
 */
OpenHABConnector.prototype.getAllOpenHabItem = function () {
    var self = this;

    // load db-file
    var tableOpenHabItem = loadObject(self.DB_TABLE_OPENHAB_ITEM);

    // create db-file, if neccessary
    if (tableOpenHabItem) {
        return tableOpenHabItem.data;
    } else {
        return [];
    }
}

/**
 * The method provides a factory for openHAB items
 * @param {String} openHabAlias - openHAB alias addresses the openHAB server
 * @param {String} openHabItemName - openHAB item name is the unique identifier for an openHAB item
 * @param {String} vDevName - virtual device name ia the unique identifier for an Z-Way device
 * @return {Object} openHAB item
 */
OpenHABConnector.prototype.generateOpenHabItem = function (openHabAlias, openHabItemName, vDevName) {
    var self = this;

    return {
        'openHabAlias': openHabAlias,
        'openHabItemName': openHabItemName,
        'vDevName': vDevName,
        'lastNotification': new Date(),
        'lastStatus': 'Unknown',
        'created': new Date(),
        'modified': new Date()
    }
}

/**
 * toString-Method for openHAB items
 * @param {Object} openHabItem - openHAB item instance
 * @return {String} string representation for openHAB items
 */
OpenHABConnector.prototype.toStringOpenHabItem = function (openHabItem) {
    var self = this;

    return self.DEVICE_ID
        + ":" + openHabItem.openHabAlias
        + ":" + openHabItem.openHabItemName
        + ":" + openHabItem.vDevName
        + ":" + openHabItem.lastNotification
        + ":" + openHabItem.lastStatus
        + ":" + openHabItem.created
        + ":" + openHabItem.modified;
}
