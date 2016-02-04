//     Backbone.BaseView 0.8.3

//     (c) 2014 James Ballantine, 1stdibs.com Inc.
//     Backbone.BaseView may be freely distributed under the MIT license.
//     For all details and documentation:
//     https://github.com/1stdibs/backbone-base-and-form-view

(function (root) {
    'use strict';

    var Backbone = root.Backbone;
    var _ = root._;

    if (typeof module !== 'undefined') {
        _ = require('underscore');
        root = root || {};
        root.Backbone = Backbone = require('backbone');
        module.exports = Backbone;
    }

    // Finds globally dot noted namespaced objects from a string
    var _stringToObj = function (str) {
        var arr = str.split('.');
        var obj = root[arr.shift()];

        while (arr.length && obj) {
            obj = obj[arr.shift()];
        }
        return obj;
    };
    var slice = Array.prototype.slice;
    var result = _.result;
    var each = _.each;
    var isFunction = _.isFunction;
    var isObject = _.isObject;
    var isArray = _.isArray;
    var View = Backbone.View;
    var BaseView;

    /**
     * Local constructor intended for use by {@link Backbone.BaseView}. Creates an object specifically
     * for manipulating subviews. Is created automatically by the BaseView instance and accessed through the
     * '.subs' property of the the instance.
     * @constructor SubViewManager
     * @class SubViewManager
     * @type {SubViewManager}
     * @param {object} subViewCfg An object with a configuration to add for subviews (see addConfig(map))
     * @param {Backbone.BaseView} parent The parent BaseView instance
     * @param [options]
     */
    var SubViewManager = function (subViewCfg, parent, options) {
        this.config = {}; // Refers to configuration (construct, options)
        this.clear(true);
        this.parent = parent; // Should refer to parent BaseView instance

        // Set the options
        this.options = options || {};
        // Auto initialize a subview when config added
        this.autoInitSingletons = !!this.options.autoInitSingletons;
        // If true, then new subview configs and types will default to being singletons
        this.defaultToSingletons = this.options.defaultToSingletons;
        // Allow dot notation in 'get' method (if your config keys have dots, then set this to false)
        this.dotNotation = (this.options.dotNotation !== undefined) ? this.options.dotNotation : true;

        if (subViewCfg) {
            this.addConfig(subViewCfg);
        }
    };

    SubViewManager.prototype = {
       /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @class SubViewManager
         * @type {SubViewManager}
         * @method add
         * @param {Object} map
         *      An object with key's to refer to subViews and values that
         *      are View instances, options to pass to the constructor, or
         *      an array of either the previous two to add multiple subViews.
         *      If you pass options or an array of options, the SubViewManager
         *      will look for a configuration matching the key for these options
         *      and will initialize subviews based on the config, passing options
         *      to the constructor.
         * @param {Boolean} [singleton]
         *      True if the instances mapped to the keys should be singletons.
         *      If you pass options, the singleton param will be ignored.
         * @return {SubViewManager}
         */
        /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method add
         * @param {String} name
         *      A string key to refer to the subViews with. Should match
         *      a key in the subView configuration. If not, a configuration
         *      will be set up with default values based on the instance
         *      passed.
         * @param {Backbone.View[]|object[]} arr
         *      An array of View instances or options. Instances will be
         *      appropriately associated with the key, options will be
         *      used to instantiate a subView based on the configuration
         *      matching the key
         * @param {Boolean} [singleton]
         *      True if the added views should be singletons
         * @return {SubViewManager}
         */
        /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method add
         * @param {Backbone.View[]} arr
         *      An array of View instances. These will not be accessible
         *      by a type or key
         * @return {SubViewManager}
         */
        /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method add
         * @param {String} name
         *      A string key to refer to the subView with
         * @param {Backbone.View} instance
         *      A View instance
         * @param {Object} [singleton]
         *      If you want the view matching this key to be a singleton
         * @return {SubViewManager}
         */
        /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method add
         * @param {String} name
         *      A string key to refer to the subView with. Without an instance
         *      as the second param, this variant requires that a configuration
         *      to have been specified matching the 'name' with a constructor to
         *      initialize.
         * @param {Object} [options]
         *      An object that will be passed as the options parameter to the
         *      view on initialization.
         * @return {SubViewManager}
         */
        /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method add
         * @param {Backbone.View} instance
         *      A Backbone.View instance to add as the subview
         * @return {SubViewManager}
         */
        add: function (name, instance, singleton) {
            var arr = (isArray(name)) ? name : (isArray(instance)) ? instance : undefined; // If its a simple array of subviews or configs
            var map = (!arr && isObject(name) && name instanceof View === false) ? name : undefined; // If its a mapping of subviews
            var viewOptions = (!arr && instance instanceof View === false) ? instance : undefined;
            var key;
            var i;
            var len;

            if (map) {
                singleton = (typeof instance === 'boolean') ? instance : undefined;
                for (key in map) {
                    if (map.hasOwnProperty(key)) {
                        map[key] = (isArray(map[key])) ? map[key] : [map[key]];
                        len = map[key].length;
                        if (len && map[key][0] instanceof View) {
                            this._addInstance(key, map[key], singleton);
                        } else {
                            i = -1;
                            while (++i < len) {
                                this._init(key, map[key][i], singleton);
                            }
                        }
                    }
                }
                return this;
            }

            instance = (name instanceof View) ? name : instance;
            name = (typeof name === 'string' || typeof name === "number") ? name : undefined;
            singleton = (typeof singleton === 'boolean') ? singleton :
                    (!name && typeof instance === 'boolean') ? instance : undefined;

            if (viewOptions) {
                this._init(name, viewOptions, singleton);
                return this;
            }

            if (arr && (len = arr.length)) { //eslint-disable-line no-cond-assign
                if (arr[0] instanceof View) {
                    this._addInstance(name, arr, singleton);
                } else {
                    i = -1;
                    while (++i < len) {
                        this._init(name, arr[i], singleton);
                    }
                }

                return this;
            }

            if (instance) {
                this._addInstance(name, instance, singleton);
            } else if (name) {
                this._init(name, singleton);
            }
            return this;
        },
        /**
         * Add a subview instance. If is has a config,
         * the instance will be associated with that
         * config. If the config specifies that the
         * view is a singleton an a view for that
         * key already exists, it will not be added.
         * @param {string|number} key
         * @param {Backbone.View} instance
         */
        /**
         * Add a subview instance, without a key.
         * Since it doesn't have a key, it will
         * simply be added to the subViews array.
         * @param {Backbone.View} instance
         */
        addInstance: function (key, instance) {
            if (key instanceof View) {
                instance = key;
                key = undefined;
            }
            this._addInstance(key, instance);
            return this;
        },
        /**
         * Add a subview for each view instance in
         * an array for a particular key
         * @memberOf SubViewManager#
         * @param {string} key
         * @param {Backbone.View[]} instances
         * @return {SubViewManager}
         */
        /**
         * Add a subview for each view instance in
         * an array. They will not be associated
         * with a key and will be only accessible
         * through the subViews array.
         * @memberOf SubViewManager#
         * @param {Backbone.View[]} instances
         * @return {SubViewManager}
         */
        addInstances: function (key, instances) {
            if (isArray(key)) {
                instances = key;
                key = undefined;
            }
            var i = -1;
            var len = instances.length;
            while (++i < len) {
                this._addInstance(key, instances[i]);
            }
            return this;
        },
        /**
         * Add instances using an object that
         * maps subview keys to the instances
         * @param {object} map
         * @return {SubViewManager}
         */
        addInstancesWithMap: function (map) {
            var key;
            for (key in map) {
                if (map.hasOwnProperty(key)) {
                    this.addInstance(key, map[key]);
                }
            }
            return this;
        },
        /**
         * Instantiates a view from it's config
         * and adds additional options.
         * @memberOf SubViewManager#
         * @param  {String} key
         * @param  {object} options
         * @return {Backbone.View}
         *         The new view instance
         */
        create: function (key, options) {
            return this._init(key, options);
        },
        /**
         * Given an array of keys, a subview
         * will be instantiated for each key
         * based on the configuration for that
         * key. The options param will be
         * passed to each view on instantiation
         * as additional options.
         *
         * @memberOf SubViewManager#
         * @param {String[]} keys
         * @param {Object} options
         *        Additional options to pass
         *        to each view on init
         * @return {Backbone.View[]}
         *        Array of newly created subviews
         */
        createFromKeys: function (keys, options) {
            var views = [];
            var len = keys.length;
            var i = -1;
            while (++i < len) {
                views.push(this._init(keys[i], options));
            }
            return views;
        },
        /**
         * Instantiate all singletons defined in the
         * config.
         * @param  {object} options Additional options
         * @return {SubViewManager}
         */
        createSingletons: function (options) {
            var key;
            for (key in this.config) {
                if (this.config.hasOwnProperty(key) && this.config[key].singleton) {
                    this._init(key, options);
                }
            }
            return this;
        },
        /**
         * Create subviews with a map of configured
         * subview keys to additional options.
         * @param  {object} map
         * @return {SubViewManager}
         */
        createWithMap: function (map) {
            var key;
            for (key in map) {
                if (map.hasOwnProperty(key)) {
                    this._init(key, map[key]);
                }
            }
            return this;
        },
        /**
         * Set a singleton instance if a singleton
         * for that instance has not already been
         * set. Remove the singleton first if you
         * want to set a new instance.
         * @param {String} key
         * @param {Backbone.View} instance
         * @return {SubViewManager}
         */
        setSingleton: function (key, instance) {
            this._addInstance(key, instance, true);
            return this;
        },
        /**
         * Remove a singleton if it exists and then
         * set a new instnce in it's place.
         * @param  {String} key
         * @param  {Backbone.View} instance
         * @return {SubViewManager}
         */
        overrideSingleton: function (key, instance) {
            this.remove(key);
            return this.setSingleton(key, instance);
        },
        /**
         * Add an configuration for a subview to the SubViewManager.
         * It can be instantiated later with the add function.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @class
         * @method addConfig
         * @param {String} name
         *      The name or type that you would like use to refer to subViews
         *      created with this config
         * @param {String|Function} construct
         *      The constructor function for this subView. If its a string, the
         *      string must resolve to a global name-spaced function in dot notation.
         *      (e.g. 'Backbone.imageUpload.View')
         * @param {String} [options]
         *      The options or base options you would like to pass to the constructor
         *      whenever it is initialized.
         * @param {String|HTMLElement} [location]
         *      If you want to be able to automatically place a subView's DOM element
         *      somewhere in the parent view, pass a selector or DOM element or $ instance
         *      here that can be used by jquery as a wrapper to append the subView $el
         * @param {Boolean} [singleton]
         *      If you want this view to be a singleton subView. A singleton subView
         *      will only allow one instance of it to be created.
         * @return {SubViewManager}
         */
        /**
         * Add an configuration for a subview to the SubViewManager.
         * It can be instantiated later with the add function.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method addConfig
         * @param {Object} map
         *      A object of key names/types to config objects, so you can add multiple configs
         * @example
         * // A config object should have the following format:
         *      {
         *          construct:  // Constructor function or string version (i.e. "Backbone.BaseView")
         *          options:    // Any options you want to pass to the initialize function
         *          singleton:  // if the object should be configured as a singleton or not
         *          location:   // A string or jQuery instance in the parent view element. Or
         *                      // a function that returns one of these. The subview el will
         *                      // be appended to that location
         *      }
         * @return {SubViewManager}
         */
        /**
         * Add an configuration for a subview to the SubViewManager.
         * It can be instantiated later with the add function.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method addConfig
         * @param {String} name
         *      The name or type that you would like use to refer to subViews
         *      created with this config
         * @param {Object} config
         *      The configuration object (uses the format described above)
         * @return {SubViewManager}
         */
        addConfig : function (name, config) {
            var map = (isObject(name) && !isArray(name)) ? name : false;
            if (map) {
                each(map, this._addConfig, this);
                return this;
            }

            return this._addConfig(config, name);
        },
        /**
         * Render all Subviews.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {object} [options]
         *      [options.appendTo] A selector, HTMLElement, or $ instance to append the subViews to
         *      [options.useLocation=false]
         *          True if you want to append the subviews to the locations in their config if they
         *          have one.
         *      [options.clearLocations=false]
         *          True if you want to use empty on the configured locations
         *
         * @return {SubViewManager}
         */
        render: function (options) {
            options = options || {};
            var location = options.appendTo || options.useLocation;
            return this._render(this.subViews, location, options.clearLocations);
        },
        /**
         * Renders subviews and appends them to their 'locations' if they have one.
         * If you pass a appendTo param, views are appended to that location instead.
         * This is just a shortcut version of renderAppend({})
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {string|HTMLElement|$} [appendTo]
         *        Location to append the rendered subiews to
         * @param {object} [options]
         * @param {boolean} [options.clearLocations=false] Clear configured locations of subviews before rendering
         * @return {SubViewManager}
         */
        renderAppend: function (appendTo, options) {
            options = options || {};
            if (isObject(appendTo) && appendTo instanceof Backbone.$ === false && !_.isElement(appendTo)) {
                options = appendTo;
                appendTo = options.appendTo;
            }
            return this._render(this.subViews, appendTo || true, options.clearLocations);
        },
        /**
         * Render a subView specified by a key (from their configuration key). The key will
         * retrieve subViews by looking for a type and then looking for singletons or
         * specific instance using the Model/View cid
         *
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         *
         * @param {String|Backbone.Model|Backbone.View} key
         *      A key, type, View/Model cid, Model, or View to refer to a specific subView
         *      or subViews. For example, passing the view cid 'view4' will render only
         *      the view with that cid, and passing the type 'creatorNames' will render
         *      views matching the type 'creatorNames'.
         * @param {object} [options]
         * @param {string|$|HTMLElement} [options.appendTo] Element or selector to append subview(s) to
         * @param {boolean} [options.useLocation=false] Append subviews to locations specified in config
         * @param {boolean} [options.clearLocations=false] Clear configured locations of subviews before rendering
         *
         * @return {SubViewManager}
         */
        renderByKey: function (key, options) {
            var subViews = this.getByType(key) || this.get(key);
            if (!isArray(subViews)) { subViews = [subViews]; }
            options = options || {};
            return this._render(subViews, options.appendTo || options.useLocation, options.clearLocations);
        },
        /**
         * Returns a new SubViewManager instance with filtered list of subviews.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {string|Backbone.View[]|function} key
         *      The key or type used to refer to a subview or subviews, or a list
         *      of subViews with a type found in this SubViewManager config, or a function
         *      that will iterate over the subviews and return true if a subview
         *      should be included in the filtered SubViewManager instance.
         * @return {SubViewManager}
         */
        filteredSubs: function (key) {
            var i = -1;
            var len;
            var subViews;
            var subMgr = new SubViewManager(null, this.parent, this.options);
            subMgr.config = this.config;
            subViews = (isArray(key)) ? key : (isFunction(key)) ? this.filter(key) : this.getByType(key);
            len = subViews.length;
            while (++i < len) {
                subMgr.add(subViews[i]._subviewtype, subViews[i]);
            }
            return subMgr;
        },
        /**
         * Iterate through every subView, calling a function or invoking a method on
         * each of them. If a subView has it's own subViews, then it will recursively
         * iterate over those as well. The context is switched to the subView calling
         * the function/method.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {String|Function} func
         *        A string name of a method to call in the subviews or a function that
         *        will be called for each view
         * @param {Array} [args] An array of arguments to pass to the method/function
         * @return {SubViewManager}
         */
        descend: function (func, args) {
            var isFunc = isFunction(func);
            var desc = function (subViews) {
                var i = -1;
                var len = subViews.length;
                var subView;
                var _func;
                while (++i < len) {
                    subView = subViews[i];
                    _func = isFunc ? func : subView[func];
                    if (_func) {
                        if (args) { _func.apply(subView, args);
                        } else { _func.call(subViews[i]); }
                    }
                    if (subView.subViews && subView.subViews.length) {
                        desc(subView.subViews);
                    }
                }
            };
            desc(this.subViews);
            return this;
        },
        /**
         * Clears all subViews and subView data off of the SubViewManager instance
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {Boolean} [preserveElems] If true, view $els are left on the DOM
         * @param {Boolean} [clearConfigs] If true, resets the subView configs as well
         * @return {SubViewManager}
         */
        clear: function (preserveElems, clearConfigs) {
            if (!preserveElems) {
                this.removeElems();
            }
            this.subViews = [];
            if (this.parent && this.parent.subViews) {
                this.parent.subViews = this.subViews;
            }
            this._subViewsByType = {};
            this._subViewSingletons = {};
            this._subViewsByCid = {};
            this._subViewsByModelCid = {};
            if (clearConfigs) {
                this.config = {};
            }
            return this;
        },
        /**
         * Remove a subView
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {String|Backbone.View|Backbone.Model} key
         * @param {Boolean} [preserveElems] If true, the View's element will not be removed from the DOM
         * @return {SubViewManager}
         */
        remove: function (key, preserveElems) {
            var subViews = (key && (typeof key === "string" || key.cid)) ? this.get(key) : key;
            var len;
            if (!subViews) { return this; }
            if (!isArray(subViews)) {
                subViews = [subViews];
            }
            len = subViews ? subViews.length : 0;
            if (!preserveElems) {
                this.removeElems(subViews);
            }
            if (len) {
                this.trigger('remove', subViews);
            }
            while (subViews && subViews.length) {
                this._remove(subViews.shift());
            }
            return this;
        },
        /**
         * Remove's all subviews matching any
         * key in a list of keys
         * @memberOf SubViewManager#
         * @param  {String[]} keys
         * @param {Boolean} [preserveElems=false]
         *        If true, the views' elements will not
         *        be removed from the DOM
         * @return {SubViewManager}
         */
        removeByKeys: function (keys, preserveElems) {
            var i = 0;
            var len = keys ? keys.length : 0;
            for (i; i < len; i++) {
                this.remove(keys[i], preserveElems);
            }
            return this;
        },
        /**
         * Removes all subView '.el' element from the dom, or if passed a
         * list of subViews, removes only the elements in those.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {Backbone.View[]} subViews
         * @return {SubViewManager}
         */
        removeElems: function (subViews) {
            subViews = subViews || this.subViews;

            var i = -1;
            var len = subViews.length;
            while (++i < len) {
                subViews[i].remove();
            }
            return this;
        },
        /**
         * Shortcut method to invoke jQuery's detach function
         * on each of the '.$el' elements for each of the
         * subviews, or if an array of subViews is passed,
         * on each of those. Useful if you want to re-render
         * a parent view and want to prevent subviews from
         * losing their events and other data that is removed
         * when jQuery 'remove' is called on that element.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {Backbone.View[]} subViews
         * @return {SubViewManager}
         */
        detachElems: function (subViews) {
            subViews = subViews || this.subViews;

            var i = -1;
            var len = subViews.length;
            while (++i < len) {
                subViews[i].$el.detach();
            }
            return this;
        },
        /**
         * Get a subView instance or an array if multiple instances
         * match your key.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {Object|String} [key]
         *      The key to a subView singleton, the view's cid
         *      the associated model cid, the associated model itself,
         *      or the associated view itself. If your key is a
         *      string, you can use
         * @return {Backbone.View|Backbone.View[]}
         */
        get : function (key) {
            if (key.cid) {
                return this._subViewsByCid[key.cid] || this._subViewsByModelCid[key.cid];
            }
            if (key.indexOf('.') > -1 && this.dotNotation) {
                var segs = key.split('.');
                var view = this.parent;
                while (segs.length && view) { view = view.subs.get(segs.shift()); }
                return view;
            }

            return this._subViewSingletons[key] || this._subViewsByCid[key] ||
                this._subViewsByModelCid[key] || this._subViewsByType[key];
        },
        /**
         * Returns all views that match a type key, guarantees an array.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {String} type
         * @return {Backbone.View[]}
         */
        getByType : function (type) {
            if (this._subViewsByType[type]) {
                return this._subViewsByType[type];
            }
            return (this._subViewSingletons[type]) ? [this._subViewSingletons[type]] : [];
        },
        /**
         * Get the subviews type or key
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param subview
         * @return {String|Number}
         */
        getSubViewType : function (subview) {
            subview = (subview instanceof View === true) ? subview : this.get(subview);
            return subview._subviewtype;
        },
        /**
         * Get the subview at a specific index, based on the order
         * that the subViews were added or a custom sorted order.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param  {Number} index The index of the sub view
         * @return {Backbone.View}
         */
        at: function (index) {
            return this.subViews[index];
        },
        /**
         * Clears the html in all locations specified in the subview configs
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @return {SubViewManager}
         */
        clearLocations : function (type) {
            var confs = type ? _.pick(this.config, type) : this.config;
            each(confs, function (config) {
                this.parent.$(config.location).html('');
            }, this);
            return this;
        },
        /**
         * Set a location for a subview type
         * @memberOf SubViewManager#
         * @param {string} type The subview type
         * @param {$|HTMLElement|String} location
         *        A location within the parent view
         *        to place the subview in
         * @return {SubViewManager}
         */
        setLocationForType: function (type, location) {
            this._addConfig({ location: location }, type);
            return this;
        },
        /**
         * Generate a location selector for each configured
         * subview type. Each subview type will have a
         * location set based on the subview type. For
         * example,the subview type 'header' would get the
         * type '.header-container' (using the default
         * suffix).
         * @memberOf SubViewManager#
         * @param  {string} [suffix=-container]
         *         The suffix to use for each location
         *         selector.
         * @return {SubViewManager}
         */
        useDefaultLocationSelectors: function (suffix) {
            var type;
            suffix = _.isString(suffix) ? suffix : '-container';
            for (type in this.config) {
                if (this.config.hasOwnProperty(type) && !this.config[type].location) {
                    this.setLocationForType(type, '.' + type + suffix);
                }
            }
            return this;
        },
        _render : function (subViews, place, clearLocations) {
            var $appendTo;
            var i = -1;
            var location;
            var $locations = {};
            if (place !== true) {
                $appendTo = place;
            }
            if (clearLocations) {
                this.clearLocations();
            }

            while (++i < subViews.length) {
                subViews[i].render();
                if ($appendTo) {
                    subViews[i].$el.appendTo((typeof $appendTo === 'string') ? this.parent.$($appendTo).first() : $appendTo);
                } else if (place && (location = this.config[this.getSubViewType(subViews[i])].location)) { //eslint-disable-line no-cond-assign
                    if (typeof location === 'string') {
                        if (!$locations[location]) {
                            $locations[location] = this.parent.$(location).first();
                        }
                        location = $locations[location];
                    } else if (typeof location === 'function') {
                        location = location.call(subViews[i]);
                        if (!(location instanceof Backbone.$)) { throw new Error('location function must return instance of jQuery'); }
                    }
                    location.append(subViews[i].el);
                }
            }
            return this;
        },
        _addInstance : function (key, subViews, singleton) {
            var i = -1;
            var len;
            var self = this;

            key = key || '_svid_' + _.size(this.config);

            if (self._subViewSingletons[key]) { return self; }

            if (!isArray(subViews)) {
                subViews = [subViews];
            }

            len = subViews.length;

            if (!self.config[key]) {
                self.config[key] = { singleton: singleton };
            }

            if (!self.config[key].construct && subViews[0].constructor) {
                self.config[key].construct = subViews[0].constructor;
            }

            singleton = (singleton === undefined) ? self.config[key].singleton : singleton;

            while (++i < len) {
                self._setInst(key, subViews[i], singleton);
            }
            return self;
        },
        _addConfig : function (config, name) {
            if (!config || !name) {
                return this;
            }
            this.config[name] = _.extend(this.config[name] || {}, config);
            if (typeof this.config[name].singleton !== "boolean") {
                this.config[name].singleton = this.defaultToSingletons;
            }
            if (this.autoInitSingletons && this.config[name].singleton) {
                return this._init(name);
            }
            return this;
        },
        _remove : function (subView, silent) {
            var i = -1;
            var len = this.subViews.length;
            var key = this.getSubViewType(subView);
            var typeList = this.getByType(key);

            while (++i < len) {
                if (this.subViews[i].cid === subView.cid) {
                    this.subViews.splice(i, 1);
                    break;
                }
            }
            len = typeList ? typeList.length : 0;
            if (!this._subViewSingletons[key] && len) {
                for (i = 0; i < len; i++) {
                    if (typeList[i].cid === subView.cid) {
                        typeList.splice(i, 1);
                        break;
                    }
                }
            }

            delete this._subViewsByCid[subView.cid];
            if (subView.model && subView.model.cid && this._subViewsByModelCid[subView.model.cid]) {
                delete this._subViewsByModelCid[subView.model.cid];
            }

            if (this._subViewSingletons[key]) {
                delete this._subViewSingletons[key];
            }
            if (!silent) {
                this.trigger('remove:' + key, subView);
            }
        },
        _setInst: function (key, instance, singleton, silent) {
            var modCid = (instance.model) ? instance.model.cid : null;
            var viewsByModel = this._subViewsByModelCid;

            this.subViews.push(instance);
            this._subViewsByCid[instance.cid] = instance;
            if (!instance.parentView) { instance.parentView = this.parent; }
            instance._subviewtype = key;
            if (modCid) {
                if (viewsByModel[modCid]) {
                    if (!isArray(viewsByModel[modCid])) { viewsByModel[modCid] = [viewsByModel[modCid]]; }
                    viewsByModel[modCid].push(instance);
                } else {
                    this._subViewsByModelCid[modCid] = instance;
                }
            }

            singleton = (typeof singleton === 'boolean') ? singleton : this.defaultToSingletons;
            if (singleton) {
                this._subViewSingletons[key] = instance;
            } else {
                if (!this._subViewsByType[key]) { this._subViewsByType[key] = []; }
                this._subViewsByType[key].push(instance);
            }
            this.newest = instance;
            if (!silent) {
                return this.trigger('add', instance).trigger('add:' + key, instance);
            }
            return this;
        },
        _init: function (key, options, singleton) {
            var instance;
            var config = this.config[key];
            var Construct = (config && config.construct) ? config.construct : null;

            if (this._subViewSingletons[key]) {
                return undefined;
            }

            options = _.extend({}, config.options || {}, options || {});

            Construct = (typeof Construct === 'string') ? _stringToObj(Construct) : Construct;
            if (!Construct) {
                console.error('Construct for key "' + key + '" was not found:', config ? config.construct : '');
                return undefined;
            }
            instance = new Construct(options, this.parent);
            this._setInst(key, instance, (singleton !== undefined) ? singleton : config.singleton);
            return instance;
        }
    };

    // Add underscore methods to SubViewManager (e.g. myView.subs.each(function (subView) { console.log(subView.cid); });)
    each([
        'each', 'map', 'initial', 'rest', 'last', 'first', 'find', 'filter', 'sortBy',
        'groupBy', 'where', 'findWhere', 'some', 'every', 'invoke', 'contains', 'max', 'min',
        'size', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'reject'
    ], function (funcName) {
        /**
         * Partial applications of underscore (or lodash if you use that instead) functions
         * of the same name (operates on the subViews array).
         * List of available underscore methods:
         * 'each', 'map', 'initial', 'rest', 'last', 'first', 'find', 'filter', 'sortBy',
         * 'groupBy', 'where', 'findWhere', 'some', 'every', 'invoke', 'contains', 'max', 'min',
         * 'size', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'reject'
         * @method underscore_methods
         * @memberOf SubViewManager#
         * @see http://underscorejs.org
         * @example
         * myBaseView.subs.each(function (subView) {
         *     console.log('A subView of myBaseView', subView);
         * });
         * @example
         * var view = myBaseView.subs.findWhere({ collection : testCollection });
         * view.collection === test.collection // returns true
         */
        SubViewManager.prototype[funcName] = function () {
            return _[funcName].apply(this, [this.subViews].concat(slice.call(arguments)));
        };
    });

    // Add Backbone.Events functionality to SubView manager instances
    _.extend(SubViewManager.prototype, Backbone.Events);


    // =====================================================
    // BaseView.marinate

    var marinate;
    var _randZeroPadding = 1000000000;
    var getFunc = function (obj, func) {
        if (typeof func === 'function') {
            return func;
        }
        if (typeof func === 'string') {
            return obj[func];
        }
        return undefined;
    };
    var addEventNamespace = function (eventKey, namespace) {
        var splitKey = eventKey.split(' ');
        eventKey = splitKey[0] + ('.' + namespace);
        eventKey += (splitKey[1] ? ' ' + splitKey[1] : '');
        return eventKey;
    };
    var _addEvents = function (view, name, eventsObj) {
        var key;
        var val;
        var areNamespaced = false;
        view.addedEvents = view.addedEvents || {};
        if (typeof name !== 'string') {
            eventsObj = name;
            name = false;
        }
        for (key in eventsObj) {
            if (eventsObj.hasOwnProperty(key)) {
                val = eventsObj[key];
                areNamespaced = (!_.isString(val) && !_.isFunction(val));
                break;
            }
        }
        if (areNamespaced) {
            _.extend(view.addedEvents, eventsObj);
        } else {
            view.addedEvents[name || _.size(view.addedEvents)] = eventsObj;
        }
        return view;
    };
    var _marinate = function (view, args) {
        _.each(args, function (mixin) {
            if (mixin.addedEvents) {
                _addEvents(view, mixin.addedEvents);
            }
            _.extend(view, _.omit(mixin, 'addedEvents'));
        });
        return view;
    };


    // =====================================================
    // Backbone.BaseView

    /**
     * Adds some additional functionality to Backbone Views. Namely,
     * in the form of subView management. Access info and methods
     * to manipulate the '.subs' property.
     * @constructor Backbone.BaseView
     * @augments {Backbone.View}
     * @class Backbone.BaseView
     * @property subViews {Backbone.View[]} - Reference array of subViews generated by the '.subs' {@link SubViewManager}
     * @property subs {SubViewManager} - object specifically for manipulating subviews
     * @property subViewConfig      - A config map that can be automatically passed to the SubViewManager
     * @property autoInitSubViews   - any subviews that are singletons will be autoinitilized if true
     * @property singletonSubViews  - If subviews should default to being singletons when created
     * @property parentView         - if this is a subView of another dibLibs.BaseView, this will be a ref to that view instance
     */
    BaseView = View.extend({
        subViews: null,
        subs: null,
        // SubView Configuration Object
        // <key> : {
        //      construct: // Constructor function or string version (i.e. "Backbone.BaseView")
        //      options: // Any options you want to pass to the initialize function
        //      singleton: // if the object should be configured as a singleton or not
        //      location: // Useful for automatically placing the subviews element in it's parent
        //  }
        subViewConfig: null,
        // Any subviews that are singletons will be auto initialized if the below is true
        autoInitSubViews: false,
        // True if your subviews should default to singleton or not
        singletonSubViews: false,
        // If this is a subView of another Backbone.BaseView, this will be a ref to that view instance
        parentView: null,
        constructor: function (options, parentView) {
            var subViewCfg = (options && options.subViewConfig) ? options.subViewConfig : this.subViewConfig;
            subViewCfg = (isFunction(subViewCfg)) ? subViewCfg.call(this) : subViewCfg;
            // Assign a parentView if second param is a Backbone View
            this.parentView = (parentView instanceof View) ? parentView : null;
            this.subs = new SubViewManager(null, this, {
                autoInitSingletons: this.autoInitSubViews,
                defaultToSingletons: this.singletonSubViews
            });
            if (subViewCfg) {
                this.subs.addConfig(subViewCfg);
            }
            this.subViews = this.subs.subViews;
            // Add events that will not bubble events up app the view's ancestor tree
            this._stopPropogation = {};
            BaseView.__super__.constructor.call(this, options);
            // To maintain parity with how Backbone handles the 'events'
            // property on a view, we will overwrite the 'viewEvents'
            // property on the prototype with options.viewEvents if it
            // exists
            this.viewEvents = options && options.viewEvents ? options.viewEvents : this.viewEvents;
            if (this.viewEvents) {
                this.bindViewEvents();
            }
        },
        /**
         * A basic render function that looks for a template
         * function, calls the template with the result of
         * the 'templateVars' property, and then set the html
         * to the result. Then, subviews are rendered and then
         * appended to their locations.
         * @memberOf Backbone.BaseView#
         * @return {Backbone.BaseView}
         */
        render: function () {
            var html = '';
            var template = this.template;
            if (isFunction(template)) {
                html = template(result(this, 'templateVars')) || '';
            }
            this.$el.html(html);
            this.subs.renderAppend();
            return this;
        },
        /**
         * Place the view DOM element ('.el') in a specified location. By
         * default it is appended to the location.
         * @memberOf Backbone.BaseView#
         * @param {jQuery} $location jQuery DOM element
         * @param {boolean} [replace]
         *        True if you want to replace existing html
         *        of the location with this view
         * @return {Backbone.BaseView}
         */
        place: function ($location, replace) {
            if (typeof $location === "string") {
                var $parent = (this.parentView) ? this.parentView.$el : Backbone.$('body');
                $location = $parent.find($location);
            }

            if (replace) {
                $location.html(this.el);
                return this;
            }
            $location.append(this.el);
            return this;
        },
        /**
         * Overrides Backbone.View#remove in order
         * to remove SubViews as well, in order to
         * prevent memory leaks.
         * @memberOf Backbone.BaseView#
         * @return {Backbone.BaseView}
         */
        remove: function () {
            BaseView.__super__.remove.call(this);
            this.subs.removeElems();
            return this;
        },
        /**
         * Stops the current event from propagating up or down the
         * ancestor tree of BaseView instances. Resets immediately
         * after stopping the event, and has to be callled every
         * time you want an event to be stopped.
         * @memberOf Backbone.BaseView#
         * @param {String} event The name of the event
         * @return {Backbone.BaseView}
         */
        stopEvent: function (event) {
            console.assert(!!event, "event parameter is required");
            this._stopPropogation[event] = true;
            return this;
        },
        /**
         * Like Backbone.trigger, except that this will not only use trigger
         * on the instance this method is invoked on, but also the instance's
         * 'parentView', and the parentView's parentView, and so on.
         * Additional arguments beyond the event name will be passed
         * as arguments to the event handler functions. The view that
         * originated the bubbling event will automatically be tacked
         * on to the end of the arguments, so you can access it if needed.
         * @memberOf Backbone.BaseView#
         * @param {String} event The name of the event
         * @param {...Mixed} [arg] Argument be passed to event callbacks
         * @return {Backbone.BaseView}
         */
        triggerBubble: function (event) {
            var args = slice.call(arguments, 1);
            var stopPropogation;
            var anscestor;
            args.unshift(event);
            args.push(this);
            anscestor = this;
            while (anscestor) {
                anscestor.trigger.apply(anscestor, args);
                stopPropogation = anscestor._stopPropogation;
                if (stopPropogation && stopPropogation[event]) {
                    stopPropogation[event] = false;
                    return this;
                }
                anscestor = anscestor.parentView;
            }
            return this;
        },
        /**
         * Triggers an event that will trigger on each of the instances
         * subViews, and then if a subView has subViews, will trigger the
         * event on that subViews' subViews, and so on. If a subView
         * calls stopEvent and passes the event name, then the event
         * will not trigger on that subViews' subViews. Arguments
         * work in the same manner as they do with triggerBubble.
         * @memberOf Backbone.BaseView#
         * @param {String} event The event name
         * @param {...Mixed} [arg] Argument be passed to event callbacks
         * @return {Backbone.BaseView}
         */
        triggerDescend: function (event) {
            var args = slice.call(arguments, 1);
            var _trigger = function (subViews) {
                var i = -1;
                var len = subViews.length;
                var subSubs;
                var stopPropogation;
                var descend;
                while (++i < len) {
                    descend = true;
                    subViews[i].trigger.apply(subViews[i], args);
                    stopPropogation = subViews[i]._stopPropogation;
                    if (stopPropogation && stopPropogation[event]) {
                        stopPropogation[event] = false;
                        descend = false;
                    }
                    subSubs = subViews[i].subViews;
                    if (descend && subSubs && subSubs.length) {
                        _trigger(subSubs);
                    }
                }
            };
            args.unshift(event);
            args.push(this);
            _trigger([this]);
            return this;
        },
        /**
         * Invoke a function or method on ancestors
         * @memberOf Backbone.BaseView#
         * @param {Function|String} fnName
         * @param {mixed[]} [args]
         *        An array of arguments to pass to
         *        the invocation
         * @return {Backbone.BaseView}
         */
        ascend: function (fnName, args) {
            var func;
            var ancestor = this;
            var isFunc = isFunction(fnName);
            while (ancestor.parentView) {
                ancestor = ancestor.parentView;
                if (ancestor) {
                    func = isFunc ? fnName : ancestor[fnName];
                    func.apply(ancestor, args);
                }
            }
            return this;
        },
        /**
         * Ascends up the ancestor line until an
         * a test function returns true
         * @param  {Function} testFn
         *         A function that returns a truthy
         *         value if the current ancestor should be
         *         returned
         * @return {Backbone.BaseView|null}
         */
        findAncestor: function (testFn) {
            var ancestor = this;
            while (ancestor.parentView) {
                ancestor = ancestor.parentView;
                if (ancestor && testFn(ancestor)) {
                    return ancestor;
                }
            }
            return null;
        },
        /**
         * Returns the first ancestor to be an instance
         * of the Construct argument
         * @param  {Function} Construct
         *         A Backbone.BaseView constructor function
         * @return {Backbone.BaseView|null}
         */
        findAncestorByConstruct: function (Construct) {
            return this.findAncestor(function (ancestor) {
                return ancestor instanceof Construct;
            });
        },
        /**
         * Get the first ancestor that matches a type.
         * @memberOf Backbone.BaseView#
         * @param {String} type
         *        The subView 'type' the ancestor should match. The
         *        first ancestor with this type will be returned
         * @return {null|Backbone.BaseView}
         */
        findAncestorByType: function (type) {
            return this.findAncestor(function (ancestor) {
                return type && ancestor._subviewtype === type;
            });
        },
        /**
         * Return the subview type if this view a subview and was a assigned a
         * type.
         * @memberOf Backbone.BaseView#
         * @return {string|number} The subview type
         */
        getSubViewType: function () {
            return this._subviewtype;
        },
        /**
         * Returns the top of the subView hierarchy.
         * @memberOf Backbone.BaseView#
         * @return {Backbone.View}
         */
        getTopView : function () {
            var ancestor = this;
            while (ancestor.parentView) {
                ancestor = ancestor.parentView;
            }
            return ancestor;
        },
        /**
         * Returns true if this view has no ancestors
         * @memberOf Backbone.BaseView#
         * @return {boolean}
         */
        isTopView : function () {
            return !this.parentView;
        },
        /**
         * Like delegateEvents, except that instead of events being bound to el, the
         * events are backbone events bound to the view object itself. You can create
         * a 'viewEvents' object literal property on a View's prototype, and when it's
         * instantiated, the view will listen for events on a Backone object based on
         * the key.
         *
         * For example { 'change model': 'render' } would listen for a 'change'
         * event on the view's model property and then call view's render method.
         * If you only specify an event name and leave the property out of the key,
         * then the event will be bound to the view instance directly. For example,
         * { 'submit' : 'render' } would call the render method of the view when
         * a 'submit' event occurs on the view.
         * @memberOf Backbone.BaseView#
         * return {Backbone.BaseView}
         */
        bindViewEvents: function (events) {
            events = events || result(this, 'viewEvents');
            each(events, function (func, event) {
                var segs = event.split(' ');
                var listenTo = (segs.length > 1) ? this[segs[1]] : this;
                func = isFunction(func) ? func : this[func];
                if (listenTo) {
                    this.stopListening(listenTo, segs[0], func);
                    this.listenTo(listenTo, segs[0], func);
                }
            }, this);
            return this;
        },

        /**
         * Overrides delegateEvents, only changing behavior if the view
         * instance has an 'addedEvents' property defined. This will
         * create an events object that has all events from the '.events'
         * property and the 'addedEvents' property. Added events
         * should be namespaced on a key (or autonamespaced).
         *
         * @override
         * @memberof Backbone.BaseView#
         * @param {object} [events]
         *      If provided, these will be used as the events instead of
         *      the events found in the events and addedEvents object
         * @param {boolean} [includeAdded]
         *      If true, and an events object is passed as a first param
         *      then instead of only using delegating events passed in
         *      as the first param, the events stored in the 'addedEvents'
         *      property are also delegated
         * @returns {Backbone.BaseView}
         */
        delegateEvents: function (events, includeAdded) {
            if ((!events || includeAdded) && this.addedEvents) {
                events = _.clone(_.result(this, 'events')) || {};
                var groupName;
                var eventKey;
                var callback;
                var addedEvents;

                for (groupName in this.addedEvents) {
                    if (this.addedEvents.hasOwnProperty(groupName)) {
                        addedEvents = _.result(this.addedEvents, groupName);
                        for (eventKey in addedEvents) {
                            if (addedEvents.hasOwnProperty(eventKey)) {
                                if (!events[eventKey] || getFunc(this, events[eventKey]) !== getFunc(this, addedEvents[eventKey])) {
                                    callback = addedEvents[eventKey];
                                    if (isNaN(parseInt(groupName, 10))) {
                                        eventKey = addEventNamespace(eventKey, groupName);
                                    }
                                    if (!events[eventKey]) {
                                        events[eventKey] = callback;
                                    } else {
                                        eventKey = addEventNamespace(eventKey, ('dibs' + Math.round(Math.random() * _randZeroPadding)));
                                        events[eventKey] = callback;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return BaseView.__super__.delegateEvents.call(this, events);
        },

        addEvents: function (name, events) {
            _addEvents(this, name, events);
            return this;
        },

        removeAddedEvents: function (name, undelegate) {
            delete this.addedEvents[name];
            if (undelegate) {
                this.$el.off('.' + name);
            }
            return this;
        },

        marinate: function () {
            _marinate(this, Array.prototype.slice.call(arguments));
            return this;
        }

    });


    /**
     *
     * Slowly impart flavor into your BaseView instances. Also,
     * adds properties and methods your BaseView extension's
     * prototype like _.extend(MyView.prototype, mixin) would,
     * except that it looks for an 'addedEvents' property on
     * your mixin and adds those events to existing 'addedEvents'
     * rather than overwriting them.
     * @module {function} marinate
     * @param {...object} mixins
     *      One or more mixins to copy onto your view's prototype,
     *      with the optional 'addedEvents' object being added
     *      onto the existing addedEvents object instead of
     * @returns {function}
     */
    marinate = function (View) { //eslint-disable-line no-shadow
        console.assert(View.prototype instanceof Backbone.BaseView, 'View must a Backbone.BaseView constructor');
        var mixins = slice.call(arguments, 1);
        _marinate(View.prototype, mixins);
    };

    _.extend(marinate, {
        /**
         * Marinate only an instance of a view
         * @memberOf module:marinate
         * @param {Backbone.BaseView} viewInstance
         * @param {...object} mixins
         */
        marinateInstance: function (viewInstance) {
            console.assert(viewInstance instanceof Backbone.BaseView, 'viewInstance must be an instance of Backbone.BaseView');
            var mixins = slice.call(arguments, 1);
            _marinate(viewInstance, mixins);
        },
        /**
         * Add DOM events to a BaseView pseudoclass
         * @memberOf module:marinate
         * @param {function} View Constructor for Backbone.BaseView
         * @param {string} name Namespace for your added events
         * @param {object} eventsObj Backbone DOM events hash
         */
        addProtoEvents: function (View, name, eventsObj) { //eslint-disable-line no-shadow
            console.assert(View.prototype instanceof Backbone.BaseView, 'View must a Backbone.BaseView constructor');
            _addEvents(View.prototype, name, eventsObj);
        },
        /**
         * Add DOM events to a BaseView instance
         * @memberOf module:marinate
         * @param {Backbone.BaseView} viewInstance
         * @param {string} name Namespace for your added events
         * @param {object} eventsObj Backbone DOM events hash
         */
        addEvents: function (viewInstance, name, eventsObj) {
            console.assert(viewInstance instanceof Backbone.BaseView, 'viewInstance must be an instance of Backbone.BaseView');
            _addEvents(viewInstance, name, eventsObj);
        }
    });

    BaseView.marinate = marinate;

    Backbone.BaseView = BaseView;

}(this));
