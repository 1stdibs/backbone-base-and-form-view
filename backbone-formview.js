//     Backbone.FormView 0.8.3

//     (c) 2014 James Ballantine, 1stdibs.com Inc.
//     Backbone.FormView may be freely distributed under the MIT license.
//     For all details and documentation:
//     https://github.com/1stdibs/backbone-base-and-form-view

(function (root) {
    'use strict';

    var Backbone = root.Backbone;
    var _ = root._;

    if (typeof module !== 'undefined') {
        _ = require('underscore');
        Backbone = require('./backbone-baseview');
        module.exports = Backbone;
    }

    if (!Backbone || !Backbone.BaseView) {
        throw new Error('Backbone and Backbone.BaseView required');
    }

    var FieldView;
    var RadioListView;
    var SelectListView;
    var CheckListView;
    var CheckBoxView;
    var FieldSetView;
    var CollectionFieldSetView;
        // Local copies
    var Model = Backbone.Model;
    var Collection = Backbone.Collection;
    var each = _.each;
    var extend = _.extend;
    var defaults = _.defaults;
    var clone = _.clone;
    var isUndefined = _.isUndefined;
    var isFunction = _.isFunction;
    var isArray = _.isArray;
    var isString = _.isString;
    var result = _.result;
    var toStr = String;
    var defaultUpdateEvents = ['blur'];

    // Form Disable Mixin -- added to FormView prototype's
    // in order to allow disabling and enabling fields.
    var formViewDisableMixin = {
        /**
         * Disables the form by invoking the disable method
         * on all fields that implement it. If a field doesn't
         * implement this method, it will not be disabled.
         * @memberOf Backbone.FormView#
         * @return {Backbone.FormView}
         */
        disable: function () {
            this.subs.each(function (field) {
                if (isFunction(field.disable)) { field.disable(); }
            });
            return this;
        },
        /**
         * The reverse of disable, naturally. Invokes enable method
         * on all fields and field sets.
         * @memberOf Backbone.FormView#
         * @return {Backbone.FormView}
         */
        enable: function () {
            this.subs.each(function (field) {
                if (isFunction(field.enable)) { field.enable(); }
            });
            return this;
        }
    };

    /**
     * Used by the FieldSet and CollectionFieldSet function
     * @return {string} A prefix for a field name/id
     */
    var getFieldPrefix = function () {
        var prefPref = (this.parentView && this.parentView.getFieldPrefix) ? this.parentView.getFieldPrefix() : '';
        return prefPref + this.fieldSetName + '-';
    };

    /**
     * Function used by FormView, CollectionFormView, FieldSet,
     * CollectionFieldSet, and the FieldViews to generate
     * template variables in the 'render' methods
     * @return {object}
     */
    var getTemplateVars = function () {
        return extend({}, this._defaultTemplateVars, result(this, 'templateVars'));
    };

    // ------------------------
    // Local utility functions

    // Utility function to help find submodels and sub collections in _setupSubViewConfig
    var strTo = function (string, obj, instOf) {
        if (string instanceof instOf) {
            return string;
        }
        if (string === true && obj instanceof instOf) {
            return obj;
        }
        if (!obj) { return null; }
        obj = obj.get(string);
        if (obj instanceof instOf) {
            return obj;
        }
        return null;
    };
    // Utility function used by FormView to determine what model the options object should use.
    // Looks to see if options.model is already a Backbone Model, but if its a string, tries to find
    // sub model of the parent model. If that doesn't work, uses the parent model. If the options
    // doesn't specify a model to use, then we do the same thing with the schema key (the field key)
    var getSubModel = function (optionModel, key, model) {
        return optionModel ? (strTo(optionModel, model, Model) || model) : strTo(key, model, Model) || model;
    };
    // Similar to getSubModel except for collections and does not pass the parent collection if no option
    // collection is specified and the schema key cannot locate a sub collection, then null is returned
    var getSubCollection = function (optionCollection, key, model, collection) {
        if (optionCollection) {
            return strTo(optionCollection, model, Collection) || collection;
        }
        return strTo(key, model, Collection) || null;
    };


    // ======================================================================================
    // FORM VIEW
    // ======================================================================================

    /**
     * An extension of {@link Backbone.BaseView} that lets you set up a form easily by making
     * subviews automatically using a 'schema' and defining a framework to let you create elaborate
     * forms with less code. You can define a schema by extending this view and specifying a 'schema'
     * prototype property, or by passing a 'schema' option when you initialize the view.
     * @constructor Backbone.FormView
     * @class Backbone.FormView
     * @extends Backbone.BaseView
     *
     * @property {Object} [options] - Options that you can pass to init or add as properties on extended view
     * @property {Function|String} [options.template]
     *       An underscore template function or a string that serves as the source
     *       of an underscore template function. In order for the FormView's "render"
     *       method to work, the template requires a data-fields attribute to be set
     *       on an element in the template. This element will serve as a wrapper
     *       for all the subViews that will be generated on render.
     * @property {Object} [options.schema]
     *       Schema to use to create form fields automatically on render (or initialization
     *       if setupOnInit is true)
     * @property {Boolean} [options.setupOnInit]
     *      The schema will be used to set up all subView (the fields) instances by
     *      default when the FormView's render method is invoked, but unless setupOnInit
     *      is true, and instead the instances are created when initialize is called. If
     *      this is false, you can still setup the subViews anytime by invoking the
     *      setupFields method.
     * @property {String[]} [options.fieldOrder]
     *      Should represent the order that you want the fields to be rendered in,
     *      otherwise they will be rendered in the order they appear in the schema.
     *      Each index should match a key defined in your schema.
     * @property {Object} [options.templateVars]
     *      an object of variables that will be passed to the template
     * @property {Boolean} [options.autoUpdateModel]
     *      The FormView is designed to work with nested model and collection
     *      paradigms seen in frameworks like BackboneRelational. Some of
     *      these frameworks will recreate models and collections when the top
     *      level model syncs with the server or the user sets a new model
     *      on the property manually, so passing 'true' here will have the
     *      form view try to automatically change the model properties of
     *      the fields and fieldsets to use the correct model based on
     *      the top level form model.
     * @property {Boolean} [options.twoWay]
     *      If the fields support it (which the default fields do), then when
     *      a model is updated, and not by the field, then the field will
     *      automatically re-render the input to display the updated value
     *      to the user.
     *
     * @example
     * // schema object that can be a property on the view or an option passed to the form
     * schema : {
     *      // The schema key
     *      fieldname: {
     *         type: 'Text',
     *
     *         // The options object is passed to the Field View on init.
     *         // Some options are added automatically.
     *         options: {
     *             // If you don't specify a model, the parent's model (ie the form views model)
     *             // will be passed automatically, or if a submodel is found that matches
     *             // 'fieldname', that will be retrieved automatically
     *             model: subModelName
     *
     *             // Works in a similar way as the model property does, except that if
     *             // no collection string/instance is provided, and no sub collection
     *             // matching 'fieldname' attached to the parent model, then no collection
     *             // will be attached to the subView
     *             collection: subCollectionName
     *
     *             // if the 'type' is view that is an instance FormView (e.g. FieldSet)
     *             // then you can pass a schema as an option and then the formView will
     *             // recursively setup the schema for that FormView fieldset as well
     *             schema: {
     *                 // Fieldset fields
     *             }
     *
     *             ... // Other options you would like to pass to the type upon init
     *         }
     *     },
     *     ... // Other field schemas
     * }
     *
     */
    Backbone.FormView = Backbone.BaseView.extend({
        tagName: 'form',
        className: 'form-horizontal',
        fieldAlias: {
            'Text' : 'Backbone.fields.FieldView',
            'RadioList' : 'Backbone.fields.RadioListView',
            'CheckList' : 'Backbone.fields.CheckListView',
            'Select' : 'Backbone.fields.SelectListView',
            'FieldSet' : 'Backbone.FieldSetView',
            'Checkbox' : 'Backbone.fields.CheckBoxView',
            'CollectionField' : 'Backbone.CollectionFieldSetView'
        },
        template: _.template('<div data-fields=""></div>'),
        fieldsWrapper: '[data-fields]:first',
        initialize: function (options) {
            options = this.options = defaults(options || {}, this.options);
            var schema = options.schema || this.schema;
            var setUpOnInit = !isUndefined(options.setupOnInit) ? options.setupOnInit : this.setupOnInit;
            // this.subs.autoInitSingletons = true;
            extend(this, {
                templateVars : options.templateVars || this.templateVars || {},
                setupOnInit : options.setupOnInit || this.setupOnInit,
                validateOnSet : (!isUndefined(options.validateOnSet)) ? options.validateOnSet : this.validateOnSet,
                twoWay: (!isUndefined(options.twoWay)) ? options.twoWay : this.twoWay,
                autoUpdateModel: (!isUndefined(options.autoUpdateModel)) ? options.autoUpdateModel : this.autoUpdateModel,
                fieldsWrapper: options.fieldsWrapper || this.fieldsWrapper
            });
            this._defaultTemplateVars = this._defaultTemplateVars || { label: options.label };
            this.template = options.template || (isString(this.template) ? _.template(this.template) : this.template);
            this.subViewConfig = options.subViewConfig || null;
            if (schema) {
                this.setSchema(schema);
                if (setUpOnInit) { this.setupFields(); }
            }
        },
        /**
         * Set a new schema for the form.
         * @memberOf Backbone.FormView#
         * @param {Object} schema
         * @return {Backbone.FormView}
         */
        setSchema: function (schema) {
            this.schema = schema || this.schema;
            return this;
        },
        /**
         * The subViewConfig is the schema fleshed by the
         * _setupSubViewConfig method. Set the subViewConfig
         * property and register the config with the subview
         * manager. The property autoInitSingletons on the
         * SubViewManager is true by default with a FormView
         * and that will instantiate the SubViews when the
         * config is added.
         * @memberOf Backbone.FormView#
         * @param {object} config
         * @return {Backbone.FormView}
         */
        setSubViewConfig: function (config) {
            this.subViewConfig = config;
            this.subs.addConfig(config);
            return this;
        },
        /**
         * Should return true if fields have been
         * set up at least once.
         * @memberOf Backbone.FormView#
         * @return {Boolean}
         */
        hasSetupFields: function () {
            return this._hasSetupFields;
        },
        /**
         * Creates the subViewConfig property, derived from the
         * form's schema. The subViewConfig is like the schema
         * but fleshed out for the baseView's subView manager.
         * @memberOf Backbone.FormView#
         * @return {Backbone.FormView}
         */
        setupFields: function () {
            var config = this._setupSubViewConfig(result(this, 'schema'));
            this.setSubViewConfig(config);
            this.subs.createSingletons(); // Instantiate the fields from the config
            this._setHasSetupFields(true);
            return this;
        },
        /**
         * If your form is not automatically setting model
         * properties when the user exits a field, you can
         * use this method to set the values on the model
         * from the inputs all at once.
         * @memberOf Backbone.FormView#
         * @return {Backbone.FormView}
         */
        setModelAttrs: function () {
            this.subs.each(function (field) {
                if (isFunction(field.setModelAttrs)) {
                    field.setModelAttrs();
                }
            });
            return this;
        },
        /**
         * Get the wrapper for the field subView elements
         * @memberOf Backbone.FormView#
         * @return {$}
         */
        getFieldsWrapper: function () {
            var $wrapper = this.$(this.fieldsWrapper);
            if (!$wrapper.length) {
                return this.$el;
            }
            return $wrapper.first();
        },
        /**
         * If your subviews (aka the fields) set in the schema aren't setup yet, then this method
         * does that. Regardless, this method renders the shell template, and then renders all
         * subViews. If your template has an element with data-fields defined, the fields will be
         * appended to that. Otherwise they will be directly appended to the template.
         * @memberOf Backbone.FormView#
         * @return {Backbone.FormView}
         */
        render : function () {
            var order = this.options.fieldOrder || this.fieldOrder;

            this.subs.detachElems();
            if (!this.hasSetupFields()) {
                this.setupFields();
            }
            this.$el.html(this.template(this._getTemplateVars()));

            if (order && order.length) {
                order = order.slice(0);
                while (order.length) {
                    this.subs.renderByKey(order.shift(), { useLocation: true });
                }
            } else {
                this.subs.renderAppend();
            }

            return this;
        },
        _setHasSetupFields: function (hasSetupFields) {
            this._hasSetupFields = hasSetupFields;
            return this;
        },
        _setupSubViewConfig: function (baseSchema, model, collection) {
            var options;
            var collec;
            var schema;
            var self = this;
            var subViewConfig = {};

            model = model || this.model;
            collection = collection || this.collection;

            each(baseSchema, function (origSchema, key) {
                schema = subViewConfig[key] = clone(origSchema);
                schema.options = (isFunction(origSchema.options)) ? origSchema.options.call(this) : clone(origSchema.options || {});
                options = schema.options = schema.options || {};
                schema.singleton = (schema.singleton === undefined) ? true : schema.singleton;
                schema.construct = self.fieldAlias[schema.type || schema.construct] || schema.type || schema.construct;
                schema.location = schema.location || self.fieldsWrapper;
                options.model = getSubModel(options.model, key, model);
                if (this.validateOnSet) { options.setOpts = defaults(options.setOpts || {}, { validate: true }); }
                if (this.twoWay) { options.twoWay = (!isUndefined(options.twoWay)) ? options.twoWay : this.twoWay; }
                collec = getSubCollection(options.collection, key, model, collection);
                if (collec) { options.collection = collec; }
                if (options.schema) {
                    options.subViewConfig = self._setupSubViewConfig(options.schema, options.model);
                }
                options.schemaKey = key;
            }, this);
            return subViewConfig;
        },
        /**
         * A reference to the template vars function
         * @type {function}
         */
        _getTemplateVars: getTemplateVars
    }, {
        /**
         * Add a Field Alias to the list of field aliases. For example
         * You have a view constructor DateFieldView and you want to
         * make it easy to put that field in a schema, you can use this
         * static function to add an allias 'Date' for that constructor
         * @memberOf Backbone.FormView
         * @param {String} alias     Name of the alias
         * @param {String|Function} construct Constructor used for the field
         */
        addFieldAlias: function (alias, construct) {
            var aliases = {};
            var currAliases = Backbone.FormView.prototype.fieldAlias;
            if (construct) {
                aliases[alias] = construct;
            } else { aliases = alias; }
            defaults(currAliases, aliases);
        }
    });

    // Add disable/enable functionality
    extend(Backbone.FormView.prototype, formViewDisableMixin);

    // ====================================================
    // CollectionFormView

    // CollectionFormRowView - used by CollectionFormView for each row
    Backbone.CollectionFormRowView = Backbone.FormView.extend({
        className: 'form-field-row controls-row',
        tagName: 'div',
        getFieldPrefix: function () {
            var parentPref = '';
            var index = this.rowIndex();
            if (this.parentView && this.parentView.getFieldPrefix) {
                parentPref = this.parentView.getFieldPrefix(this) || '';
            }
            return parentPref + ((_.isNumber(index) && index > -1) ? index + '-' : '');
        },
        /**
         * Asks the parent collection form view to delete this row
         * @memberOf Backbone.CollectionFormRowView#
         * @return {Backbone.CollectionFormRowView}
         */
        deleteSelf: function () {
            this.parentView.deleteRow(this);
            return this;
        },
        /**
         * @memberOf Backbone.CollectionFormRowView#
         * @return {number}
         *         The index of the row
         */
        rowIndex: function () {
            if (this.parentView && this.parentView.subs) {
                var rows = this.parentView.subs.get('row');
                if (rows) {
                    return rows.indexOf(this);
                }
            }
            return null;
        }
    });


    /**
     * Similar to Backbone.FormView, except that this form view will iterate
     * over a collection and will produce a row for each model in the collection.
     * Each field in your schema will get a subView for each model in the collection.
     * @constructor Backbone.CollectionFormView
     * @extends Backbone.BaseView
     * @class Backbone.CollectionFormView
     * @property {Backbone.Collection} collection A Backbone.Collection used to create rows
     * @property {object} [options]
     *        Options that can either be set as properties on directly on the view or
     *        passed in an object to the constructor.
     * @property {function|string} [options.template]
     *        The underscore template to use that wraps the rows. Should contain an
     *        empty element that matches the selector for 'rowWrapper' property. By
     *        default, this would mean just adding a 'data-rows' attribute to that
     *        element.
     * @property {object} [options.rowOptions]
     *        Options to pass to each row when they are initialized
     * @property {object} [options.rowSchema]
     *        The form schema to use for each row
     * @property {object} [options.rowConfig]
     *        Instead of using the rowOptions and rowSchema option,
     *        you can define a rowConfig object which works like a BaseView
     *        {@link SubViewManager} config. Here you can define a constructor
     *        as well to use for the row views, in addition to the schema and
     *        options.
     * @property {object} [options.templateVars]
     *        Object to use for template variables for the template that
     *        wraps each of the collection form rows. To pass a template
     *        that is used for each row, use rowOptions.templateSrc
     * @property {boolean} [options.setupOnInit]
     *        True will initialize the row views for each model in the
     *        collection. False means the view will wait until render
     *        or setupRows is called.
     *
     */
    Backbone.CollectionFormView = Backbone.BaseView.extend({
        tagName: 'form',
        className: 'form',
        rowWrapper : '[data-rows]:first',
        template: _.template('<div data-rows=""></div>'),
        initialize: function (options) {
            var self = this;
            var rowOpts;
            options = self.options = defaults(options || {}, self.options);
            self.template = options.template || (isString(self.template) ? _.template(self.template) : self.template);
            self.setupOnInit = !isUndefined(options.setupOnInit) ? options.setupOnInit : self.setupOnInit;
            self.rowOptions = options.rowOptions || self.rowOptions;
            self.templateVars = options.templateVars || self.templateVars || {};
            self._defaultTemplateVars = { label: options.label };
            self.rowWrapper = options.rowWrapper || self.rowWrapper;
            if (options.rowConfig) {
                self.rowConfig = options.rowConfig;
                self.rowConfig = clone(result(self, 'rowConfig')) || {};
                self.rowConfig.options = self.rowConfig.options ? clone(self.rowConfig.options) : {};
            } else {
                self.rowConfig = clone(result(self, 'rowConfig')) || {
                    singleton: false,
                    construct: Backbone.CollectionFormRowView
                };
                rowOpts = clone(result(self, 'rowOptions'));
                self.rowConfig.options = rowOpts || self.rowConfig.options || {};
                self.setRowSchema(options.rowSchema || self.rowSchema || self.rowConfig.options.schema);
            }
            self.rowConfig.location = self.rowWrapper;
            self.subs.addConfig('row', self.rowConfig);
            if (self.setupOnInit) {
                self.setupRows();
            }
        },
        /**
         * Set the schema used for each row.
         * @memberOf Backbone.CollectionFormView#
         * @param {object} [schema]
         * @return {Backbone.CollectionFormView}
         */
        setRowSchema: function (schema) {
            if (!this.rowConfig.options) { this.rowConfig.options = {}; }
            this.rowConfig.options.schema = schema || this.options.rowSchema || this.rowSchema;
            return this;
        },
        /**
         * Like Backbone.FormView.render, except that each a subView will be rendered
         * for each field in the schema and for each model in the collection.
         * Each model in the collection will have a 'row' associated with it,
         * and each row will contain each of the fields in the schema.
         * @memberOf Backbone.CollectionFormView#
         * @return {Backbone.CollectionFormView}
         */
        render: function () {
            this.subs.detachElems();
            this.$el.html(this.template(this._getTemplateVars()));
            if (!this.getRows() || !this.getRows().length) {
                this.setupRows();
            }
            this.subs.renderByKey('row', { appendTo: this.getRowWrapper() });
            return this;
        },
        /**
         * Get the wrapper element that the rows will be appended to
         * @memberOf Backbone.CollectionFormView#
         * @return {$}
         */
        getRowWrapper: function () {
            var $wrapper = this.$(this.subs.config.row.location);
            if (!$wrapper.length) {
                return this.$el;
            }
            return $wrapper.first();
        },
        /**
         * Add a row to the CollectionFormView. If you do not
         * pass a model, one will be created from the collection.model
         * property constructor. The model(s) will then be tied
         * to the new row(s).
         * @memberOf Backbone.CollectionFormView#
         * @param  {Backbone.Model} model
         *         model A model to add a row for
         * @return {Backbone.CollectionFormView}
         */
        addRow: function (model) {
            var added;
            model = model || new this.collection.model(); //eslint-disable-line new-cap
            added = this.collection.add(model);
            // Backbone 1.0.0 does not return the added models,
            // so we will not set the models var to the return val
            if (!(added instanceof Backbone.Collection)) {
                model = added;
            }
            this._addRow(model).subs.newest.render().$el
                .appendTo(this.getRowWrapper());
            return this;
        },
        /**
         * Removes a row or rows from the CollectionFormView and
         * corresponding collection.
         * @memberOf Backbone.CollectionFormView#
         * @param  {Backbone.Model|Backbone.View|Backbone.View[]|Backbone.Model[]} obj
         *         Used to find models in the collection and views in the subViewManager
         *         and remove them.
         * @return {Backbone.CollectionFormView}
         */
        deleteRow : function (obj) {
            var model = (obj instanceof Model) ? obj : null;
            var view = (!model && obj instanceof Backbone.View) ? obj : null;
            var arr = (!model && !view && isArray(obj)) ? obj : null;

            if (arr) {
                each(arr, this.deleteRow, this);
                return this;
            }

            if (!view) {
                view = this.subs.get(model);
            } else if (!model) {
                model = view.model;
            }

            this.subs.remove(view);
            this.collection.remove(model);
            return this;
        },
        /**
         * Shortcut method to remove all rows and then
         * set them up again, render them, and place
         * them in the row wrapper
         * @memberOf Backbone.CollectionFormView#
         * @return {Backbone.CollectionFormView}
         */
        reset: function () {
            this.setupRows().subs.renderByKey('row', { appendTo: this.getRowWrapper() });
            return this;
        },
        /**
         * @return {Backbone.View[]} An array of the row subviews
         */
        getRows: function () {
            return this.subs.get('row');
        },
        /**
         * When you are ready to set up your rows (ie initialize
         * each Row view instance based on the collection
         * @memberOf Backbone.CollectionFormView#
         * @return {Backbone.CollectionFormView}
         */
        setupRows: function () {
            this.subs.remove('row');
            this.collection.each(this._addRow, this);
            return this;
        },
        _addRow: function (model) {
            var opts = this._getRowOptions(model);
            var row = this.subs.create('row', opts);
            row.setSchema(this.rowSchema).setupFields();
            return this;
        },
        _getRowOptions: function (model) {
            var rows = this.subs.get('row') || [];
            return { model: model, index: rows.length };
        },
        _getTemplateVars: getTemplateVars
    });

    // Add disable/enable functionality
    extend(Backbone.CollectionFormView.prototype, formViewDisableMixin);

    // =====================================================================
    // FIELD SUBVIEWS
    // =====================================================================

    // Below are field sub views that are used for common form
    // field types (e.g. text input, radio button, dropdown list)

    // ===================================================
    // Field Template

    Backbone.formTemplates = Backbone.formTemplates || {};

    // This is shell form template used for most of the standard form fields.
    // You can easily substitute your own by doing the following after loading
    // this file: Backbone.formTemplates.Field = $('#template-id').html();
    // Note that it uses bootstrap.css classes by default.
    Backbone.formTemplates.Field =
        '<% if (obj.label) { %><label class="control-label" ' +
            '<% if (obj.inputId) { %> for="<%= obj.inputId %>" <% } %> >' +
            '<%= obj.label %></label><% } %>' +
            '<div class="<%= obj.inputWrapperClass || \'controls\' %>" data-input="">' +
            '</div>' +
            '<div class="controls">' +
            '<div class="<%= obj.errorClass || \'text-error\' %>" data-error=""></div>' +
            '<% if (obj.help) { %><span class="help-block"><%= obj.help %></span><% } %>' +
            '</div>';

    Backbone.fields = Backbone.fields || {};

    // ===================================================
    // fields.FieldView

    /**
     * The base form field type, can be used to create a basic text input/textarea
     * Form field. By default it automatically set's the value of the form field
     * on the model when the blur event occurs. Use 'Text' alias in schema
     * to create fields with this contsructor.
     *
     * @constructor Backbone.fields.FieldView
     * @extends Backbone.BaseView
     * @class Backbone.fields.FieldView
     * @property {object} [options]
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.fieldName]
     *           The attribute on the model that this field is linked to. If not provided, this
     *           will default to the schemaKey.
     * @property {boolean} [options.addId]
     *           Add an id to the input element. This is taken from the inputId property or autoGenerated
     *           based on the schemaKey of this field.
     * @property {string} [options.elementType] 'input' or 'textarea' (Defaults to 'input')
     * @property {function|string} [options.template]
     *           Underscore template function or a string template source. This gets used as the
     *           wrapper around the input/control. Your template should have an empty element
     *           that matches the selector defined in the 'inputWrapper' property. By default,
     *           this would mean defining a 'data-input' attribute
     * @property {object|function} [options.templateVars] Variables to pass to the template on render
     * @property {string} [options.inputId] The id of the field to use (if undefined, one is created automatically)
     * @property {string} [options.inputClass] The class attribute you would like to set on the field input
     * @property {object} [options.inputAttrs] Object with attributes to set on the input element
     * @property {object} [options.setOpts] Options you would like to pass when model.set is called (e.g. silent, validate)
     * @property {string} [options.placeholder] Placeholder text for the input
     * @property {array<string>} [options.updateEvents] array of event names on which to call onUserUpdate (defaults to ['blur'])
     * @property {boolean} [options.twoWay]
     *      If you would like this field to re-render the input when model is updated by something other
     *      than this view, in addition to the normal behavior of the view updating the model
     */
    FieldView = Backbone.fields.FieldView = Backbone.BaseView.extend({
        tagName: 'div',
        classDefaults: 'control-group form-field',
        inputPrefix: 'field-input-',
        fieldPrefix: 'form-field-',
        template: _.template(Backbone.formTemplates.Field),
        addId: true,
        elementType: 'input',
        inputWrapper: '[data-input]:first',
        disabledDataKey: 'formViewDisabled',
        events: function () {
            return _.chain(this._updateEvents).map(function (eventName) {
                return [eventName + ' ' + this.elementType, 'onUserUpdate'];
            }.bind(this)).object().value();
        },
        initialize: function (options) {
            options = this.options = defaults(options || {}, this.options);
            extend(this, {
                _updateEvents: options.updateEvents || defaultUpdateEvents.concat(),
                templateVars : options.templateVars || this.templateVars || {},
                fieldName : options.fieldName || this.fieldName || options.schemaKey,
                elementType : options.elementType || this.elementType,
                template : options.template || this.template,
                setOpts : defaults(options.setOpts || {}, this.setOpts),
                twoWay : !isUndefined(options.twoWay) ? options.twoWay : this.twoWay,
                inputAttrs: options.inputAttrs || this.inputAttrs,
                placeholder: options.placeholder || this.placeholder,
                inputClass: options.inputClass || this.inputClass,
                addId: !isUndefined(options.addId) ? options.addId : this.addId,
                label: !isUndefined(options.label) ? options.label : this.label,
                inputWrapper: options.inputWrapper || this.inputWrapper,
                inputId: options.inputId || this.inputId
            });
            this.inputId = this.addId ? this._getInputId() : false;
            this.template = isString(this.template) ? _.template(this.template) : this.template;
            this._defaultTemplateVars = this._defaultTemplateVars || {
                inputId : this.inputId,
                help : options.help,
                fieldName : this.fieldName,
                label : this.label
            };

            // If there is no class name specified, then we create one with the 'classDefaults' property
            // and another class based on the fieldPrefix and fieldName properties
            if (isUndefined(this.className)) {
                this.$el.addClass(this.fieldPrefix + this.fieldName);
                this.$el.addClass(this.classDefaults);
            }

            // Add data attribute to view element to indicate that it's a FormView field
            this.$el.attr('data-field', '');

            // If the twoWay option is true, then setup the events to make the field/model-attribute changes twoWay
            if (this.twoWay && this.setupTwoWay) {  this.setupTwoWay(); }
        },
        /**
         * Sets up two way updating. The view updates the model by default, and this
         * function will update the view on a model change (unless it was done by the view)
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        setupTwoWay: function () {
            this.listenTo(this.model, 'change:' + this.fieldName, function () {
                if (!this._viewChangedModel) { this.renderInput(); }
                this._viewChangedModel = false;
            });
            return this;
        },
        /**
         * Return an object of attributes as they should appear in the model
         * @memberOf Backbone.fields.FieldView#
         * @return {Object}
         */
        getAttrs: function () {
            var attrs = {};
            attrs[this.fieldName] = this.getValueForSet();
            return attrs;
        },
        /**
         * This method should get the value or values of the form
         * field and then set that value/values on the model
         * in the corresponding attribute(s)/field name(s). If
         * there is a setOpts object on the fieldView instance,
         * then use that as the options passed to Backbone.Model's
         * 'set' method.
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        setModelAttrs: function () {
            this._viewChangedModel = true;
            if (!this.model.set(this.getAttrs(), this.setOpts)) { this._viewChangedModel = false; }
            return this;
        },
        /**
         * Get the value of the form field input.
         * @memberOf Backbone.fields.FieldView
         * @memberOf Backbone.fields.FieldView#
         * @return {String|Boolean|Array|Number|Object}
         */
        getValue: function () {
            return Backbone.$.trim(this.getInputEl().val());
        },
        /**
         * Override this function if additional
         * logic needs to be performed to convert
         * the value of the input into what is
         * set on the model.
         * @memberOf Backbone.fields.FieldView#
         * @return {String|Boolean|Array|Number|Object}
         */
        getValueForSet: function () {
            return this.getValue();
        },
        /**
         * Gets the value of the field as it appears in the model
         * @memberOf Backbone.fields.FieldView#
         * @return {String|Boolean|Array|Number|Object}
         */
        getModelVal: function () {
            return this.model.get(this.fieldName);
        },
        /**
         * Gets the value from the model as it should be
         * set on the input. By default it's the same
         * as produced by getModelValue. Override this
         * function if you want to convert the model
         * value to something that should be set on the
         * input.
         * @memberOf Backbone.fields.FieldView#
         * @return {String|Boolean|Array|Number|Object}
         */
        getValueForInput: function () {
            return this.getModelVal();
        },
        /**
         * Renders the basic shell template for the form field and then
         * creates the input or textarea element, which gets appended
         * to the elem in the shell template found through the
         * {@link Backbone.fields.FieldView#getInputWrapper} method
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        render: function () {
            return this.renderWrapper().renderInput();
        },
        /**
         * Renders the wrapper that contains the field input
         * @param {object} [vars] Variables to pass to wrapper template
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        renderWrapper: function (vars) {
            this.isDisabled = null;
            this.$el.html(this.template(vars || this._getTemplateVars()));
            return this;
        },
        /**
         * Renders the field input and places it in the wrapper in
         * the element with the 'data-input' attribute
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        renderInput: function () {
            var $input;
            var id = this.inputId;
            var attrs =  this.addId ? { id : id, name: id } : {};
            var valForInput = this.getValueForInput();
            $input = Backbone.$('<' + this.elementType + '>');
            if (this.elementType === 'input') { attrs.type = 'text'; }
            if (this.placeholder) { attrs.placeholder = this.placeholder; }
            $input.attr(extend(attrs, this.inputAttrs));
            if (this.inputClass) { $input.attr('class', this.inputClass); }
            this.getInputWrapper().html($input);
            if (this._shouldSetValueOnInput(valForInput)) { $input.val(valForInput); }
            this.isDisabled = null;
            return this;
        },
        /**
         * Get the element that wraps the input. Looks for element
         * with data-input attribute. If not found, it will return this.$el
         * @memberOf Backbone.fields.FieldView#
         * @return {$}
         */
        getInputWrapper: function () {
            var $wrapper = this.$(this.inputWrapper);
            if (!$wrapper.length) {
                return this.$el;
            }
            return $wrapper.first();
        },
        /**
         * Get the element that takes user input.
         * @memberOf Backbone.fields.FieldView#
         * @return {$}
         */
        getInputEl: function () {
            return this.$(this.elementType);
        },
        /**
         * Disable the input if not already disabled
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        disable: function () {
            this.getInputEl().prop('disabled', true);
            this.isDisabled = true;
            return this;
        },
        /**
         * Enable the input if disabled by the 'disable' method
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        enable: function () {
            this.getInputEl().prop('disabled', false);
            this.isDisabled = false;
            return this;
        },
        /**
         * Handle updates from a user interaction
         * @memberOf Backbone.fields.FieldView#
         * @protected
         */
        onUserUpdate: function () {
            this.setModelAttrs();
        },
        /**
         * Generate the string to use for the id attribute of
         * the input element.
         * @memberOf Backbone.fields.FieldView#
         * @return {string}
         * @protected
         */
        _getInputId: function () {
            return this.inputId ||
                this.inputPrefix + this._getParentPrefix() + this.fieldName;
        },
        /**
         * Get the template vars used for the wrapper template
         * @memberOf Backbone.fields.FieldView#
         * @return {object}
         * @protected
         */
        _getTemplateVars: getTemplateVars,
        /**
         * If the parent FormView/FieldSetView defines a 'getFieldPrefix'
         * function, it can be used to construct the input id, name
         * attribute, and class attributes
         * @memberOf Backbone.fields.FieldView#
         * @return {string}
         * @private
         */
        _getParentPrefix: function () {
            if (this.parentView && this.parentView.getFieldPrefix) {
                return this.parentView.getFieldPrefix(this) || '';
            }
            return '';
        },
        /**
         * @param {string|number} valueForInput
         * @returns {boolean}
         * @memberOf Backbone.fields.FieldView#
         * @private
         */
        _shouldSetValueOnInput: function (valueForInput) {
            return !!valueForInput || valueForInput === 0;
        }
    }, {
        /**
         * Set the default template for all fields that don't override
         * the 'template' property of the Backbone.fields.FieldView
         * @memberOf Backbone.fields.FieldView
         * @param {function} template An underscore template
         * @static
         */
        setDefaultFieldTemplate: function (template) {
            FieldView.prototype.template = template;
        }
    });

    // ====================================================
    // RadioListView

    /**
     * Like Backbone.fields.FieldView, except it creates a list of radio buttons. Designed to
     * work with model fields that have only one value out of a fixed set of values. Use
     * 'RadioList' alias in form schema to create a field with this constructor.
     *
     * @augments {Backbone.fields.FieldView}
     * @constructor Backbone.fields.RadioListView
     * @class Backbone.fields.RadioListView
     * @property {object} [options]
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.fieldName] inherited from Backbone.fields.FieldView
     * @property {string} [options.templateSrc] inherited from Backbone.fields.FieldView
     * @property {function} [options.template] inherited from Backbone.fields.FieldView
     * @property {object} [options.templateVars] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputId] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputClass] inherited from Backbone.fields.FieldView
     * @property {boolean} [options.twoWay] inherited from Backbone.fields.FieldView
     * @property {object} [options.inputAttrs] inherited from Backbone.fields.FieldView
     * @property {object} [options.labelAttrs] Attributes for the label elements that wrap radio inputs
     * @property {object|function} [options.possibleVals]
     *      An object with the set of possible choices to display to the user. Each key will be
     *      what is set in the model when the user selects the radio, and each value is what
     *      will be used as the label text to display to the user.
     *
     */
    RadioListView = Backbone.fields.RadioListView = Backbone.fields.FieldView.extend({
        tagName: 'div',
        events : function () {
            var events = {};
            events['click ' + this.elementType] = 'onUserUpdate';
            return events;
        },
        type: 'radio-list',
        initialize: function (options) {
            options = this.options = defaults(options || {}, this.options);
            this.possibleVals = options.possibleVals || this.possibleVals || {};
            this.labelAttrs = options.labelAttrs || this.labelAttrs;
            RadioListView.__super__.initialize.call(this, options);
        },
        /**
         * Get the value of the radio list. Looks for a checked radio input
         * and gets the value attribute of that input.
         * @memberOf Backbone.fields.RadioListView#
         * @return {string}
         */
        getValue: function () {
            return this.$(this.elementType + ':checked').val();
        },
        /**
         * Returns true or false if the input should be selected.
         * @param {string} key The key of the possibleVal that is being tested
         * @return {boolean}
         */
        isSelected: function (key) {
            return (toStr(this.getValueForInput()) === toStr(key));
        },
        /**
         * Renders the radio inputs and appends them to the input wrapper.
         * @memberOf Backbone.fields.RadioListView#
         * @return {Backbone.fields.RadioListView}
         */
        renderInput: function () {
            var possibleVals = result(this, 'possibleVals');
            var key;
            var i = 0;
            var possibleVal;
            var $checkbox;
            var isSelected;
            var $inputWrapper = this.getInputWrapper().empty();

            for (key in possibleVals) {
                if (possibleVals.hasOwnProperty(key)) {
                    possibleVal = this._parsePossibleVal(possibleVals, key);
                    isSelected = this.isSelected(possibleVal.value);
                    $checkbox = this._renderInput(possibleVal, isSelected, i);
                    $inputWrapper.append($checkbox);
                    i++;
                }
            }
            return this;
        },
        _renderInput: function (possibleVal, isChecked, index) {
            var $listItem;
            var $label;
            var id = this.inputId;
            var attributes = { type: 'radio' };
            var labelAttrs = defaults(this.labelAttrs || {}, { 'class': 'radio' });
            if (this.addId) { extend(attributes, { name: id, id: (id + '-' + index) }); }
            if (isChecked) { attributes.checked = 'checked'; }
            extend(attributes, this.inputAttrs, { value: possibleVal.value });
            if (this.inputClass) { attributes.class = this.inputClass; }
            $listItem = Backbone.$('<' + this.elementType + '>').attr(attributes);
            $label = Backbone.$('<label>').attr(labelAttrs);
            $label.append($listItem).append(possibleVal.display);
            return $label;
        },
        _parsePossibleVal: function (possibleVals, key) {
            var val = possibleVals[key];
            if (val && !isUndefined(val.value) && val.display) {
                return val;
            }
            if (possibleVals.slice && isArray(possibleVals)) {
                return { value: val, display: val };
            }
            if (key && !isNaN(Number(key))) {
                key = Number(key);
            }
            return { value: key, display: val };
        }
    });

    // ====================================================
    // SelectListView

    /**
     * Like Backbone.fields.RadioListView, except that it creates a select drop down. Designed to
     * work with model fields that have one or several values out of a fixed set of values.
     * If you allow multi-select, the value will be an array. For single selects, the value
     * will be whatever the value of that one option is. Use type alias 'Select' to create
     * in the form schema to create a field with the select type.
     *
     * @constructor Backbone.fields.SelectListView
     * @augments {Backbone.fields.RadioListView}
     * @class Backbone.fields.SelectListView
     * @property {object} [options]
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.fieldName] inherited from Backbone.fields.RadioListView
     * @property {string} [options.templateSrc] inherited from Backbone.fields.RadioListView
     * @property {function} [options.template] inherited from Backbone.fields.RadioListView
     * @property {object} [options.templateVars] inherited from Backbone.fields.RadioListView
     * @property {string} [options.inputId] inherited from Backbone.fields.RadioListView
     * @property {string} [options.inputClass] inherited from Backbone.fields.RadioListView
     * @property {boolean} [options.inputAttrs] inherited from Backbone.fields.RadioListView
     * @property {object} [options.twoWay] inherited from Backbone.fields.RadioListView
     * @property {string} [options.placeholder]
     *           Placeholder text for the select. If the user selects this value, the
     *           model will be set to a blank string.
     * @property {Boolean} [options.multiple] If select should have multiple attribute or not
     * @property {object|string[]} [options.possibleVals]
     *      An object with the set of possible choices to display to the user. Each key will be
     *      what is set in the model when the user selects the option, and each value is what
     *      will be used as the label text to display to the user. You can create optgroups by
     *      making a value a nested object of with the same format. You can also just pass an
     *      array of values. These values will serve as the display value and the value that
     *      is set on the model.
     *
     */
    SelectListView = Backbone.fields.SelectListView = Backbone.fields.RadioListView.extend({
        type: 'select-list',
        elementType: 'select',
        events : function () {
            var events = {};
            events['change ' + this.elementType] = 'onUserUpdate';
            return events;
        },
        initialize: function (options) {
            options = this.options = defaults(options || {}, this.options);
            this.multiple = !isUndefined(options.multiple) ? options.multiple : this.multiple;
            SelectListView.__super__.initialize.call(this, options);
        },
        getValue: function () {
            return this.getInputEl().val();
        },
        /**
         * Returns true or false if the option should be selected
         * @memberOf Backbone.fields.SelectListView#
         * @param {string} key The key of the possibleVal that is being tested
         * @return {boolean}
         */
        isSelected: function (key) {
            var modelVal = this.getModelVal();
            modelVal = this.multiple ? modelVal : [modelVal];
            return (_.indexOf(_.map(modelVal, toStr), toStr(key)) > -1);
        },
        /**
         * Renders the select element and the options
         * @memberOf Backbone.fields.SelectListView#
         * @return {Backbone.fields.SelectListView}
         */
        renderInput: function () {
            var possibleVals = result(this, 'possibleVals');
            var id = this.inputId;
            var $select = Backbone.$('<' + this.elementType + '>')
                    .attr(extend((this.addId ? { id: id, name: id } : {}), this.inputAttrs));

            this.getInputWrapper().html($select);
            if (this.multiple) { $select.attr('multiple', 'multiple'); }
            if (this.inputClass) { $select.addClass(this.inputClass); }
            if (this.placeholder) {
                $select.append('<option value="">' + this.placeholder + '</option>');
            }
            return this._renderInput($select, possibleVals);
        },
        _renderInput: function ($wrapper, vals) {
            var key;
            var val;
            var $optgroup;
            var $option;
            for (key in vals) {
                if (vals.hasOwnProperty(key)) {
                    val = this._parsePossibleVal(vals, key);
                    if (val.group) {
                        $optgroup = Backbone.$('<optgroup label="' + key + '"></optgroup>').appendTo($wrapper);
                        this._renderInput($optgroup, val.group);
                    } else {
                        $option = Backbone.$('<option>').text(val.display).attr('value', val.value);
                        if (this.isSelected(val.value)) {
                            $option.prop('selected', true);
                        }
                        $option.appendTo($wrapper);
                    }
                }
            }
            return this;
        },
        _parsePossibleVal: function (possibleVals, key) {
            var val = possibleVals[key];
            if (val && val.group && val.display) {
                return val;
            }
            if (_.isObject(val) && !isArray(possibleVals)) {
                return { group: val, display: key };
            }
            return SelectListView.__super__._parsePossibleVal.call(this, possibleVals, key);
        }
    });


    // ====================================================
    // CheckListView

    /**
     * Like Backbone.fields.SelectListView, but instead of a select, it's a list of checkboxes.
     * Additionally, instead of setting one value on the model, each checkbox represents
     * one attribute on the model assigned to it. Each of these attributes should expect
     * a boolean or one of a set of 2 possible values. You can set what these values
     * are using the 'checkedVal' and 'unCheckedVal' options. Use the 'CheckList' alias
     * in your schema to create these views.
     * @constructor Backbone.fields.CheckListView
     * @augments {Backbone.fields.FieldView}
     * @class Backbone.fields.CheckListView
     * @property {object} [options]
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.fieldName] inherited from Backbone.fields.FieldView
     * @property {string} [options.templateSrc] inherited from Backbone.fields.FieldView
     * @property {function} [options.template] inherited from Backbone.fields.FieldView
     * @property {object} [options.templateVars] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputId] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputClass] inherited from Backbone.fields.FieldView
     * @property {boolean} [options.twoWay] inherited from Backbone.fields.FieldView
     * @property {object} [options.inputAttrs] inherited from Backbone.fields.FieldView
     * @property {object} [options.labelAttrs] inherited from Backbone.fields.RadioListView
     * @property {object|function} [options.possibleVals]
     *      An object with the set of possible choices to display to the user. Unlike the other
     *      list views, the key should be what field the choice corresponds to on the model.
     * @property [options.checkedVal] - the value to set on the model when a checkbox is checked
     * @property [options.unCheckedVal] - the value to set on the model when a checkbox is unchecked
     */
    CheckListView = Backbone.fields.CheckListView = Backbone.fields.RadioListView.extend({
        tagName: 'div',
        type: 'check-list',
        checkedVal: true,
        unCheckedVal: false,
        initialize: function (options) {
            options = this.options = defaults(options || {}, this.options);
            this.checkedVal = !isUndefined(options.checkedVal) ? options.checkedVal : this.checkedVal;
            this.unCheckedVal = !isUndefined(options.unCheckedVal) ? options.unCheckedVal : this.unCheckedVal;
            CheckListView.__super__.initialize.call(this, options);
        },
        setupTwoWay: function () {
            var possibleVals = result(this, 'possibleVals');
            each(possibleVals, function (val, key) {
                var possibleVal = this._parsePossibleVal(possibleVals, key);
                this.listenTo(this.model, 'change:' + possibleVal.value, function () {
                    if (!this._viewChangedModel) { this.renderInput(); }
                    this._viewChangedModel = false;
                });
            }, this);
        },
        getAttrs: function () {
            var attrs = {};
            var self = this;
            this.getInputEl().each(function (index, input) {
                var $input = Backbone.$(input);
                var key = $input.val();
                var val = ($input.prop('checked')) ? self.checkedVal : self.unCheckedVal;
                if (val === self.checkedVal || self.isSelected(key)) {
                    attrs[key] = val;
                }
            });
            return attrs;
        },
        /**
         * Return the model value for a particular
         * possibleVals key.
         * @param  {string} key
         * @return {*}
         */
        getModelVal: function (key) {
            return this.model.get(key);
        },
        /**
         * Renders and returns a single checkbox in a CheckList
         * @memberOf Backbone.fields.CheckListView#
         * @param {string} possibleVal the key from possibleVals
         * @param {boolean} isChecked if the box should be checked or not
         * @param {number} index the index of the checkbox
         * @return {$}
         */
        renderSingleCheckbox: function (possibleVal, isChecked, index) {
            var $listItem;
            var $label;
            var id = this.inputId;
            var attributes = { type: 'checkbox', value: possibleVal.value};

            if (this.addId) { extend(attributes, { name: id, id: (id + '-' + index) }); }
            attributes = extend(attributes, this.inputAttrs);
            if (this.inputClass) { attributes.class = this.inputClass; }
            if (isChecked) { attributes.checked = 'checked'; }
            $listItem = Backbone.$('<input>').attr(attributes);
            $label = Backbone.$('<label>').attr(defaults(this.labelAttrs || {}, { 'class': 'checkbox' }));
            return $label.append($listItem).append(possibleVal.display);
        },
        /**
         * Returns true or false if the checkbox should be selected.
         * @memberOf Backbone.fields.CheckListView#
         * @param {string} key the key of the possibleVal that is being tested
         * @return {boolean}
         */
        isSelected: function (key) {
            return this.getModelVal(key) === this.checkedVal;
        },
        renderInput: function () {
            var key;
            var possibleVals = result(this, 'possibleVals');
            var possibleVal;
            var $checkbox;
            var isSelected;
            var i = 0;
            var $inputWrapper = this.getInputWrapper().empty();

            for (key in possibleVals) {
                if (possibleVals.hasOwnProperty(key)) {
                    possibleVal = this._parsePossibleVal(possibleVals, key);
                    isSelected = this.isSelected(possibleVal.value);
                    $checkbox = this.renderSingleCheckbox(possibleVal, isSelected, i);
                    $inputWrapper.append($checkbox);
                    i++;
                }
            }
            return this;
        }
    });

    // ====================================================
    // CheckBoxView

    /**
     * Creates a single checkbox that corresponds to one attribute in the model
     * @constructor Backbone.fields.CheckBoxView
     * @class Backbone.fields.CheckBoxView
     * @augments {Backbone.fields.FieldView}
     * @property {object} [options]
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.fieldName] inherited from Backbone.fields.FieldView
     * @property {string} [options.templateSrc] inherited from Backbone.fields.FieldView
     * @property {function} [options.template] inherited from Backbone.fields.FieldView
     * @property {object} [options.templateVars] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputId] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputClass] inherited from Backbone.fields.FieldView
     * @property {boolean} [options.twoWay] inherited from Backbone.fields.FieldView
     * @property {object} [options.addId] inherited from Backbone.fields.FieldView
     * @property {object} [options.labelAttrs] inherited from Backbone.fields.RadioListView
     * @property {string} [options.displayText]
     *           Templates can have a label and/or display text for checkboxes. Display text is
     *           intended for longer desciptions of the textbox's purpose.
     * @property [options.checkedVal] - the value to set on the model when a checkbox is checked
     * @property [options.unCheckedVal] - the value to set on the model when a checkbox is unchecked
     */
    CheckBoxView = Backbone.fields.CheckBoxView = Backbone.fields.FieldView.extend({
        checkedVal: true,
        unCheckedVal: false,
        events: function () {
            var events = {};
            events['click ' + this.elementType] = 'onUserUpdate';
            return events;
        },
        initialize: function (options) {
            options = this.options = defaults(options || {}, this.options);
            this.checkedVal = !isUndefined(options.checkedVal) ? options.checkedVal : this.checkedVal;
            this.unCheckedVal = !isUndefined(options.unCheckedVal) ? options.unCheckedVal : this.unCheckedVal;
            this.displayText = options.displayText || this.displayText;
            this.labelAttrs = options.labelAttrs || this.labelAttrs;
            CheckBoxView.__super__.initialize.call(this, options);
        },
        getValue: function () {
            return this.getInputEl().prop('checked');
        },
        getValueForSet: function () {
            if (this.getValue()) {
                return this.checkedVal;
            }
            return this.unCheckedVal;
        },
        /**
         * Returns true or false if the checkbox should be selected
         * @memberOf Backbone.fields.CheckBoxView#
         * @return {boolean}
         */
        isSelected: function () {
            return this.getModelVal() === this.checkedVal;
        },
        renderInput: function () {
            var $label = Backbone.$('<label>').attr(defaults(this.labelAttrs || {}, { 'class': 'checkbox' }));
            var $input = Backbone.$('<' + this.elementType + '>');
            var attributes = { type: 'checkbox' };
            var id = this.inputId;

            if (this.addId) { extend(attributes, { id: id, name: id, value: this.checkedVal }); }
            extend(attributes, this.inputAttrs);
            if (this.inputClass) { attributes.class = this.inputClass; }
            $input.attr(attributes);
            if (this.isSelected()) {
                $input.prop('checked', true);
            }
            $label.append($input);
            if (this.displayText) {
                $label.append(this.displayText);
            }
            this.getInputWrapper().html($label);

            return this;
        }
    });

    // ====================================================
    // FieldSetView

    /**
     * Essentially a subform, an extension of {@link Backbone.FormView}
     * but simply uses a 'fieldset' tag instead. Can be used an a FormView's
     * schema to group fields. FieldSets also default to setup their
     * fields on initialization so that that the top level FormView only
     * has to call setupFields once.
     * @constructor Backbone.FieldSetView
     * @extends {Backbone.FormView}
     * @class Backbone.FieldSetView
     * @property {Object} [options]
     *     Options that you can pass to init or add as properties on extended view
     * @property {String} [options.templateSrc] Inherited from Backbone.FormView
     * @property {String} [options.template] Inherited from Backbone.FormView
     * @property {Object} [options.schema] Inherited from Backbone.FormView
     * @property {Boolean} [options.setupOnInit] Inherited from Backbone.FormView
     * @property {String[]} [options.fieldOrder] Inherited from Backbone.FormView
     * @property {Object} [options.templateVars] Inherited from Backbone.FormView
     * @property {Boolean} [options.autoUpdateModel] Inherited from Backbone.FormView
     * @property {Boolean} [options.twoWay] Inherited from Backbone.FormView
     */
    FieldSetView = Backbone.FieldSetView = Backbone.FormView.extend({
        tagName: 'div',
        setupOnInit: true,
        className: '',
        initialize: function (options) {
            options = this.options = defaults(options || {}, this.options);
            this.fieldSetName = options.fieldSetName || this.fieldSetName || options.schemaKey;
            FieldSetView.__super__.initialize.call(this, options);
            this.$el.addClass(this.className || ('fieldset fieldset-' + this.fieldSetName));
        },
        /**
         * Returns a prefix that the fieldset fields can use to create
         * their unique names and ids
         * @memberOf Backbone.FieldSetView#
         * @return {string}
         */
        getFieldPrefix: getFieldPrefix,
        template: _.template('<% if(obj && obj.label) { %><label class="fieldset-label">' +
            '<strong><%= obj.label %></strong></label><% } %><fieldset data-fields=""></fieldset>')
    });

    /**
     * Like a FieldSet view, except that it's linked to a collection and will add subviews for
     * each model in the collection based on the 'schema' option provided
     * @constructor Backbone.CollectionFieldSetView
     * @extends {Backbone.CollectionFormView}
     * @class Backbone.CollectionFieldSetView
     */
    CollectionFieldSetView = Backbone.CollectionFieldSetView = Backbone.CollectionFormView.extend({
        tagName: 'div',
        template: _.template('<% if(obj && obj.label) { %><p><strong><%= obj.label %></strong></p><% } %>' +
            '<fieldset class="fieldset" data-rows=""></fieldset>'),
        setupOnInit: true,
        className: '',
        initialize: function (options) {
            options = this.options = defaults(options || {}, this.options);
            this.fieldSetName = options.fieldSetName || this.fieldSetName || options.schemaKey;
            CollectionFieldSetView.__super__.initialize.call(this, options);
            this.$el.addClass(this.className || ('fieldset fieldset-' + this.fieldSetName));
            return this;
        },
        /**
         * Returns a prefix that the fieldset fields can use to create
         * their unique names and ids
         * @memberOf Backbone.CollectionFieldSetView#
         * @return {string}
         */
        getFieldPrefix: getFieldPrefix
    });

}(this));
