    
    /**
     * This represents the PhoneGap API itself, and provides a global namespace for accessing
     * information about the state of PhoneGap.
     * @class
     */
    PhoneGap = {
        queue: {
            ready: true,
            commands: [],
            timer: null
        },
        _constructors: []
    };
    
    /**
     * Boolean flag indicating if the PhoneGap API is available and initialized.
     */
    PhoneGap.available = DeviceInfo.uuid != undefined;
    
    /**
     * Add an initialization function to a queue that ensures it will run and initialize
     * application constructors only once PhoneGap has been initialized.
     * @param {Function} func The function callback you want run once PhoneGap is initialized
     */
    PhoneGap.addConstructor = function(func) {
        var state = document.readyState;
        if (state != 'loaded' && state != 'complete')
            PhoneGap._constructors.push(func);
        else
            func();
    };
    (function() {
        var timer = setInterval(function() {
            var state = document.readyState;
            if (state != 'loaded' && state != 'complete')
                return;
            clearInterval(timer);
            while (PhoneGap._constructors.length > 0) {
                var constructor = PhoneGap._constructors.shift();
                try {
                    constructor();
                } catch(e) {
                    if (typeof(debug['log']) == 'function')
                        debug.log("Failed to run constructor: " + e.message);
                    else
                        alert("Failed to run constructor: " + e.message);
                }
            }
        }, 1);
    })();
    
    
    /**
     * Execute a PhoneGap command in a queued fashion, to ensure commands do not
     * execute with any race conditions, and only run when PhoneGap is ready to
     * recieve them.
     * @param {String} command Command to be run in PhoneGap, e.g. "ClassName.method"
     * @param {String[]} [args] Zero or more arguments to pass to the method
     */
    PhoneGap.exec = function() {
        PhoneGap.queue.commands.push(arguments);
        if (PhoneGap.queue.timer == null)
            PhoneGap.queue.timer = setInterval(PhoneGap.run_command, 10);
    };
    /**
     * Internal function used to dispatch the request to PhoneGap.  It processes the command
     * queue and executes the next command on the list.
     * @private
     */
    PhoneGap.run_command = function() {
        if (!PhoneGap.available)
            return;
    
        PhoneGap.queue.ready = false;
    
        var args = PhoneGap.queue.commands.shift();
        if (PhoneGap.queue.commands.length == 0) {
            clearInterval(PhoneGap.queue.timer);
            PhoneGap.queue.timer = null;
        }
    
        var uri = [];
        for (var i = 1; i < args.length; i++) {
            uri.push(encodeURIComponent(args[i]));
        }
        document.location = "gap://" + args[0] + "/" + uri.join("/");
    
    };
    
    /**
     * this represents the mobile device, and provides properties for inspecting the model, version, UUID of the
     * phone, etc.
     * @constructor
     */
    function Device() {
        this.available = PhoneGap.available;
        this.model     = null;
        this.version   = null;
        this.gap       = null;
        this.uuid      = null;
        try {
            if (window['DroidGap'] != undefined && window.DroidGap.exists()) {
                this.available = true;
                this.isAndroid = true;
                this.uuid = window.DroidGap.getUuid();
                this.gapVersion = window.DroidGap.getVersion();
            } else {          
                this.model     = DeviceInfo.platform;
                this.version   = DeviceInfo.version;
                this.gap       = DeviceInfo.gap;
                this.uuid      = DeviceInfo.uuid;
            }
        } catch(e) {
            this.available = false;
        }
    }
    
    PhoneGap.addConstructor(function() {
        navigator.device = window.device = new Device();
    });
    
    
    
    /**
     * This class contains acceleration information
     * @constructor
     * @param {Number} x The force applied by the device in the x-axis.
     * @param {Number} y The force applied by the device in the y-axis.
     * @param {Number} z The force applied by the device in the z-axis.
     */
    function Acceleration(x, y, z) {
    	/**
    	 * The force applied by the device in the x-axis.
    	 */
    	this.x = x;
    	/**
    	 * The force applied by the device in the y-axis.
    	 */
    	this.y = y;
    	/**
    	 * The force applied by the device in the z-axis.
    	 */
    	this.z = z;
    	/**
    	 * The time that the acceleration was obtained.
    	 */
    	this.timestamp = new Date().getTime();
    }
    
    /**
     * This class specifies the options for requesting acceleration data.
     * @constructor
     */
    function AccelerationOptions() {
    	/**
    	 * The timeout after which if acceleration data cannot be obtained the errorCallback
    	 * is called.
    	 */
    	this.timeout = 10000;
    }
    
    
    /**
     * This class provides access to device accelerometer data.
     * @constructor
     */
    function Accelerometer() {
    	/**
    	 * The last known acceleration.
    	 */
    	this.lastAcceleration = null;
    }
    
    /**
     * Asynchronously aquires the current acceleration.
     * @param {Function} successCallback The function to call when the acceleration
     * data is available
     * @param {Function} errorCallback The function to call when there is an error 
     * getting the acceleration data.
     * @param {AccelerationOptions} options The options for getting the accelerometer data
     * such as timeout.
     */
    Accelerometer.prototype.getCurrentAcceleration = function(successCallback, errorCallback, options) {
    	// If the acceleration is available then call success
    	// If the acceleration is not available then call error
    	
    	// Created for iPhone, Iphone passes back _accel obj litteral
    	if (typeof successCallback == "function") {
    		var accel = new Acceleration(_accel.x,_accel.y,_accel.z);
    		Accelerometer.lastAcceleration = accel;
    		successCallback(accel);
    	}
    }
    
    /**
     * Asynchronously aquires the acceleration repeatedly at a given interval.
     * @param {Function} successCallback The function to call each time the acceleration
     * data is available
     * @param {Function} errorCallback The function to call when there is an error 
     * getting the acceleration data.
     * @param {AccelerationOptions} options The options for getting the accelerometer data
     * such as timeout.
     */
    
    Accelerometer.prototype.watchAcceleration = function(successCallback, errorCallback, options) {
    	this.getCurrentAcceleration(successCallback, errorCallback, options);
    	// TODO: add the interval id to a list so we can clear all watches
     	var frequency = (options != undefined)? options.frequency : 10000;
    	return setInterval(function() {
    		navigator.accelerometer.getCurrentAcceleration(successCallback, errorCallback, options);
    	}, frequency);
    }
    
    /**
     * Clears the specified accelerometer watch.
     * @param {String} watchId The ID of the watch returned from #watchAcceleration.
     */
    Accelerometer.prototype.clearWatch = function(watchId) {
    	clearInterval(watchId);
    }
    
    PhoneGap.addConstructor(function() {
        if (typeof navigator.accelerometer == "undefined") navigator.accelerometer = new Accelerometer();
    });
    
    
    
    
    /**
     * This class provides access to the device media, interfaces to both sound and video
     * @constructor
     */
    function Media(src) {
    	this.src = src;
    }
    
    Media.prototype.play = function() {
    }
    
    Media.prototype.pause = function() {
    }
    
    Media.prototype.stop = function() {
    }
    
    
    /**
     * This class contains information about any Media errors.
     * @constructor
     */
    function MediaError() {
    	this.code = null,
    	this.message = "";
    }
    
    MediaError.MEDIA_ERR_ABORTED 		= 1;
    MediaError.MEDIA_ERR_NETWORK 		= 2;
    MediaError.MEDIA_ERR_DECODE 		= 3;
    MediaError.MEDIA_ERR_NONE_SUPPORTED = 4;
    
    
    //if (typeof navigator.audio == "undefined") navigator.audio = new Media(src);
    
    
    /**
     * This class provides access to the device camera.
     * @constructor
     */
    function Camera() {
    	
    }
    
    /**
     * 
     * @param {Function} successCallback
     * @param {Function} errorCallback
     * @param {Object} options
     */
    Camera.prototype.getPicture = function(successCallback, errorCallback, options) {
    	
    }
    
    PhoneGap.addConstructor(function() {
        if (typeof navigator.camera == "undefined") navigator.camera = new Camera();
    });
    
    
    
    /**
     * This class provides access to the device contacts.
     * @constructor
     */
    function Contact() {
    	this.name = "";
    	this.phone = "";
    	this.address = "";
    }
    
    /**
     * 
     * @param {Object} successCallback
     * @param {Object} errorCallback
     * @param {Object} options
     */
    Contact.prototype.get = function(successCallback, errorCallback, options) {
    	
    }
    
    
    function ContactManager() {
    	// Dummy object to hold array of contacts
    	this.contacts = [];
    	this.timestap = new Date().getTime();
    }
    
    ContactManager.prototype.get = function(successCallback, errorCallback, options) {
    	// Interface
    }
    
    PhoneGap.addConstructor(function() {
        if (typeof navigator.ContactManager == "undefined") navigator.ContactManager = new ContactManager();
    });
    
    
    
    /**
     * This class provides access to the debugging console.
     * @constructor
     */
    function Console() {
    }
    
    /**
     * Utility function for rendering and indenting strings, or serializing
     * objects to a string capable of being printed to the console.
     * @param {Object|String} message The string or object to convert to an indented string
     * @private
     */
    Console.prototype.processMessage = function(message) {
        if (typeof(message) != 'object') {
            return encodeURIComponent(message);
        } else {
            /**
             * @function
             * @ignore
             */
            function indent(str) {
                return str.replace(/^/mg, "    ");
            }
            /**
             * @function
             * @ignore
             */
            function makeStructured(obj) {
                var str = "";
                for (var i in obj) {
                    try {
                        if (typeof(obj[i]) == 'object') {
                            str += i + ":\n" + indent(makeStructured(obj[i])) + "\n";
                        } else {
                            str += i + " = " + indent(String(obj[i])).replace(/^    /, "") + "\n";
                        }
                    } catch(e) {
                        str += i + " = EXCEPTION: " + e.message + "\n";
                    }
                }
                return str;
            }
            return encodeURIComponent("Object:\n" + makeStructured(message));
        }
    };
    
    /**
     * Open a native alert dialog, with a customizable title and button text.
     * @param {String} message Message to print in the body of the alert
     * @param {String} [title="Alert"] Title of the alert dialog (default: Alert)
     * @param {String} [buttonLabel="OK"] Label of the close button (default: OK)
     */
    Console.prototype.alert = function(message, title, buttonLabel) {
        // Default is to use a browser alert; this will use "index.html" as the title though
        alert(message);
    };
    
    /**
     * Print a normal log message to the console
     * @param {Object|String} message Message or object to print to the console
     */
    Console.prototype.log = function(message) {
    };
    
    /**
     * Print an error message to the console
     * @param {Object|String} message Message or object to print to the console
     */
    Console.prototype.error = function(message) {
    };
    
    /**
     * Start spinning the activity indicator on the statusbar
     */
    Console.prototype.activityStart = function() {
    };
    
    /**
     * Stop spinning the activity indicator on the statusbar, if it's currently spinning
     */
    Console.prototype.activityStop = function() {
    };
    
    PhoneGap.addConstructor(function() {
        window.debug = new Console();
    });
    
    
    
    /**
     * This class provides generic read and write access to the mobile device file system.
     */
    function File() {
    	/**
    	 * The data of a file.
    	 */
    	this.data = "";
    	/**
    	 * The name of the file.
    	 */
    	this.name = "";
    }
    
    /**
     * Reads a file from the mobile device. This function is asyncronous.
     * @param {String} fileName The name (including the path) to the file on the mobile device. 
     * The file name will likely be device dependant.
     * @param {Function} successCallback The function to call when the file is successfully read.
     * @param {Function} errorCallback The function to call when there is an error reading the file from the device.
     */
    File.prototype.read = function(fileName, successCallback, errorCallback) {
    	
    }
    
    /**
     * Writes a file to the mobile device.
     * @param {File} file The file to write to the device.
     */
    File.prototype.write = function(file) {
    	
    }
    
    PhoneGap.addConstructor(function() {
        if (typeof navigator.file == "undefined") navigator.file = new File();
    });
    
    
    
    /**
     * This class provides access to device GPS data.
     * @constructor
     */
    function Geolocation() {
    	/**
    	 * The last known GPS position.
    	 */
    	this.lastPosition = null;
    }
    
    /**
     * Asynchronously aquires the current position.
     * @param {Function} successCallback The function to call when the position
     * data is available
     * @param {Function} errorCallback The function to call when there is an error 
     * getting the position data.
     * @param {PositionOptions} options The options for getting the position data
     * such as timeout.
     */
    Geolocation.prototype.getCurrentPosition = function(successCallback, errorCallback, options) {
    	// If the position is available then call success
    	// If the position is not available then call error
    }
    
    /**
     * Asynchronously aquires the position repeatedly at a given interval.
     * @param {Function} successCallback The function to call each time the position
     * data is available
     * @param {Function} errorCallback The function to call when there is an error 
     * getting the position data.
     * @param {PositionOptions} options The options for getting the position data
     * such as timeout and the frequency of the watch.
     */
    Geolocation.prototype.watchPosition = function(successCallback, errorCallback, options) {
    	// Invoke the appropriate callback with a new Position object every time the implementation 
    	// determines that the position of the hosting device has changed. 
    	
    	this.getCurrentPosition(successCallback, errorCallback, options);
    	var frequency = (options != undefined)? options.frequency : 10000;
    	
    	var that = this;
    	return setInterval(function() {
    		that.getCurrentPosition(successCallback, errorCallback, options);
    		//navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    	}, frequency);
    }
    
    
    /**
     * Clears the specified position watch.
     * @param {String} watchId The ID of the watch returned from #watchPosition.
     */
    Geolocation.prototype.clearWatch = function(watchId) {
    	clearInterval(watchId);
    }
    
    PhoneGap.addConstructor(function() {
        if (typeof navigator.geolocation == "undefined") navigator.geolocation = new Geolocation();
    });
    
    
    
    
    
    
    /**
     * This class provides access to native mapping applications on the device.
     */
    function Map() {
    	
    }
    
    /**
     * Shows a native map on the device with pins at the given positions.
     * @param {Array} positions
     */
    Map.prototype.show = function(positions) {
    	
    }
    
    PhoneGap.addConstructor(function() {
        if (typeof navigator.map == "undefined") navigator.map = new Map();
    });
    
    
    
    /**
     * This class provides access to notifications on the device.
     */
    function Notification() {
    	
    }
    
    /**
     * Causes the device to blink a status LED.
     * @param {Integer} count The number of blinks.
     * @param {String} colour The colour of the light.
     */
    Notification.prototype.blink = function(count, colour) {
    	
    }
    
    /**
     * Causes the device to vibrate.
     * @param {Integer} mills The number of milliseconds to vibrate for.
     */
    Notification.prototype.vibrate = function(mills) {
    	
    }
    
    /**
     * Causes the device to beep.
     * @param {Integer} count The number of beeps.
     * @param {Integer} volume The volume of the beep.
     */
    Notification.prototype.beep = function(count, volume) {
    	
    }
    
    // TODO: of course on Blackberry and Android there notifications in the UI as well
    
    PhoneGap.addConstructor(function() {
        if (typeof navigator.notification == "undefined") navigator.notification = new Notification();
    });
    
    
    
    /**
     * This class provides access to the device orientation.
     * @constructor
     */
    function Orientation() {
    	/**
    	 * The last known orientation.
    	 */
    	this.lastOrientation = null;
    }
    
    /**
     * Asynchronously aquires the current orientation.
     * @param {Function} successCallback The function to call when the orientation
     * is known.
     * @param {Function} errorCallback The function to call when there is an error 
     * getting the orientation.
     */
    Orientation.prototype.getCurrentOrientation = function(successCallback, errorCallback) {
    	// If the position is available then call success
    	// If the position is not available then call error
    }
    
    /**
     * Asynchronously aquires the orientation repeatedly at a given interval.
     * @param {Function} successCallback The function to call each time the orientation
     * data is available.
     * @param {Function} errorCallback The function to call when there is an error 
     * getting the orientation data.
     */
    Orientation.prototype.watchOrientation = function(successCallback, errorCallback) {
    	// Invoke the appropriate callback with a new Position object every time the implementation 
    	// determines that the position of the hosting device has changed. 
    	this.getCurrentPosition(successCallback, errorCallback);
    	return setInterval(function() {
    		navigator.orientation.getCurrentOrientation(successCallback, errorCallback);
    	}, 10000);
    }
    
    /**
     * Clears the specified orientation watch.
     * @param {String} watchId The ID of the watch returned from #watchOrientation.
     */
    Orientation.prototype.clearWatch = function(watchId) {
    	clearInterval(watchId);
    }
    
    PhoneGap.addConstructor(function() {
        if (typeof navigator.orientation == "undefined") navigator.orientation = new Orientation();
    });
    
    
    
    /**
     * This class contains position information.
     * @param {Object} lat
     * @param {Object} lng
     * @param {Object} acc
     * @param {Object} alt
     * @param {Object} altacc
     * @param {Object} head
     * @param {Object} vel
     * @constructor
     */
    function Position(lat, lng, acc, alt, altacc, head, vel) {
    	/**
    	 * The latitude of the position.
    	 */
    	this.latitude = lat;
    	/**
    	 * The longitude of the position,
    	 */
    	this.longitude = lng;
    	/**
    	 * The accuracy of the position.
    	 */
    	this.accuracy = acc;
    	/**
    	 * The altitude of the position.
    	 */
    	this.altitude = alt;
    	/**
    	 * The altitude accuracy of the position.
    	 */
    	this.altitudeAccuracy = altacc;
    	/**
    	 * The direction the device is moving at the position.
    	 */
    	this.heading = head;
    	/**
    	 * The velocity with which the device is moving at the position.
    	 */
    	this.velocity = vel;
    	/**
    	 * The time that the position was obtained.
    	 */
    	this.timestamp = new Date().getTime();
    }
    
    /**
     * This class specifies the options for requesting position data.
     * @constructor
     */
    function PositionOptions() {
    	/**
    	 * Specifies the desired position accuracy.
    	 */
    	this.enableHighAccuracy = true;
    	/**
    	 * The timeout after which if position data cannot be obtained the errorCallback
    	 * is called.
    	 */
    	this.timeout = 10000;
    }
    
    /**
     * This class contains information about any GSP errors.
     * @constructor
     */
    function PositionError() {
    	this.code = null;
    	this.message = "";
    }
    
    PositionError.UNKNOWN_ERROR = 0;
    PositionError.PERMISSION_DENIED = 1;
    PositionError.POSITION_UNAVAILABLE = 2;
    PositionError.TIMEOUT = 3;
    
    
    
    /**
     * This class provides access to the device SMS functionality.
     * @constructor
     */
    function Sms() {
    
    }
    
    /**
     * Sends an SMS message.
     * @param {Integer} number The phone number to send the message to.
     * @param {String} message The contents of the SMS message to send.
     * @param {Function} successCallback The function to call when the SMS message is sent.
     * @param {Function} errorCallback The function to call when there is an error sending the SMS message.
     * @param {PositionOptions} options The options for accessing the GPS location such as timeout and accuracy.
     */
    Sms.prototype.send = function(number, message, successCallback, errorCallback, options) {
    	
    }
    
    PhoneGap.addConstructor(function() {
        if (typeof navigator.sms == "undefined") navigator.sms = new Sms();
    });
    
    
    
    /**
     * This class provides access to the telephony features of the device.
     * @constructor
     */
    function Telephony() {
    	
    }
    
    /**
     * Calls the specifed number.
     * @param {Integer} number The number to be called.
     */
    Telephony.prototype.call = function(number) {
    	
    }
    
    PhoneGap.addConstructor(function() {
        if (typeof navigator.telephony == "undefined") navigator.telephony = new Telephony();
    });
    
    
