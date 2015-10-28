(function (root, $, Backbone, _) {
    'use strict';

    describe('Backbone.BaseView', function () {
        var testData = [{
            firstName: 'Joe',
            lastName: 'Shmoe',
            registered: true
        }, {
            firstName: 'Sara',
            lastName: 'Shmara',
            registered: true
        }, {
            firstName: 'Harry',
            lastName: 'Shmarry',
            registered: false
        }];
        var testCollection = new Backbone.Collection(testData);
        var testView;
        var toString = Object.prototype.toString;
        var ViewWithOpts = Backbone.BaseView.extend({
            initialize: function (options) {
                this.options = options;
            }
        });
        var TableView = Backbone.BaseView.extend({
            tagName: 'table',
            template: _.template('<thead></thead><tbody></tbody>'),
            subViewConfig: {
                row : {
                    construct: 'RowView',
                    location: 'tbody'
                },
                headingRow: {
                    construct: 'HeadingRowView',
                    location: 'thead',
                    singleton: true
                }
            },
            setup: function () {
                this.subs.add('headingRow', {
                    cols: ['First Name', 'Last Name', 'Actions']
                });
                this.collection.each(function (rowModel) {
                    this.subs.add('row', { model: rowModel });
                }, this);
                return this;
            },
            render: function () {
                this.$el.html(this.template());
                return this;
            },
            renderSubs: function () {
                this.subs.renderAppend({ clearLocations: true });
                return this;
            },
            viewEvents: {
                'submit' : function (arg, view) {
                    this.wasSubmitted = true;
                    this.submissionArg = arg;
                    this.submissionView = view;
                }
            }
        });
        var RowView = Backbone.BaseView.extend({
            tagName: 'tr',
            autoInitSubViews: true,
            subViewConfig: {
                a: {
                    singleton: true,
                    construct: 'Backbone.BaseView'
                }
            },
            initialize: function (opts) { this.options = opts; }
        });
        var HeadingRowView = Backbone.BaseView.extend({
            tagName: 'tr',
            initialize: function (opts) { this.options = opts; }
        });

        var ActionsView = Backbone.BaseView.extend({
            tagName: 'td',
            initialize: function (opts) { this.options = opts; }
        });

        _.extend(root, {
            TableView : TableView,
            RowView : RowView,
            HeadingRowView: HeadingRowView,
            ActionsView : ActionsView
        });

        beforeEach(function () {
            testView = new TableView({
                collection : testCollection
            });
        });

        it('should create a subview manager', function () {
            expect(testView.subs).toBeDefined();
            expect(typeof testView.subs.get).toBe('function');
            expect(typeof testView.subs.renderByKey).toBe('function');
            expect(typeof testView.subs.filteredSubs).toBe('function');
            expect(toString.call(testView.subs.subViews)).toBe('[object Array]');
        });

        describe('SubViewManager', function () {

            describe('Adding and Retrieving SubViews', function () {

                describe('with the "add" method', function () {

                    var data = {
                        firstName: 'Jeff',
                        lastName: 'Schmeff',
                        registered: false
                    };
                    var model = new Backbone.Model(data);

                    it('should allow you to add subviews for prededfined non-singleton types', function () {

                        var beforeLength = testView.subs.subViews.length;

                        testView.subs.add('row', {
                            model: model
                        });

                        expect(testView.subs.subViews.length).toBeGreaterThan(beforeLength);
                        expect(testView.subs.last().model.cid).toEqual(model.cid);
                    });

                    it('should return an array when asking for non-singleton types with "get"', function () {
                        testView.subs.add('row', {
                            model: model
                        });
                        expect(toString.call(testView.subs.get('row'))).toBe('[object Array]');
                    });

                    it('should allow you to only add one prededfined singleton subview', function () {
                        var headingRow = testView.subs.get('headingRow');
                        expect(headingRow).toBeUndefined();
                        testView.subs.add('headingRow', {
                            testFlag: 'First Addition'
                        });
                        testView.subs.add('headingRow', {
                            testFlag: 'Second Addition'
                        });
                        expect(testView.subs.last().options.testFlag).toBe('First Addition');
                    });

                    it('should return an instance when asking for a singleton with "get"', function () {
                        testView.subs.add('headingRow', {
                            testFlag: 'First Addition'
                        });
                        testView.subs.add('headingRow', {
                            testFlag: 'Second Addition'
                        });
                        expect(testView.subs.get('headingRow') instanceof HeadingRowView).toBe(true);
                        expect(testView.subs.get('headingRow').options.testFlag).toBe('First Addition');
                    });

                    it('should allow you to dynamically add a subview of a type that hasn\'t been defined yet', function () {
                        var view = new Backbone.View({
                            model: model
                        });
                        var beforeLen = testView.subs.subViews.length;
                        testView.subs.add('testNotPredefinedType', view);
                        expect(testView.subs.last().cid).toBe(view.cid);
                        expect(testView.subs.subViews.length).toBeGreaterThan(beforeLen);
                    });

                    it('should allow you to dynamically add a singleton subview that hasn\'t been defined yet', function () {
                        var view = new Backbone.View({
                            model: model
                        });
                        var beforeLen = testView.subs.subViews.length;
                        testView.subs.add('testNotPredefinedType', view, true);
                        expect(testView.subs.last().cid).toBe(view.cid);
                        expect(testView.subs.subViews.length).toBeGreaterThan(beforeLen);
                        expect(testView.subs.get('testNotPredefinedType').cid).toBe(view.cid);
                    });

                    it('should allow you add an array of instances as a particular type of subviews', function () {
                        var model1 = testCollection.at(0);
                        var model2 = testCollection.at(1);
                        var view1 = new RowView({
                            model: model1
                        });
                        var view2 = new RowView({
                            model: model2
                        });

                        testView.subs.add('row', [{
                            model: model1
                        }, {
                            model: model2
                        }]);
                        expect(testView.subs.get('row').length).toBe(2);
                        expect(testView.subs.get('row')[0].model.cid).toBe(model1.cid);
                        expect(testView.subs.get('row')[1].model.cid).toBe(model2.cid);

                        testView.subs.add('row', [view1, view2]);
                        expect(testView.subs.get('row').length).toBe(4);
                        expect(testView.subs.last().cid).toBe(view2.cid);
                        expect(testView.subs.get('row')[2].cid).toBe(view1.cid);
                    });

                    it('should allow you to add subviews by passing an object literal map', function () {
                        var testName = 'Test Name of Heading Row';
                        testView.subs.add({
                            headingRow: {
                                testFlag: testName
                            },
                            row: [{
                                model: testCollection.at(0)
                            }, {
                                model: testCollection.at(1)
                            }]
                        });
                        expect(testView.subs.get('headingRow').options.testFlag).toBe(testName);
                        expect(testView.subs.get('row').length).toBe(2);
                        expect(testView.subs.get('row')[0].model.cid).toBe(testCollection.at(0).cid);
                        expect(testView.subs.get('row')[1].model.cid).toBe(testCollection.at(1).cid);
                    });

                    it('should allow you to add a config for a subview type before adding it', function () {
                        testView.subs.addConfig('testTypeA', {
                            construct: 'ActionsView',
                            options: { testOpt: 'A' }
                        }).addConfig({
                            testTypeB : {
                                construct: 'Backbone.View',
                                singleton: true
                            }
                        });
                        testView.subs
                            .add('testTypeA', { foo: 'bar' })
                            .add('testTypeA', { foo: 'baz' })
                            .add('testTypeA', { testOpt: 'B' });
                        expect(testView.subs.get('testTypeA').length).toBe(3);
                        expect(testView.subs.get('testTypeA')[0].options.testOpt).toBe('A');
                        expect(testView.subs.get('testTypeA')[1].options.testOpt).toBe('A');
                        expect(testView.subs.get('testTypeA')[0].options.foo).toBe('bar');
                        expect(testView.subs.get('testTypeA')[1].options.foo).toBe('baz');
                        expect(testView.subs.get('testTypeA')[2].options.testOpt).toBe('B');
                        testView.subs.add('testTypeB');
                        expect(testView.subs.get('testTypeB') instanceof Backbone.View).toBeTruthy();
                    });

                    it('should use the "defaultToSingletons" property if singleton is left blank in the config', function () {
                        var MyView = Backbone.BaseView.extend({
                            singletonSubViews: true,
                            subViewConfig: {
                                foo: {
                                    construct: Backbone.BaseView
                                },
                                bar: {
                                    construct: Backbone.BaseView,
                                    singleton: false
                                }
                            }
                        });
                        var view = new MyView();
                        expect(view.subs.defaultToSingletons).toBe(true);
                        view.subs.create('foo');
                        view.subs.create('bar');
                        expect(view.subs.get('foo') instanceof Backbone.BaseView).toBe(true);
                        expect(_.isArray(view.subs.get('bar'))).toBe(true);
                        view.subs.addConfig('baz', {
                            construct: Backbone.BaseView
                        });
                        view.subs.create('baz');
                        expect(view.subs.get('baz') instanceof Backbone.BaseView).toBe(true);
                        view.subs.autoInitSingletons = true;
                        view.subs.addConfig('shouldBeInitialized', {
                            construct: Backbone.BaseView
                        });
                        expect(view.subs.get('shouldBeInitialized') instanceof Backbone.BaseView).toBe(true);
                        view.subs.defaultToSingletons = false;
                        view.subs.addConfig('fooBar', {
                            construct: Backbone.BaseView
                        });
                        view.subs.create('fooBar');
                        expect(_.isArray(view.subs.get('fooBar'))).toBe(true);
                    });

                });

                describe('with the "create" method', function () {
                    var model;
                    beforeEach(function () {
                        model = new Backbone.Model();
                    });
                    it('should instantiate a subview from a config and add it (', function () {
                        var created = testView.subs.create('row', { model: model });
                        expect(testView.subs.subViews[0].model).toBe(model);
                        expect(testView.subs.subViews[0]).toBe(created);
                        expect(testView.subs.get('row')[0]).toBe(created);
                        testView.subs.create('headingRow', { flag: 'test-flag' });
                        expect(testView.subs.subViews[1].options.flag).toBe('test-flag');
                        testView.subs.create('headingRow', { cols: ['foo'], flag: 'error' });
                        expect(testView.subs.subViews[1].options.flag).toBe('test-flag');
                        expect(testView.subs.subViews.length).toBe(2);
                        created = testView.subs.create('row');
                        expect(testView.subs.last()).toBe(created);
                        expect(testView.subs.subViews.length).toBe(3);
                    });
                });

                describe('with the "addInstance" method', function () {
                    it('should allow you to add an existing instance to the subviews and associate it with a key', function () {
                        var view = new Backbone.BaseView();
                        var view2 = new Backbone.BaseView();
                        testView.subs.addInstance('testType', view);
                        expect(testView.subs.get('testType')[0]).toBe(view);
                        testView.subs.addInstance('testType', view2);
                        expect(testView.subs.get('testType')[1]).toBe(view2);
                        testView.subs.addInstance('headingRow', new HeadingRowView());
                        expect(testView.subs.get('headingRow') instanceof HeadingRowView).toBe(true);
                    });
                    it('should allow you to add existing instance as a subview without a key', function () {
                        var view = new Backbone.BaseView();
                        testView.subs.addInstance(view);
                        expect(testView.subs.subViews.length).toBe(1);
                        expect(testView.subs.subViews[0]).toBe(view);
                    });
                });

                describe('with the "addInstances" method', function () {
                    it('should allow you to add existing instances as an array and associate them with a key', function () {
                        var view = new Backbone.BaseView();
                        var view2 = new Backbone.BaseView();
                        testView.subs.addInstances('testType', [view, view2]);
                        expect(testView.subs.get('testType')[0]).toBe(view);
                        expect(testView.subs.get('testType')[1]).toBe(view2);
                    });
                    it('should only add one instance if the key is configured as a singleton', function () {
                        var view = new HeadingRowView();
                        var view2 = new HeadingRowView();
                        testView.subs.addInstances('headingRow', [view, view2]);
                        expect(testView.subs.get('headingRow').cid).toBe(view.cid);
                    });
                    it('should allow you to add existing instances as subviews without a key', function () {
                        var view = new Backbone.BaseView();
                        var view2 = new Backbone.BaseView();
                        testView.subs.addInstances([view, view2]);
                        expect(testView.subs.subViews.length).toBe(2);
                        expect(testView.subs.subViews[0].cid).toBe(view.cid);
                        expect(testView.subs.subViews[1].cid).toBe(view2.cid);
                    });
                });

                describe('with the "addInstancesWithMap" method', function () {
                    it('should allow you to add existing instances for different keys using an object map', function () {
                        var view = new Backbone.BaseView();
                        var view2 = new Backbone.BaseView();
                        var headingRow = new HeadingRowView();
                        testView.subs.addInstancesWithMap({
                            foo: view,
                            bar: view2,
                            headingRow: headingRow
                        });
                        expect(testView.subs.get('foo')[0].cid).toBe(view.cid);
                        expect(testView.subs.get('bar')[0].cid).toBe(view2.cid);
                        expect(testView.subs.get('headingRow').cid).toBe(headingRow.cid);
                    });
                });

                describe('with "createFromKeys"', function () {
                    var init = function (options) {
                        this.options = options;
                    };
                    var ConstructA = Backbone.BaseView.extend({ initialize: init });
                    var ConstructB = Backbone.BaseView.extend({ initialize: init });
                    beforeEach(function () {
                        testView.subs.addConfig('a', {
                            construct: ConstructA,
                            options: { foo: 1 }
                        });
                        testView.subs.addConfig('b', {
                            construct: ConstructB,
                            options: { foo: 2 },
                            singleton: true
                        });
                    });
                    it('should allow you to add subviews predefined in configs with an array of keys', function () {
                        var arr = testView.subs.createFromKeys(['a', 'b']);
                        expect(testView.subs.get('a')[0] instanceof ConstructA).toBe(true);
                        expect(testView.subs.get('b') instanceof ConstructB).toBe(true);
                        expect(arr[0] instanceof ConstructA).toBe(true);
                        expect(arr[1] instanceof ConstructB).toBe(true);
                    });
                    it('should pass the second param as option to each created subview', function () {
                        var arr = testView.subs.createFromKeys(['a', 'b'], { baz: 4 });
                        expect(testView.subs.get('a')[0].options.baz).toBe(4);
                        expect(testView.subs.get('b').options.baz).toBe(4);
                        expect(arr[0] instanceof ConstructA).toBe(true);
                        expect(arr[1] instanceof ConstructB).toBe(true);
                    });
                    // it('should allow you to pass a map of key-options to instantiate view with additional keys', function () {
                    //     testView.subs.createFromKeys({ a : { bar: 'test' }, b : { bar: 'test-again' } });
                    //     expect(testView.subs.get('a')[0] instanceof ConstructA).toBe(true);
                    //     expect(testView.subs.get('b') instanceof ConstructB).toBe(true);
                    //     expect(testView.subs.get('a')[0].options.foo).toBe(1);
                    //     expect(testView.subs.get('a')[0].options.bar).toBe('test');
                    //     expect(testView.subs.get('b').options.foo).toBe(2);
                    //     expect(testView.subs.get('b').options.bar).toBe('test-again');
                    // });
                });

                describe('with "createWithMap"', function () {
                    it('should create subviews from configured types with a map of key->options', function () {
                        testView.subs.createWithMap({
                            row: { foo: 1 },
                            headingRow: { bar: 2 }
                        });
                        expect(testView.subs.get('row')[0].options.foo).toBe(1);
                        expect(testView.subs.get('headingRow').options.bar).toBe(2);
                    });
                });

                describe('with "setSingleton"', function () {
                    it('should allow you to set a singleton instance for a type that isn\'t predefined', function () {
                        var view = new Backbone.BaseView();
                        testView.subs.setSingleton('singletonType', view);
                        expect(testView.subs.get('singletonType')).toBe(view);
                        testView.subs.setSingleton('singletonType', new Backbone.BaseView());
                        expect(testView.subs.get('singletonType')).toBe(view);
                    });
                });

                describe('with "overrideSingleton"', function () {
                    it('should allow you to override an existing singleton instance for a type that isn\'t predefined', function () {
                        var view = new Backbone.BaseView();
                        var view2  = new Backbone.BaseView();
                        testView.subs.overrideSingleton('singletonType', view);
                        expect(testView.subs.get('singletonType')).toBe(view);
                        testView.subs.overrideSingleton('singletonType', view2);
                        expect(testView.subs.get('singletonType')).toBe(view2);
                    });
                });

                describe('with "createSingletons" method', function () {
                    var view;
                    beforeEach(function () {
                        view = new Backbone.BaseView();
                        view.subs.addConfig({
                            singA: {
                                construct: ViewWithOpts,
                                singleton: true,
                                options: { foo: 1 }
                            },
                            notThisOne: { construct: Backbone.BaseView },
                            singB: {
                                construct: ViewWithOpts,
                                options: { bar: 2 },
                                singleton: true
                            }
                        });
                    });
                    it('should instantiate all singletons', function () {
                        view.subs.createSingletons();
                        expect(view.subs.get('singA')).toBeDefined();
                        expect(view.subs.get('singA').options.foo).toBe(1);
                        expect(view.subs.get('singB')).toBeDefined();
                        expect(view.subs.get('notThisOne')).not.toBeDefined();
                    });
                    it('should pass additional options from the first param if they are provided', function () {
                        view.subs.createSingletons({ bar: 'boop', baz: 'testing' });
                        expect(view.subs.get('singA').options.foo).toBe(1);
                        expect(view.subs.get('singA').options.baz).toBe('testing');
                        expect(view.subs.get('singA').options.bar).toBe('boop');
                        expect(view.subs.get('singB').options.bar).toBe('boop');
                        expect(view.subs.get('singB').options.baz).toBe('testing');
                    });
                });

                it('should allow switching the default state of subviews types to being singletons', function () {
                    testView.subs.defaultToSingletons = true;
                    var view1 = new Backbone.View();
                    var view2 = new Backbone.View();
                    view1.name = 'A';
                    view2.name = 'B';
                    testView.subs.add('testType', view1);
                    expect(testView.subs.get('testType') instanceof Backbone.View).toBe(true);
                    testView.subs.add('testType', view2);
                    expect(testView.subs.get('testType').name).toBe('A');
                    testView.subs.addConfig({
                        anotherTestType : {
                            construct: Backbone.View
                        },
                        yetAnotherTestType : {
                            construct: Backbone.View,
                            singleton: false
                        }
                    });
                    testView.subs.add('anotherTestType');
                    expect(testView.subs.get('anotherTestType') instanceof Backbone.View).toBe(true);
                    testView.subs.add('anotherTestType', new Backbone.View(), false);
                    expect(testView.subs.get('anotherTestType') instanceof Backbone.View).toBe(true);
                    testView.subs.add('yetAnotherTestType');
                    expect(toString.call(testView.subs.get('yetAnotherTestType'))).toBe('[object Array]');
                });

                it('should automatically create singleton instances from config if "autoInitSingletons" option is true', function () {
                    TableView.prototype.autoInitSubViews = true;
                    var tableView = new TableView({
                        collection: testCollection
                    });
                    expect(tableView.subs.get('headingRow') instanceof HeadingRowView).toBe(true);
                    expect(tableView.subs.get('row')).toBeUndefined();
                    TableView.prototype.autoInitSubViews = false;
                });

                it('should allow retrieval of subviews by the model, if the view had a model when added', function () {
                    var testModel = new Backbone.Model();
                    var testTypeView = new Backbone.View({
                        model: testModel
                    });
                    testView.subs.add('row', {
                        model : testModel
                    });
                    expect(testView.subs.get(testModel)).toBeDefined();
                    expect(testView.subs.get(testModel) instanceof RowView).toBe(true);
                    testView.subs.add('testType', testTypeView, true);
                    expect(toString.call(testView.subs.get(testModel))).toBe('[object Array]');
                    expect(testView.subs.get(testModel).length).toBe(2);
                    expect(testView.subs.get(testModel)[1].cid).toBe(testTypeView.cid);
                });

                it('should always return an array of subviews (of a named type) if "getByType" is used', function () {
                    testView.setup();
                    expect(toString.call(testView.subs.getByType('headingRow'))).toBe('[object Array]');
                    expect(testView.subs.getByType('row').length).toBe(testView.collection.length);
                });

            });

            describe('Removing Subviews', function () {

                beforeEach(function () {
                    testView.subs.addConfig('testType', {
                        construct: 'Backbone.View',
                        singleton: false
                    });
                    testView.subs.addConfig('testTypeSingle', {
                        construct: 'Backbone.View',
                        singleton: true
                    });
                    testView.subs.add('testType').add('testType').add('testTypeSingle');
                });

                it('should allow removing subviews by a particular type', function () {
                    testView.subs.remove('testType');
                    expect(testView.subs.get('testType').length).toBeFalsy();
                    testView.subs.remove('testTypeSingle');
                    expect(testView.subs.get('testTypeSingle')).toBeUndefined();
                });

                it('should call the Backbone.View remove method to remove from the dom', function () {
                    var aView = new Backbone.View();
                    spyOn(aView, 'remove');
                    testView.subs.add('anotherTestType', aView);
                    testView.subs.remove('anotherTestType');
                    expect(aView.remove).toHaveBeenCalled();
                });

                it('should remove only elements from the parent when "clearLocations" is used', function () {
                    testView.setup().render().subs.renderAppend();
                    testView.subs.clearLocations();
                    expect(testView.$('thead').children().length).toEqual(0);
                    expect(testView.$('tbody').children().length).toEqual(0);
                });

                it('should allow using a \'clear\' method to remove all subviews at once', function () {
                    var sub1 = testView.subs.at(1);
                    spyOn(sub1, 'remove');
                    testView.subs.clear();
                    expect(sub1.remove).toHaveBeenCalled();
                    expect(testView.subs.subViews.length).toEqual(0);
                    expect(testView.subs.get('testType')).toBeFalsy();
                    expect(testView.subs.get('testTypeSingle')).toBeFalsy();
                });
            });

            describe('Rendering subviews', function () {

                beforeEach(function () {
                    testView.setup().render();
                });

                it('should invoke \'render\' method on all subviews when the SubViewManager "render" method is called without arguments', function () {
                    spyOn(testView.subs.subViews[0], 'render');
                    spyOn(testView.subs.subViews[1], 'render');
                    spyOn(testView.subs.subViews[2], 'render');

                    testView.subs.render();
                    expect(testView.subs.subViews[0].render).toHaveBeenCalled();
                    expect(testView.subs.subViews[1].render).toHaveBeenCalled();
                    expect(testView.subs.subViews[2].render).toHaveBeenCalled();
                });

                it('should append subview "el" elements to their type\'s configured location if "renderAppend" is called without arguments', function () {
                    var headbeforeLen = testView.$('thead').children().length;
                    var bodyBeforeLen = testView.$('tbody').children().length;
                    testView.subs.renderAppend();
                    expect(testView.$('thead').children().length).toBeGreaterThan(headbeforeLen);
                    expect(testView.$('thead').children().length).toBe(1);
                    expect(testView.$('tbody').children().length).toBeGreaterThan(bodyBeforeLen);
                    expect(testView.$('tbody').children().length).toBe(testView.collection.length);
                });

                it('should append all subviews to a container found inside the parent view\'s "el" HTMLelement when passing a selector argument', function () {
                    var testClass = 'test-subview-container';
                    testView.$el.append('<div class="' + testClass + '"></div>');
                    testView.subs.renderAppend('.' + testClass);
                    expect(testView.$('.' + testClass).children().length).toBe(testView.subViews.length);
                    expect(testView.subs.first().$el.parent().attr('class')).toBe(testClass);
                });

                it('should render only a specific type to have been rendered when passing a type to "renderByKey"', function () {
                    spyOn(testView.subs.get('headingRow'), 'render');
                    spyOn(testView.subs.get('row')[0], 'render');
                    testView.subs.renderByKey('headingRow');
                    expect(testView.subs.get('headingRow').render).toHaveBeenCalled();
                    expect(testView.subs.get('row')[0].render).not.toHaveBeenCalled();
                });

                it('should allow making \'location\' a function that returns a jQuery instance', function () {
                    testView = new Backbone.BaseView();
                    testView.$el.html('<div class="one"></div><div class="two">');
                    testView.subs.addConfig('testType', {
                        singleton: true,
                        construct: Backbone.BaseView,
                        location : function () {
                            return this.parentView.$('.two');
                        }
                    });
                    testView.subs.add('testType').renderAppend();
                    expect(testView.$('.two').children().length).toBe(1);
                    expect(testView.$('.one').children().length).toBe(0);
                });

            });

            describe('"filteredSubs" method', function () {

                beforeEach(function () {
                    testView.setup();
                });

                it("should return an instance of the SubViewManager", function () {
                    expect(testView.subs.filteredSubs('row') instanceof testView.subs.constructor).toBe(true);
                });
                it("should return instance with subviews that match the type passed as an argument", function () {
                    expect(testView.subs.filteredSubs('headingRow').subViews.length).toBe(1);
                    expect(testView.subs.filteredSubs('headingRow').at(0).getSubViewType()).toBe('headingRow');
                });
                it('should allow passing an array of subviews that will be used to create the new filtered instance', function () {
                    var i = 0;
                    var subViews = testView.subs.filter(function (subView) {
                        if (subView.getSubViewType() === 'row') {
                            i++;
                            if (i % 2 === 1) {
                                return true;
                            }
                        }
                    });
                    expect(testView.subs.filteredSubs(subViews).subViews.length).toBe(2);
                    expect(testView.subs.filteredSubs(subViews).subViews[0].cid).toBe(subViews[0].cid);
                    expect(testView.subs.filteredSubs(subViews).subViews[1].cid).toBe(subViews[1].cid);
                });
            });

            describe('"descend" method', function () {
                var descendView;
                beforeEach(function () {
                    descendView = new Backbone.BaseView();
                    descendView.subs.addConfig({
                        typeA : {
                            construct : Backbone.BaseView.extend({
                                subViewConfig : {
                                    typeAsubTypeA : { construct : 'Backbone.View' }
                                }
                            }),
                            singleton: true
                        },
                        typeB : { construct : 'Backbone.View' }
                    });
                    descendView.subs.add('typeA').add('typeB');
                    descendView.subs.get('typeA').subs.add('typeAsubTypeA').add('typeAsubTypeA');
                });

                it('should call a passed function for every subview and every subview\'s subview', function () {
                    var i = 0;
                    var len = descendView.subs.subViews.length +
                        descendView.subs.get('typeA').subs.get('typeAsubTypeA').length;
                    descendView.subs.descend(function () {
                        i++;
                    });
                    expect(i).toEqual(len);
                });

                it('should set the context ("this") to switch to each subview instance', function () {
                    var wasTypeB;
                    var wasTypeASubTypeA;
                    var typeB = descendView.subs.get('typeB')[0];
                    var typeAsubTypeA = descendView.subs.get('typeA').subs.get('typeAsubTypeA')[1];
                    descendView.subs.descend(function () {
                        if (this.cid === typeB.cid) {
                            wasTypeB = true;
                        } else if (this.cid === typeAsubTypeA.cid) {
                            wasTypeASubTypeA = true;
                        }
                    });
                    expect(wasTypeB).toBe(true);
                    expect(wasTypeASubTypeA).toBe(true);
                });

                it('should invoke a method on a subview if a string matching a method name is passed, and do nothing otherwise', function () {
                    var typeB = descendView.subs.get('typeB')[0];
                    var typeAsubTypeA = descendView.subs.get('typeA').subs.get('typeAsubTypeA')[1];
                    var foo = function () { return 'bar'; };
                    typeB.foo = foo;
                    typeAsubTypeA.foo = foo;
                    spyOn(typeB, 'foo');
                    spyOn(typeAsubTypeA, 'foo');
                    descendView.subs.descend('foo', ['arg']);
                    expect(typeB.foo).toHaveBeenCalledWith('arg');
                    expect(typeAsubTypeA.foo).toHaveBeenCalledWith('arg');
                });
            });

            describe('"detachElems" method', function () {
                beforeEach(function () {
                    testView.setup();
                    testView.render();
                    testView.renderSubs();
                });
                it('should invoke jQuery\'s detach method on each subview\'s \'$el\' elem', function () {
                    testView.subs.each(function (subview) {
                        spyOn(subview.$el, 'detach');
                    });
                    testView.subs.detachElems();
                    var i = -1;
                    var len = testView.subs.subViews.length;
                    while (++i < len) {
                        expect(testView.subs.at(i).$el.detach).toHaveBeenCalled();
                    }
                });

            });

            describe('"setLocationForType" method', function () {
                it('should set the location property of a subview config', function () {
                    var view = new Backbone.BaseView();
                    var Foo = Backbone.BaseView.extend();
                    var Bar = Backbone.BaseView.extend();
                    view.subs.addConfig('foo', {
                        construct: Foo,
                        singleton: true
                    });
                    view.subs.addConfig('bar', {
                        construct: Bar
                    });
                    view.subs.setLocationForType('foo', '.foo-wr');
                    view.subs.setLocationForType('bar', '.bar-wr');
                    view.subs.setLocationForType('baz', '.baz-wr');
                    expect(view.subs.config.foo.location).toBe('.foo-wr');
                    expect(view.subs.config.foo.singleton).toBe(true);
                    expect(view.subs.config.foo.construct).toBe(Foo);
                    expect(view.subs.config.bar.location).toBe('.bar-wr');
                    expect(view.subs.config.bar.singleton).toBeFalsy();
                    expect(view.subs.config.bar.construct).toBe(Bar);
                    expect(view.subs.config.baz.location).toBe('.baz-wr');
                    expect(view.subs.config.baz.construct).toBeUndefined();
                    expect(view.subs.config.baz.singleton).toBeFalsy();
                });
            });

            describe('"useDefaultLocationSelectors" method', function () {
                it('should set the location config for each subview type to a string based on the type', function () {
                    var view = new Backbone.BaseView();
                    var Foo = Backbone.BaseView.extend();
                    var Bar = Backbone.BaseView.extend();
                    view.subs.addConfig('foo', {
                        construct: Foo,
                        singleton: true
                    });
                    view.subs.addConfig('bar', {
                        construct: Bar
                    });
                    view.subs.useDefaultLocationSelectors();
                    expect(view.subs.config.foo.location).toBe('.foo-container');
                    expect(view.subs.config.bar.location).toBe('.bar-container');
                    view.subs.useDefaultLocationSelectors('Wrapper');
                    expect(view.subs.config.foo.location).not.toBe('.fooWrapper');
                    expect(view.subs.config.bar.location).not.toBe('.barWrapper');
                });
            });

        });

        describe('"bindViewEvents" method', function () {

            it('should listens for events on backbone objects based on object literal key', function () {
                var calledEventA = false;
                var calledEventB = false;
                var eventAArg;
                testView.foo = function (arg) {
                    calledEventA = this;
                    eventAArg = arg;
                };
                testView.bindViewEvents({
                    'eventA collection': 'foo',
                    'eventB' : function () {
                        calledEventB = this;
                    }
                });
                testView.collection.trigger('eventA', 'test-arg');
                testView.trigger('eventB');
                expect(calledEventA.cid).toBe(testView.cid);
                expect(eventAArg).toBe('test-arg');
                expect(calledEventB.cid).toBe(testView.cid);
            });

            it('should bind backbone events on prototype in "viewEvents" property', function () {
                var calledFooWith;
                var calledBar = false;
                var calledBaz = false;
                var EventViewA = Backbone.BaseView.extend({
                    viewEvents: {
                        foo: function (arg) { calledFooWith = arg; }
                    }
                });
                var EventViewB = Backbone.BaseView.extend({
                    viewEvents: {
                        baz: 'baz'
                    },
                    baz: function () { calledBaz = true; },
                    bar: function () { calledBar = true; }
                });
                var viewA = new EventViewA();
                var viewB = new EventViewB({
                    viewEvents: function () {
                        return { bar: 'bar' };
                    }
                });
                viewA.trigger('foo', 'test-arg');
                viewB.trigger('bar').trigger('baz');
                expect(calledFooWith).toBe('test-arg');
                expect(calledBar).toBe(true);
                expect(calledBaz).toBeFalsy();
            });

            it('should be called on instantiation and bind events if present in options', function () {
                var calledEvent = false;
                var view = new Backbone.BaseView({
                    viewEvents: function () {
                        return {
                            testEvent : function () {
                                calledEvent = this;
                            }
                        };
                    }
                });
                view.trigger('testEvent');
                expect(calledEvent.cid).toBe(view.cid);
            });

        });

        it('should have a parentView property that\'s a reference to the View instance that it is a subview of', function () {
            testView.setup();
            expect(testView.subs.get('headingRow').parentView.cid).toBe(testView.cid);
            expect(testView.subs.get('row')[0].subs.subViews[0].parentView.cid).toBe(testView.subs.get('row')[0].cid);
            expect(testView.parentView).toBeFalsy();
        });

        describe('Backbone events view heirarchy cascading', function () {
            var topView;
            var cView;
            var bView;
            var aView;
            beforeEach(function () {
                topView = new Backbone.BaseView();
                cView = new Backbone.BaseView();
                bView = new Backbone.BaseView();
                aView = new Backbone.BaseView();
                topView.subs
                    .add('a', aView, true)
                    .last().subs
                    .add('b', bView)
                    .last().subs
                    .add('c', cView);
            });

            describe('"triggerBubble" method', function () {

                it('should trigger an event the view it\'s ancestors', function () {
                    var triggeredOnTopViewWith;
                    var triggeredOnA;
                    var triggeredOnB;
                    var triggeredOnC;

                    cView.on('foo', function () { triggeredOnC = true; });
                    cView.parentView.on('foo', function () { triggeredOnB = true; });
                    topView.subs.get('a').on('foo', function () { triggeredOnA = true; });
                    topView.on('foo', function (arg) {
                        triggeredOnTopViewWith = arg;
                    });
                    cView.triggerBubble('foo', 'test-arg');
                    expect(triggeredOnC).toBe(true);
                    expect(triggeredOnB).toBe(true);
                    expect(triggeredOnA).toBe(true);
                    expect(triggeredOnTopViewWith).toBe('test-arg');
                });

                it('should pass the originating view as the last argument to the callback', function () {
                    var originatingView;
                    var triggeredWith;
                    topView.on('foo', function (firstArg, view) {
                        triggeredWith = firstArg;
                        originatingView = view;
                    });
                    cView.triggerBubble('foo', 'test-arg');
                    expect(triggeredWith).toBe('test-arg');
                    expect(originatingView.cid).toBe(cView.cid);
                });

                it('should allow stopping the event bubble by calling stopEvent method in an event callback', function () {
                    var triggeredOnTopView = false;
                    var triggeredOnA = false;
                    topView.on('foo', function () {
                        triggeredOnTopView = true;
                    });
                    topView.subs.get('a').on('foo', function () {
                        triggeredOnA = true;
                        this.stopEvent('foo');
                    });
                    cView.triggerBubble('foo');
                    expect(triggeredOnA).toBe(true);
                    expect(triggeredOnTopView).toBe(false);
                });
            });

            describe('"triggerDescend" method', function () {
                it('should trigger an event all a view\'s subviews, and their subviews, and so on', function () {
                    var firedOnTopView = false;
                    var firedOnA = false;
                    var firedOnB = false;
                    var firedOnCWith;
                    var origView;
                    topView.on('foo', function () { firedOnTopView = true; });
                    topView.subs.get('a').on('foo', function () { firedOnA = true; });
                    topView.subs.get('a').subs.get('b')[0].on('foo', function () { firedOnB = true; });
                    topView.subs.get('a').subs.get('b')[0].subs.get('c')[0].on('foo', function (arg, view) {
                        firedOnCWith = arg;
                        origView = view;
                    });
                    topView.triggerDescend('foo', 'test-arg');
                    expect(firedOnTopView).toBe(true);
                    expect(firedOnA).toBe(true);
                    expect(firedOnB).toBe(true);
                    expect(firedOnCWith).toBe('test-arg');
                    expect(origView.cid).toBe(topView.cid);
                });
                it('should allow a subview to stop an event descending down it\'s tree with "stopEvent" method', function () {
                    topView.subs.add('altA', new Backbone.BaseView());
                    var firedOnAltA = false;
                    var firedOnB = false;
                    var firedOnC = false;
                    topView.subs.get('a').subs.get('b')[0].on('foo', function () {
                        firedOnB = true;
                        this.stopEvent('foo');
                    });
                    cView.on('foo', function () {
                        firedOnC = true;
                    });
                    topView.subs.get('altA')[0].on('foo', function () {
                        firedOnAltA = true;
                    });
                    topView.triggerDescend('foo');
                    expect(firedOnB).toBe(true);
                    expect(firedOnAltA).toBe(true);
                    expect(firedOnC).toBe(false);
                });
            });

            describe('"findAncestor" method', function () {
                it("should return the first ancestor that passes a truth test function", function () {
                    var foundView = cView.findAncestor(function (view) {
                        return view.cid === aView.cid;
                    });
                    expect(foundView).toBeTruthy();
                    expect(foundView.cid).toBe(aView.cid);
                });
            });

            describe('"ascend" method', function () {
                it("if passed a function, should call it for each ancestor in ascending order", function () {
                    var i = 0;
                    var aCid;
                    var bCid;
                    var topCid;
                    cView.ascend(function () {
                        if (i === 0) {
                            bCid = this.cid;
                        } else if (i === 1) {
                            aCid = this.cid;
                        } else if (i === 2) {
                            topCid = this.cid;
                        }
                        i++;
                    });
                    expect(bCid).toBe(bView.cid);
                    expect(aCid).toBe(aView.cid);
                    expect(topCid).toBe(topView.cid);
                });
                it("if passed a method name, should call it on each ancestor in ascending order", function () {
                    var testEvents = { test: 'render' };
                    spyOn(bView, 'bindViewEvents');
                    spyOn(aView, 'bindViewEvents');
                    spyOn(topView, 'bindViewEvents');
                    cView.ascend('bindViewEvents', [testEvents]);
                    expect(bView.bindViewEvents).toHaveBeenCalledWith(testEvents);
                    expect(aView.bindViewEvents).toHaveBeenCalledWith(testEvents);
                    expect(topView.bindViewEvents).toHaveBeenCalledWith(testEvents);
                });
            });

        });

    });
}(this, jQuery, Backbone, _)); //eslint-disable-line no-undef
