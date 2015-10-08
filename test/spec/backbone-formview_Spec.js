(function (root, $, Backbone, _) {
    'use strict';

    describe('Backbone.FormView', function () {
        var testForm;
        var testModel;
        var testCollection;
        var testSchema = {
            foo : {
                type: 'Text',
                options : {
                    label: 'Foo',
                    elementType: 'textarea'
                }
            },
            bar : {
                type: 'RadioList',
                options: {
                    label: 'Bar',
                    collection: true,
                    possibleVals: {
                        a : 'Option A',
                        b : 'Option B'
                    }
                }
            },
            baz : {
                type: 'FieldSet',
                options : {
                    schema: {
                        bazFoo : {
                            type : 'Text'
                        }
                    }
                }
            }
        };

        describe('FormView', function () {

            beforeEach(function () {
                testModel = new Backbone.Model({ foo : 'test foo val' });
                testCollection = new Backbone.Collection([new Backbone.Model({ bla : 'test blah val' })]);
                testForm = new Backbone.FormView({
                    model: testModel,
                    collection: testCollection,
                    schema: testSchema
                });
            });

            it('should allow you to set a schema with "setSchema" method', function () {
                var schema = {
                    test : {
                        type : 'Text',
                        options : { label : 'Test setSchema' }
                    }
                };
                testForm.setSchema(schema);
                expect(testForm.schema).toEqual(schema);
            });

            describe('"setupFields" method', function () {

                beforeEach(function () {
                    testForm.setupFields();
                });

                it('should create a subViewConfig from the schema with defaults and resolve an alias to a string constructor', function () {
                    expect(testForm.subViewConfig).toBeDefined();
                    expect(testForm.subViewConfig.foo).toBeDefined();
                    expect(testForm.subViewConfig.foo.construct).toBeDefined();
                    expect(testForm.subViewConfig.foo.singleton).toBe(true);
                    expect(testForm.subViewConfig.foo.location).toBe(testForm.fieldsWrapper);
                });

                it('should setup defaults in the subViewConfig', function () {
                    expect(testForm.subViewConfig).toBeDefined();
                    expect(testForm.subViewConfig.foo).toBeDefined();
                    expect(testForm.subViewConfig.foo.singleton).toBe(true);
                    expect(testForm.subViewConfig.foo.location).toBe(testForm.fieldsWrapper);
                });

                it('should recursively setup Fieldset schemas as well', function () {
                    expect(testForm.subViewConfig.baz.options.subViewConfig).toBeDefined();
                    expect(testForm.subViewConfig.baz.options.subViewConfig.bazFoo).toBeDefined();
                    expect(testForm.subViewConfig.baz.options.subViewConfig.bazFoo.construct).toBeDefined();
                });

                it('should initialize singleton fields', function () {
                    expect(testForm.subs.get('foo') instanceof Backbone.fields.FieldView).toBe(true);
                    expect(testForm.subs.get('bar') instanceof Backbone.fields.RadioListView).toBe(true);
                    expect(testForm.subs.get('baz') instanceof Backbone.FieldSetView).toBe(true);
                    expect(testForm.subs.get('baz').subs.get('bazFoo') instanceof Backbone.fields.FieldView).toBe(true);
                });

                it('should allow user to override singleton and location in schema for a field', function () {
                    testForm.subs.clear();
                    testForm.setSchema({
                        foo: {
                            type: 'Text',
                            singleton: false,
                            location : '.test-location',
                            options: { label: 'Test Overrides' }
                        }
                    });
                    testForm.setupFields().subs.add('foo');
                    expect(Object.prototype.toString.call(testForm.subs.get('foo'))).toBe('[object Array]');
                    expect(testForm.subViewConfig.foo.location).toBe('.test-location');
                });

                it('should automatically set the form\'s model as an option for the fields in the subViewConfig', function () {
                    expect(testForm.subViewConfig.foo.options.model.cid).toBe(testModel.cid);
                    expect(testForm.subs.get('bar').model.cid).toBe(testModel.cid);
                });

                it('should set the form\'s collection on the field if the schema defines an option for collection as true', function () {
                    expect(testForm.subViewConfig.foo.options.collection).toBeUndefined();
                    expect(testForm.subs.get('foo').collection).toBeUndefined();
                    expect(testForm.subViewConfig.bar.options.collection.cid).toBe(testCollection.cid);
                    expect(testForm.subs.get('bar').collection.cid).toBe(testCollection.cid);
                });

                it('should pass a submodel if a schema option val for model is a string that matches a submodel on the form\'s model', function () {
                    var submodel = new Backbone.Model({ test: 'Testing sub model' });
                    testModel.set('testSubModel', submodel);
                    testForm.subs.clear();
                    testForm.setSchema({
                        foo : {
                            type: 'Text',
                            options: { model: 'testSubModel' }
                        }
                    });
                    testForm.setupFields();
                    expect(testForm.subs.get('foo').model.cid).toBe(submodel.cid);
                    expect(testForm.subs.get('foo').model.get('test')).toBe(submodel.get('test'));
                });

                it('should pass a submodel if the schema key matches a submodel on the form model', function () {
                    var submodel = new Backbone.Model({ test: 'Testing sub model' });
                    testModel.set('testSubModel', submodel);
                    testForm.subs.clear();
                    testForm.setSchema({
                        testSubModel : { type: 'Text' }
                    });
                    testForm.setupFields();
                    expect(testForm.subs.get('testSubModel').model.cid).toBe(submodel.cid);
                    expect(testForm.subs.get('testSubModel').model.get('test')).toBe(submodel.get('test'));
                });

                it('should pass a subcollection if a schema option val for collection is a string that matches a collection on the form model', function () {
                    var subcoll = new Backbone.Collection([{ test: 'Testing sub model' }]);
                    testModel.set('testSubColl', subcoll);
                    testForm.subs.clear();
                    testForm.setSchema({
                        foo : {
                            type: 'Text',
                            options: { collection: 'testSubColl' }
                        }
                    });
                    testForm.setupFields();
                    expect(testForm.subs.get('foo').collection.first().get('test')).toBe(subcoll.first().get('test'));
                });

                it('should pass a subcollection if the schema key matches a subcollection on the form model', function () {
                    var subcoll = new Backbone.Collection([{ test: 'Testing sub collection' }]);
                    testModel.set('testSubColl', subcoll);
                    testForm.subs.clear();
                    testForm.setSchema({
                        testSubColl : { type: 'Text' }
                    });
                    testForm.setupFields();
                    expect(testForm.subs.get('testSubColl').collection.first().get('test')).toBe(subcoll.first().get('test'));
                });

            });

            describe('Options', function () {

                describe('setupOnInit', function () {
                    it('should call setupFields on FormView initialization', function () {
                        var orig = Backbone.FormView.prototype.setupFields;
                        var form;
                        spyOn(Backbone.FormView.prototype, 'setupFields');
                        form = new Backbone.FormView({
                            schema: testSchema,
                            setupOnInit: true
                        });
                        expect(form.setupFields).toHaveBeenCalled();
                        Backbone.FormView.prototype.setupFields = orig;
                    });
                });

                describe('validateOnSet', function () {
                    it('should pass a true setOpts option value for validate to fields', function () {
                        var form = new Backbone.FormView({
                            validateOnSet: true,
                            schema: testSchema,
                            model: testModel
                        });
                        form.setupFields();
                        expect(form.subViewConfig.foo.options.setOpts.validate).toBe(true);
                        expect(form.subViewConfig.bar.options.setOpts.validate).toBe(true);
                        expect(form.subViewConfig.baz.options.subViewConfig.bazFoo.options.setOpts.validate).toBe(true);
                    });
                });

                describe('twoWay', function () {
                    it('should pass twoWay option on to field subview config options', function () {
                        var form = new Backbone.FormView({
                            twoWay: true,
                            schema: testSchema,
                            model: testModel,
                            label: 'Test Field'
                        });
                        form.setupFields();
                        expect(form.subViewConfig.foo.options.twoWay).toBe(true);
                        expect(form.subViewConfig.bar.options.twoWay).toBe(true);
                        expect(form.subViewConfig.baz.options.subViewConfig.bazFoo.options.twoWay).toBe(true);
                    });
                });

            });

            describe('"render" method', function () {

                it('should call setupFields if it has not been called yet', function () {
                    spyOn(testForm, 'setupFields');
                    testForm.render();
                    expect(testForm.setupFields).toHaveBeenCalled();
                });

                it('should render and append all fields to the fieldsWrapper when custom locations aren\'t specified', function () {
                    testForm.render();
                    expect(testForm.getFieldsWrapper().children().length).toBe(testForm.subs.subViews.length);
                    expect(testForm.subs.get('foo').$el.parent().is(testForm.getFieldsWrapper())).toBe(true);
                    expect(testForm.subs.get('baz').$el.parent().is(testForm.getFieldsWrapper())).toBe(true);
                });

                it('should render fields in a specific order if fieldOrder form option is specified', function () {
                    testForm.options.fieldOrder = ['baz', 'foo', 'bar'];
                    testForm.render();
                    expect(testForm.subs.get('baz').$el.index()).toBe(0);
                    expect(testForm.subs.get('foo').$el.index()).toBe(1);
                    expect(testForm.subs.get('bar').$el.index()).toBe(2);
                });

                it('should preserve DOM events of subviews/fields when rerendering if they are attached to the DOM', function () {
                    testForm.render();
                    var $testWrapper = $('<div id="test"></div>').hide();
                    var wasTriggered;
                    testForm.subs.get('foo').$el.on('test', function () {
                        wasTriggered = true;
                    });
                    $('body').append($testWrapper);
                    $testWrapper.append(testForm.$el);
                    testForm.subs.get('foo').$el.trigger('test');
                    expect(wasTriggered).toBe(true);
                    wasTriggered = false;
                    testForm.render();
                    testForm.subs.get('foo').$el.trigger('test');
                    expect(wasTriggered).toBe(true);
                    $testWrapper.remove();
                });

            });

        });

        describe('CollectionFormView', function () {
            var testCollectionData = [{
                foo: 'Test 1',
                bar: 'A'
            }, {
                foo: 'Test 2',
                bar: 'B'
            }, {
                foo:  'Test 3',
                bar: 'C'
            }];
            var testOpts;
            beforeEach(function () {
                testCollection = new Backbone.Collection(testCollectionData);
                testOpts = {
                    collection: testCollection,
                    rowSchema: testSchema
                };
                testForm = new Backbone.CollectionFormView(testOpts);
            });

            describe('"setupOnInit" option', function () {
                it('should invoke "setupRows" method in initialization', function () {
                    testOpts.setupOnInit = true;
                    var proto = Backbone.CollectionFormView.prototype;
                    var old = proto.setupRows;
                    var view;
                    spyOn(proto, 'setupRows').and.callThrough();
                    view = new Backbone.CollectionFormView(testOpts);
                    expect(proto.setupRows).toHaveBeenCalled();
                    proto.setupRows = old;
                    expect(view.subs.get('row').length).toBe(view.collection.length);
                });
            });

            describe('"setRowSchema" method', function () {
                it('should allow user to set the schema property on the "rowConfig" property', function () {
                    var schema = {
                        a : {
                            type: 'Text',
                            options: { 'label' : 'Test Label' }
                        }
                    };
                    testForm.setRowSchema(schema);
                    expect(testForm.rowConfig.options.schema).toEqual(schema);
                });
            });
            describe('"setupRows" method', function () {
                it('should add a "row" subview for each member of the collection', function () {
                    testForm.setupRows();
                    expect(testForm.subs.get('row').length).toBe(3);
                    expect(testForm.subs.get('row')[0].model.get('foo')).toBe(testCollectionData[0].foo);
                    expect(testForm.subs.get('row')[1].model.get('foo')).toBe(testCollectionData[1].foo);
                    expect(testForm.subs.get('row')[2].model.get('foo')).toBe(testCollectionData[2].foo);
                });
                it('should remove any exising row subviews if they exists and recreate them from the collection', function () {
                    testForm.setupRows();
                    var cid1 = testForm.subs.get('row')[0].cid;
                    var cid2 = testForm.subs.get('row')[1].cid;
                    testForm.setupRows();
                    expect(testForm.subs.get('row').length).toBe(3);
                    expect(testForm.subs.get('row')[0].cid).not.toBe(cid1);
                    expect(testForm.subs.get('row')[1].cid).not.toBe(cid2);
                });
            });
            describe('"render" method', function () {
                it('should invoke the template function', function () {
                    testForm.template = _.template('<div class="test-div"></div>');
                    spyOn(testForm, 'template').and.callThrough();
                    testForm.render();
                    expect(testForm.template).toHaveBeenCalled();
                });
                it('should render each row subview and place them in the rowWrapper', function () {
                    var rows = testForm.setupRows().subs.get('row');
                    testForm.render();
                    expect(testForm.getRowWrapper().children().length).toBe(3);
                    expect(rows[0].$el.parent().is(testForm.getRowWrapper())).toBe(true);
                });
            });
            describe('"addRow" method', function () {
                it('should add a new "row" subview with a new model as the model', function () {
                    var cids = [];
                    testForm.collection.each(function (model) {
                        cids.push(model.cid);
                    });
                    testForm.setupRows().addRow();
                    expect(testForm.subs.get('row').length).toBe(4);
                    expect(_.indexOf(cids, _.last(testForm.subs.get('row')).model.cid)).toBe(-1);
                });
                it('should use a passed model as the new row\'s model if one is passed', function () {
                    var testVal = 'Test Val 4';
                    testForm.setupRows().addRow({
                        foo: testVal
                    });
                    expect(testForm.subs.get('row')[3].model.get('foo')).toBe(testVal);
                });
            });

            describe('"getRows" method', function () {
                it('should return an array of all of the "row" subviews', function () {
                    testForm.setupRows();
                    expect(testForm.getRows().length).toBe(3);
                    testForm.addRow({
                        foo: 'bar'
                    });
                    expect(testForm.getRows().length).toBe(4);
                    expect(testForm.getRows()[3].model.get('foo')).toBe('bar');
                });
            });

            describe('"deleteRow" method', function () {
                beforeEach(function () {
                    testForm.setupRows();
                });
                it('should remove a row subview and it\'s model from the collection when a row subview is a passed', function () {
                    var view = testForm.subs.get('row')[1];
                    testForm.deleteRow(view);
                    expect(_.findWhere(testForm.subs.get('row'), { cid : view.cid })).toBeFalsy();
                    expect(testForm.collection.get(view.model)).toBeFalsy();
                });
                it('should remove a row subview and it\'s model from the collection when a row subview\'s model is a passed', function () {
                    var view = testForm.subs.get('row')[1];
                    var model = view.model;
                    testForm.deleteRow(model);
                    expect(_.findWhere(testForm.subs.get('row'), { cid : view.cid })).toBeFalsy();
                    expect(testForm.collection.get(model)).toBeFalsy();
                });
            });
            describe('"reset" method', function () {
                it('should invoke "setupRows" and then append new row subviews to inputWrapper', function () {
                    testForm.collection.reset([{
                        foo: 'Test 4',
                        bar: 'D'
                    }, {
                        foo: 'Test 5',
                        bar: 'E'
                    }]);
                    spyOn(testForm, 'setupRows').and.callThrough();
                    testForm.reset();
                    expect(testForm.setupRows).toHaveBeenCalled();
                    expect(testForm.subs.get('row').length).toBe(2);
                    expect(testForm.subs.get('row')[0].model.get('foo')).toBe('Test 4');
                    expect(testForm.getRowWrapper().children().length).toBe(2);
                });
            });

            describe('Backbone.CollectionFormRowView', function () {
                beforeEach(function () {
                    testForm.setupRows();
                });
                describe('"getFieldPrefix" method', function () {
                    it('should return the parentView getFieldPrefix result, plus the index, plus a trailing "-"', function () {
                        var index = 0;
                        var parentPrefix = 'testing-';
                        testForm.getFieldPrefix = function () { return parentPrefix; };
                        expect(testForm.subs.get('row')[index].getFieldPrefix()).toBe(parentPrefix + index + '-');
                    });
                });
                describe('"deleteSelf" method', function () {
                    it('should invoke "deleteRow" method of the parentView with the row instance as the param', function () {
                        var row = testForm.subs.get('row')[1];
                        var length = testForm.subs.get('row').length;
                        spyOn(testForm, 'deleteRow').and.callThrough();
                        row.deleteSelf();
                        expect(testForm.deleteRow).toHaveBeenCalledWith(row);
                        expect(testForm.subs.subViews.length).toBe(length - 1);
                        expect(testForm.collection.length).toBe(length - 1);
                    });
                });
            });

        });

        describe('FieldView', function () {
            var testField;
            var testOpts;
            beforeEach(function () {
                testOpts = {
                    schemaKey: 'testField',
                    model: testModel
                };
                testField = new Backbone.fields.FieldView(testOpts);
            });

            describe('Options', function () {
                describe('fieldName', function () {
                    it('should default to schemaKey option if provided', function () {
                        expect(testField.fieldName).toBe(testField.options.schemaKey);
                    });
                });
                describe('twoWay', function () {
                    it('should invoke "setupTwoWay" method on initialization', function () {
                        var view;
                        var oldSetupTwoWay = Backbone.fields.FieldView.prototype.setupTwoWay;
                        spyOn(Backbone.fields.FieldView.prototype, 'setupTwoWay');
                        testOpts.twoWay = true;
                        view = new Backbone.fields.FieldView(testOpts);
                        expect(view.setupTwoWay).toHaveBeenCalled();
                        Backbone.fields.FieldView.prototype.setupTwoWay = oldSetupTwoWay;
                    });
                });
                describe('addId', function () {
                    it('should default to true', function () {
                        expect(testField.addId).toBe(true);
                    });
                    it('should automatically generate an id for the input and set it as a templateVar if true, and not if false', function () {
                        expect(testField.inputId).toBeDefined();
                        expect(testField.inputId).toBe(testField.inputPrefix + testField.options.schemaKey);
                    });
                });
                describe('className', function () {
                    it('should generate a class for the field view element from the fieldName, or use one provided as an option', function () {
                        expect(testField.$el.attr('class')).toBe('form-field-' + testField.options.schemaKey + ' control-group form-field');
                        testField = new Backbone.fields.FieldView({ schemaKey: 'testField', model: testModel, fieldName: 'testFieldName', className: 'test-class' });
                        expect(testField.$el.attr('class')).toBe('test-class');
                    });
                });
            });
            it('should return the first element that matches the input wrapper selector when "getInputWrapper" method is called', function () {
                testField.$el.html('<div class="foo"></div><div data-input="" class="one"></div><div class="two"></div>');
                var $wrapper = testField.getInputWrapper();
                expect($wrapper.length).toBe(1);
                expect($wrapper.attr('class')).toBe('one');
            });
            describe('"render" method', function () {
                it('should invoke the "renderWrapper" and "renderInput" methods', function () {
                    spyOn(testField, 'renderWrapper').and.callThrough();
                    spyOn(testField, 'renderInput');
                    testField.render();
                    expect(testField.renderWrapper).toHaveBeenCalled();
                    expect(testField.renderInput).toHaveBeenCalled();
                });
                it('should invoke the template function and place it view el when "renderWrapper" is called', function () {
                    var html = '<div class="test-wrapper-div"><label><%= obj.label %></label></div>';
                    var testLabel = 'Test Label';
                    var renderedHtml = html.replace('<%= obj.label %>', testLabel);
                    var vars = { label: testLabel };
                    testField.template = _.template(html);
                    testField.templateVars = vars;
                    spyOn(testField, 'template').and.callThrough();
                    testField.renderWrapper();
                    expect(testField.template).toHaveBeenCalled();
                    expect(testField.$el.html()).toBe(renderedHtml);
                });
                describe('"renderInput" method', function () {
                    beforeEach(function () {
                        testField.renderWrapper();
                    });
                    it('should create the input element and put it in the inputWrapper', function () {
                        testField.renderInput();
                        expect(testField.$('input').length).toBe(1);
                    });
                    it('should assign field properties "inputId" as the id and name, and "inputClass" as the class attribute of the input', function () {
                        testField.inputId = 'test-id';
                        testField.inputClass = 'test-class';
                        testField.renderInput();
                        expect(testField.$('input').attr('id')).toBe('test-id');
                        expect(testField.$('input').attr('class')).toBe('test-class');
                        expect(testField.$('input').attr('name')).toBe('test-id');
                    });
                    it('should set the input attribute "placeholder" based on the property of the same name', function () {
                        var testPlaceholder = 'Test placeholder...';
                        testField.placeholder = testPlaceholder;
                        testField.renderInput();
                        expect(testField.$('input').attr('placeholder')).toBe(testPlaceholder);
                        testField.placeholder = null;
                        testField.renderInput();
                        expect(testField.$('input').attr('placeholder')).toBeUndefined();
                    });
                    it('should set keys and values of "inputAttrs" option/property as attributes on input element', function () {
                        var attrs = {
                            maxlength: 100,
                            'data-test-attr': 'foo'
                        };
                        testField.inputAttrs = attrs;
                        testField.renderInput();
                        expect(testField.$(testField.elementType).attr('maxlength')).toBe(String(attrs.maxlength));
                        expect(testField.$(testField.elementType).attr('data-test-attr')).toBe(attrs['data-test-attr']);
                    });
                    it('should set the value of the input to be the return value of the "getValueForInput" method', function () {
                        spyOn(testField, 'getValueForInput').and.callFake(function () {
                            return 'test input val';
                        });
                        testField.renderInput();
                        expect(testField.$('input').val()).toBe('test input val');
                    });
                    it('should set the element type of the input to be the value of the elementType property', function () {
                        testField.elementType = 'textarea';
                        testField.renderInput();
                        expect(testField.getInputWrapper().children().length).toBe(1);
                        expect(testField.getInputWrapper().children('textarea').length).toBe(1);
                    });
                });
            });
            describe('"setupTwoWay" method', function () {
                it('should bind event that invokes "renderInput" method if the model field changes, but not if changed by this field\'s input', function () {
                    testField.setupTwoWay();
                    testField.render();
                    spyOn(testField, 'renderInput');
                    testField.model.set(testField.options.schemaKey, 'test value');
                    expect(testField.renderInput).toHaveBeenCalled();
                    testField.renderInput = Backbone.fields.FieldView.prototype.renderInput;
                    testField.render();
                    spyOn(testField, 'renderInput');
                    testField.$('input').val('test another val').trigger('blur');
                    expect(testField.renderInput).not.toHaveBeenCalled();
                });
            });
            describe('"disable" method', function () {
                beforeEach(function () {
                    testField.elementType = 'textarea';
                    testField.render();
                });
                it('should add disabled attribute to input element if it does not already have it', function () {
                    testField.disable();
                    expect(testField.$(testField.elementType).attr('disabled')).toBeTruthy();
                });
                it('should set "isDisabled" flag to true', function () {
                    expect(testField.isDisabled).toBeFalsy();
                    testField.disable();
                    expect(testField.isDisabled).toBe(true);
                });
                describe('"enable" method', function () {
                    it('should remove disabled attribute and set "isDisabled" to false', function () {
                        testField.$(testField.elementType).prop('disabled', true);
                        testField.isDisabled = true;
                        testField.enable();
                        expect(testField.isDisabled).toBe(false);
                        expect(testField.$(testField.elementType).prop('disabled')).toBe(false);
                    });
                });
            });
            describe('"getValueForInput" method', function () {
                beforeEach(function () {
                    testField.render();
                });
                it('should call "getModelVal" and pass on the result by default', function () {
                    var modelVal = testModel.get(testField.fieldName);
                    var valForInput;
                    expect(testField.getModelVal()).toBe(modelVal);
                    spyOn(testField, 'getModelVal').and.callThrough();
                    valForInput = testField.getValueForInput();
                    expect(testField.getModelVal).toHaveBeenCalled();
                    expect(valForInput).toBe(modelVal);
                });
            });
            describe("Setting model attributes from the input value", function () {
                var testVal = 'Test Value';
                beforeEach(function () {
                    testField.render();
                    testField.$(testField.elementType).val(testVal);
                });
                describe('"getValue" method', function () {
                    it('should return the value of the input', function () {
                        expect(testField.getValue()).toBe(testVal);
                    });
                    it('should trim whitespace from the beginning and end of the input value', function () {
                        testField.$(testField.elementType).val(' foo bar ');
                        expect(testField.getValue()).toBe('foo bar');
                    });
                });
                describe('"getValueForSet" method', function () {
                    it('should invoke getValue and pass on it\'s result by default', function () {
                        spyOn(testField, 'getValue').and.callThrough();
                        var val = testField.getValueForSet();
                        expect(testField.getValue).toHaveBeenCalled();
                        expect(val).toBe(testField.getValue());
                    });
                });
                describe('"getAttrs" method', function () {
                    it('should return an object with the field name as the key and the input value as the result', function () {
                        var attrs = {};
                        attrs[testField.fieldName] = testVal;
                        spyOn(testField, 'getValue').and.callThrough();
                        expect(testField.getAttrs()).toEqual(attrs);
                        expect(testField.getValue).toHaveBeenCalled();
                    });
                });
                describe('"setModelAttrs" method', function () {
                    it('should set the object returned by getAttrs method on the model', function () {
                        spyOn(testField, 'getAttrs').and.callThrough();
                        testField.setModelAttrs();
                        expect(testField.model.get(testField.fieldName)).toBe(testVal);
                        expect(testField.getAttrs).toHaveBeenCalled();
                    });
                });
                it('should occur when user changes input value and exits the field input', function () {
                    var calledSetModelAttrs = false;
                    var old = Backbone.fields.FieldView.prototype.setModelAttrs;
                    Backbone.fields.FieldView.prototype.setModelAttrs = function (e) {
                        calledSetModelAttrs = true;
                        old.call(this, e);
                    };
                    testField = new Backbone.fields.FieldView(testOpts).render();
                    testField.$('input').val(testVal).trigger('blur');
                    expect(calledSetModelAttrs).toBe(true);
                    expect(testField.model.get(testField.fieldName)).toBe(testVal);
                    Backbone.fields.FieldView.prototype.setModelAttrs = old;
                });
                it('should happen according to options.updateEvents when specified', function () {
                    var myModel = new Backbone.Model({foo: 'bar'});
                    var $input;
                    var myFieldView;
                    spyOn(Backbone.fields.FieldView.prototype, 'onUserUpdate');
                    myFieldView = new Backbone.fields.FieldView({
                        fieldName: 'foo',
                        updateEvents: ['keyup'],
                        model: myModel
                    });
                    myFieldView.render();
                    $input = myFieldView.$('input');
                    $input.val('baz');
                    $input.trigger('keyup');
                    expect(myFieldView.onUserUpdate).toHaveBeenCalled();
                });
            });
        });

        describe('RadioListView', function () {
            var testField;
            var testOpts;
            beforeEach(function () {
                testOpts = {
                    schemaKey: 'testField',
                    model: testModel,
                    possibleVals: {
                        foo : 'Test Val foo',
                        bar : 'Test Val bar',
                        baz : 'Test Val baz'
                    }
                };
                testField = new Backbone.fields.RadioListView(testOpts);
            });
            describe('"isSelected" method', function () {
                beforeEach(function () {
                    testField.model = new Backbone.Model({ testField: 'bar' });
                });
                it('should return "true" if the model field matches the provided key and "false" otherwise', function () {
                    expect(testField.isSelected('foo')).toBe(false);
                    expect(testField.isSelected('bar')).toBe(true);
                    expect(testField.isSelected('baz')).toBe(false);
                });
            });
            describe('"renderInput" method', function () {
                it('should create a set of radio button inputs with value attributes of the keys in the "possibleVals" property/option', function () {
                    testField.render();
                    var radios = testField.$('input[type="radio"]');
                    expect(radios.length).toBe(3);
                    expect(radios.eq(0).val()).toBe('foo');
                    expect(radios.eq(1).val()).toBe('bar');
                    expect(radios.eq(2).val()).toBe('baz');
                });
                it('should create a label around the radio with text being the value of the "possibleVals" property/option', function () {
                    var radios = testField.render().$('input[type="radio"]');
                    expect(radios.eq(0).parent('label').text()).toBe(testOpts.possibleVals.foo);
                    expect(radios.eq(1).parent('label').text()).toBe(testOpts.possibleVals.bar);
                    expect(radios.eq(2).parent('label').text()).toBe(testOpts.possibleVals.baz);
                });
                it('should also work if "possibleVals" is a function that returns an object', function () {
                    testField.possibleVals = function () {
                        return {
                            'a' : "test val a",
                            'b' : "test val b"
                        };
                    };
                    testField.render();
                    var radios = testField.$('input[type="radio"]');
                    expect(radios.length).toBe(2);
                    expect(radios.eq(0).val()).toBe('a');
                    expect(radios.eq(0).parent().text()).toBe('test val a');
                    expect(radios.eq(1).val()).toBe('b');
                    expect(radios.eq(1).parent().text()).toBe('test val b');
                });
                it('should also work if the result of "possibleVals" is an array, setting both "value" attr and label text to array values', function () {
                    testField.possibleVals = ['test val a', 'test val b'];
                    testField.render();
                    var radios = testField.$('input[type="radio"]');
                    expect(radios.length).toBe(2);
                    expect(radios.eq(0).val()).toBe('test val a');
                    expect(radios.eq(0).parent().text()).toBe('test val a');
                    expect(radios.eq(1).val()).toBe('test val b');
                    expect(radios.eq(1).parent().text()).toBe('test val b');
                });
                it('should also work if the result of "possibleVals" is an array of objects with a "value" and "display property', function () {
                    testField.possibleVals = [{ display: 'test val a', value: 'a' }, { display: 'test val b', value: 'b' }];
                    testField.render();
                    var radios = testField.$('input[type="radio"]');
                    expect(radios.length).toBe(2);
                    expect(radios.eq(0).val()).toBe('a');
                    expect(radios.eq(0).parent().text()).toBe('test val a');
                    expect(radios.eq(1).val()).toBe('b');
                    expect(radios.eq(1).parent().text()).toBe('test val b');
                });
                it('should not check any radio buttons if there is no model value', function () {
                    testField.render();
                    expect(testField.$('input:checked').length).toBe(0);
                });
                it('should check the radio button with a value that matches the value for the field on the model', function () {
                    testField.model.set(testField.fieldName, 'bar');
                    testField.render();
                    expect(testField.$('input:checked').length).toBe(1);
                    expect(testField.$('input:checked').val()).toBe('bar');
                });
                it('should set inputClass on each radio if defined', function () {
                    var testClass = 'test-class';
                    testField.inputClass = testClass;
                    testField.render();
                    var radios = testField.$('input[type="radio"]');
                    var i = 0;
                    for (i; i < radios.length; i++) {
                        expect(radios.eq(i).attr('class')).toBe(testClass);
                    }
                });
                it('should set value of inputId on each radio\'s name and id attribute if defined', function () {
                    var testId = 'test-id';
                    testField.inputId = testId;
                    testField.render();
                    var radios = testField.$('input[type="radio"]');
                    var i = 0;
                    for (i; i < radios.length; i++) {
                        expect(radios.eq(i).attr('id')).toBe(testId + '-' + i);
                        expect(radios.eq(i).attr('name')).toBe(testId);
                    }
                });
            });
            it('should return the value of the checked input when calling the "getValue" method', function () {
                testField.model.set(testField.fieldName, 'bar');
                testField.render();
                expect(testField.getValue()).toBe('bar');
            });
            it('should set the value of the checked radio when a radio is clicked on', function () {
                $('body').append('<div id="page"></div>');
                $('#page').append(testField.render().el);
                testField.$('input[value="baz"]').prop('checked', true).trigger('click');
                expect(testField.model.get('testField')).toBe('baz');
                $('#page').remove();
            });
        });

        describe('SelectListView', function () {
            var testField;
            var testOpts;
            beforeEach(function () {
                testOpts = {
                    schemaKey: 'testField',
                    model: testModel,
                    possibleVals: {
                        foo : 'Test Val foo',
                        bar : 'Test Val bar',
                        baz : 'Test Val baz'
                    }
                };
                testField = new Backbone.fields.SelectListView(testOpts);
            });
            describe('"isSelected" method', function () {
                it('should return true for a single select if the value of the attribute in the model matches the key passed and false otherwise', function () {
                    testField.model = new Backbone.Model({ testField: 'bar' });
                    expect(testField.isSelected('foo')).toBe(false);
                    expect(testField.isSelected('bar')).toBe(true);
                    expect(testField.isSelected('baz')).toBe(false);
                });
                it('should return true for a multi select if the array value of the attribute in the model contains the key passed, and false otherwise', function () {
                    testOpts.multiple = true;
                    testOpts.model = new Backbone.Model({ testField: ['bar', 'baz'] });
                    testField = new Backbone.fields.SelectListView(testOpts);
                    expect(testField.isSelected('foo')).toBe(false);
                    expect(testField.isSelected('bar')).toBe(true);
                    expect(testField.isSelected('baz')).toBe(true);
                });
            });
            describe('"renderInput" method', function () {

                beforeEach(function () {
                    testField.renderWrapper();
                });

                it('should create a select element with "possibleVals" option/property as the options', function () {
                    testField.renderInput();
                    expect(testField.getInputWrapper().children('select').length).toBe(1);
                    expect(testField.getInputWrapper().find('select > option').eq(0).attr('value')).toBe('foo');
                    expect(testField.getInputWrapper().find('select > option').eq(1).attr('value')).toBe('bar');
                    expect(testField.getInputWrapper().find('select > option').eq(2).attr('value')).toBe('baz');
                });

                it('should allow nested objects for the possibleVals option/property and create optgroups based on them', function () {
                    testField.possibleVals = {
                        foo : {
                            fooFoo : 'Test fooFoo',
                            fooBar : 'Test fooBar'
                        },
                        bar : 'Test bar'
                    };
                    testField.renderInput();
                    expect(testField.$('select > optgroup').length).toBe(1);
                    expect(testField.$('select > optgroup > option').eq(0).attr('value')).toBe('fooFoo');
                    expect(testField.$('select > optgroup > option').eq(0).text()).toBe('Test fooFoo');
                    expect(testField.$('select > optgroup > option').eq(1).attr('value')).toBe('fooBar');
                    expect(testField.$('select > optgroup > option').eq(1).text()).toBe('Test fooBar');
                    expect(testField.$('select > option').eq(0).attr('value')).toBe('bar');
                    expect(testField.$('select > option').eq(0).text()).toBe('Test bar');
                });

                it('should allow possibleVals to be an array of objects with keys "display" and "value" or "group" for optgroups', function () {
                    testField.possibleVals = [{
                        display: "foo",
                        group: [{ value: "fooFoo", display: "Test fooFoo" }, { value: 'fooBar', display: 'Test fooBar' }]
                    }, {
                        display: 'Test bar',
                        value: 'bar'
                    }];
                    testField.renderInput();
                    expect(testField.$('select > optgroup').length).toBe(1);
                    expect(testField.$('select > optgroup > option').eq(0).attr('value')).toBe('fooFoo');
                    expect(testField.$('select > optgroup > option').eq(0).text()).toBe('Test fooFoo');
                    expect(testField.$('select > optgroup > option').eq(1).attr('value')).toBe('fooBar');
                    expect(testField.$('select > optgroup > option').eq(1).text()).toBe('Test fooBar');
                    expect(testField.$('select > option').eq(0).attr('value')).toBe('bar');
                    expect(testField.$('select > option').eq(0).text()).toBe('Test bar');
                });

                it('should render a multi-select if multiple option/property is true, which sets and returns arrays', function () {
                    var val = ['foo', 'baz'];
                    testField.model.set(testField.fieldName, val);
                    testField.multiple = true;
                    testField.renderInput();
                    expect(testField.$('select').attr('multiple')).toBeTruthy();
                    expect(testField.$('select').val()).toEqual(val);
                });

                it('should have the inputClass attribute and the inputId attributes on the element based on the properties of the same name', function () {
                    testField.renderInput();
                    expect(testField.$('select').attr('class')).toBeUndefined();
                    expect(testField.$('select').attr('id')).toBe('field-input-testField');
                    testField.inputClass = 'test-class';
                    testField.inputId = 'test-id';
                    testField.renderInput();
                    expect(testField.$('select').attr('class')).toBe('test-class');
                    expect(testField.$('select').attr('id')).toBe('test-id');
                });
            });

            it('should set the value of the field on the model to be the value of the select on a "change" event', function () {
                var val = 'bar';
                testField.render().$('select').val(val).trigger('change');
                expect(testField.model.get(testField.fieldName)).toBe(val);
            });
        });

        describe('CheckListView', function () {
            var testField;
            var testOpts;
            beforeEach(function () {
                testOpts = {
                    schemaKey: 'testField',
                    model: testModel,
                    possibleVals: {
                        foo : 'Test Val foo',
                        bar : 'Test Val bar',
                        baz : 'Test Val baz'
                    }
                };
                testField = new Backbone.fields.CheckListView(testOpts);
            });
            describe('"setupTwoWay" method', function () {
                it('should call renderInput when one of the possibleVals keys changes on the model', function () {
                    spyOn(testField, 'renderInput');
                    testField.setupTwoWay();
                    testField.model.set('not-checklist-field');
                    expect(testField.renderInput).not.toHaveBeenCalled();
                    testField.model.set('bar', testField.checkedVal);
                    expect(testField.renderInput).toHaveBeenCalled();
                });
            });

            describe('"renderSingleCheckbox" method', function () {
                it('should create a checked checkbox input if passed true', function () {
                    var $checkbox = testField.renderSingleCheckbox({ value: 'foo', display: testOpts.possibleVals.foo }, true, 1);
                    expect($checkbox.find('input').val()).toBe('foo');
                    expect($checkbox.find('input').is(':checked')).toBe(true);
                });
                it('should create an un checked checkbox input if passed false', function () {
                    var $checkbox = testField.renderSingleCheckbox({ value: 'foo', display: testOpts.possibleVals.foo }, false, 1);
                    expect($checkbox.find('input').val()).toBe('foo');
                    expect($checkbox.find('input').is(':checked')).toBe(false);
                });
            });
            describe('"renderInput" method', function () {
                beforeEach(function () {
                    testField.renderWrapper();
                });
                it('should create a checkbox input for each of the possibleVals option/property', function () {
                    testField.renderInput();
                    expect(testField.$('input[type="checkbox"]').eq(0).val()).toBe('foo');
                    expect(testField.$('input[type="checkbox"]').eq(1).val()).toBe('bar');
                    expect(testField.$('input[type="checkbox"]').eq(2).val()).toBe('baz');
                });
                it('should add an id attribute with the inputId property plus the index of the checkbox', function () {
                    testField.renderInput();
                    expect(testField.$('input[type="checkbox"]').eq(0).attr('id')).toBe(testField.inputId + '-' + '0');
                    expect(testField.$('input[type="checkbox"]').eq(1).attr('id')).toBe(testField.inputId + '-' + '1');
                    expect(testField.$('input[type="checkbox"]').eq(2).attr('id')).toBe(testField.inputId + '-' + '2');
                });
                it('should set the checkboxes as checked based on whether the checkbox value in the model is equal to the "checkedVal" property', function () {
                    testField.model.set('foo', testField.unCheckedVal);
                    testField.model.set('bar', testField.checkedVal);
                    testField.model.set('baz', testField.checkedVal);
                    testField.renderInput();
                    expect(testField.$('input').eq(0).prop('checked')).toBe(false);
                    expect(testField.$('input').eq(1).prop('checked')).toBe(true);
                    expect(testField.$('input').eq(2).prop('checked')).toBe(true);
                });
                it('should set the inputClass and an indexed input id on each of the input elements', function () {
                    testField.renderInput();
                    var i = 0;
                    var $inputs = testField.$('input');
                    var $input;
                    for (i; i < $inputs.length; i++) {
                        $input = $inputs.eq(i);
                        expect($input.attr('id')).toBe('field-input-testField-' + i);
                        expect($input.attr('class')).toBeUndefined();
                    }
                    testField.inputId = 'test-id';
                    testField.inputClass = 'test-class';
                    testField.renderInput();
                    $inputs = testField.getInputEl();
                    for (i = 0; i < $inputs.length; i++) {
                        $input = $inputs.eq(i);
                        expect($input.attr('id')).toBe('test-id-' + i);
                        expect($input.attr('class')).toBe('test-class');
                    }
                });
            });
            describe('"isSelected" method', function () {
                it('should return true when the attribute is set to the checkedVal on the model', function () {
                    testField.model.set('bar', testField.checkedVal);
                    expect(testField.isSelected('bar')).toBe(true);
                });
                it('should return false when the attribute is set to the unCheckedVal on the model', function () {
                    testField.model.set('foo', testField.unCheckedVal);
                    expect(testField.isSelected('foo')).toBe(false);
                });
            });
            it('should set a field on the model that corresponds to the checkbox value attribute when clicked on', function () {
                $('body').append('<div id="page" style="display: none;"></div>');
                $('#page').append(testField.render().$el);
                var $barInput = testField.$('input[value="bar"]');
                $barInput.prop('checked', false).trigger('click');
                expect(testField.model.get('bar')).toBe(testField.checkedVal);
                $barInput.trigger('click');
                expect(testField.model.get('bar')).toBe(testField.unCheckedVal);
                $('#page').remove();
            });
        });

        describe('CheckBoxView', function () {
            var testField;
            var testOpts;
            beforeEach(function () {
                testOpts = {
                    schemaKey: 'testField',
                    model: new Backbone.Model()
                };
                testField = new Backbone.fields.CheckBoxView(testOpts);
            });
            describe('"renderInput" method', function () {
                beforeEach(function () {
                    testField.renderWrapper();
                });
                it('should place a checkbox input in the input wrapper with a value of the fieldName', function () {
                    testField.renderInput();
                    var $wrapper = testField.getInputWrapper();
                    expect($wrapper.children('label').children('input[type="checkbox"]').length).toBe(1);
                    expect($wrapper.children('label').children('input[type="checkbox"]').attr('value')).toBe(String(testField.checkedVal));
                });
                it('should be checked if model field value matches "checkbedVal" property/option and unchecked otherwise', function () {
                    testField.checkedVal = 'Yes';
                    testField.unCheckedVal = 'No';
                    testField.renderInput();
                    expect(testField.$(testField.elementType).prop('checked')).toBe(false);
                    testField.model.set(testField.fieldName, 'Yes');
                    testField.renderInput();
                    expect(testField.$(testField.elementType).prop('checked')).toBe(true);
                    testField.model.set(testField.fieldName, 'foo');
                    testField.renderInput();
                    expect(testField.$(testField.elementType).prop('checked')).toBe(false);
                });
            });
            describe('"getValueForSet" method', function () {
                beforeEach(function () {
                    testField.render();
                });
                it('should return the checkedVal property/option of the checkbox view if checked, and the unCheckedVal option/proptery if uncheched', function () {
                    testField.checkedVal = 'Yes';
                    testField.unCheckedVal = 'No';
                    testField.render();
                    expect(testField.getValueForSet()).toBe(testField.unCheckedVal);
                    testField.$('input').prop('checked', true);
                    expect(testField.getValueForSet()).toBe(testField.checkedVal);
                    testField.$('input').prop('checked', false);
                    expect(testField.getValueForSet()).toBe(testField.unCheckedVal);
                });
                it('should be invoked when click event occurs on the input', function () {
                    $('body').append('<div id="page" style="display: none;"></div>');
                    $('#page').append(testField.render().$el);
                    spyOn(testField, 'getValueForSet').and.callThrough();
                    testField.$('input').trigger('click');
                    expect(testField.getValueForSet).toHaveBeenCalled();
                    expect(testField.model.get(testField.fieldName)).toBe(testField.checkedVal);
                    $('#page').remove();
                });
            });
        });

        describe('FieldSetView', function () {
            var testFieldSet;
            var testOpts;
            beforeEach(function () {
                testModel = new Backbone.Model();
                testOpts = {
                    model: testModel,
                    schema: testSchema,
                    schemaKey: 'testFieldSet'
                };
                testFieldSet = new Backbone.FieldSetView(testOpts);
            });
            it('should default fieldSetName proptery/option to schemaKey', function () {
                expect(testFieldSet.fieldSetName).toBe(testFieldSet.options.schemaKey);
                testFieldSet = new Backbone.FieldSetView({
                    model: testModel,
                    schema: testSchema,
                    fieldSetName: 'testNewName'
                });
                expect(testFieldSet.fieldSetName).toBe('testNewName');
            });
            describe('"getFieldPrefix" method', function () {
                it('should invoke the fieldSet parent view\'s getFieldPrefix method and return the result of that plus the fieldSetName property', function () {
                    var parentView = new Backbone.BaseView();
                    var parentPref = 'test-parent-prefix-';
                    parentView.getFieldPrefix = function () {
                        return parentPref;
                    };
                    testFieldSet.parentView = parentView;
                    expect(testFieldSet.getFieldPrefix()).toBe(parentPref + testFieldSet.fieldSetName + '-');
                });
            });
        });

        describe('CollectionFieldSetView', function () {
            var testFieldSet;
            var testOpts;
            var testColl;
            beforeEach(function () {
                testColl = new Backbone.Collection();
                testOpts = {
                    collection: testColl,
                    rowSchema: testSchema,
                    schemaKey: 'testFieldSet'
                };
                testFieldSet = new Backbone.CollectionFieldSetView(testOpts);
            });
            it('should default fieldSetName proptery/option to schemaKey', function () {
                expect(testFieldSet.fieldSetName).toBe(testFieldSet.options.schemaKey);
                testFieldSet = new Backbone.FieldSetView({
                    model: testModel,
                    schema: testSchema,
                    fieldSetName: 'testNewName'
                });
                expect(testFieldSet.fieldSetName).toBe('testNewName');
            });
        });

    });

}(this, jQuery, Backbone, _)); //eslint-disable-line no-undef
