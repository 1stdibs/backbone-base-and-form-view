/**
 * Created by james on 10/21/14.
 */

(function (root, $, Backbone) {
    'use strict';

    var marinate = Backbone.BaseView.marinate;

    describe("baseview-marinate", function () {
        describe("marinate method", function () {
            it('should add properties of an object to all new view instances', function () {
                var MyView = Backbone.BaseView.extend({ baz : 3 });
                var view;
                marinate(MyView, {
                    foo: function () {
                        return 'foo';
                    },
                    bar: 2
                });
                view = new MyView();
                expect(view.foo()).toBe('foo');
                expect(view.bar).toBe(2);
                expect(view.baz).toBe(3);
            });
            it('should take the events hash in "addedEvents" and send them to ' +
                'Backbone.View.prototype.delegateEvents without overwriting exiting events',
                function () {
                    var didDoFoo = false;
                    var didDoBar = false;
                    var MyView = Backbone.BaseView.extend({
                        events: { 'click .foo' : 'doFoo' },
                        doFoo: function () {
                            didDoFoo = true;
                        },
                        render: function () {
                            this.$el.html('<p class="foo"></p><p class="bar"></p>');
                            return this;
                        }
                    });
                    marinate(MyView, {
                        addedEvents: { 'click .bar': 'doBar' },
                        doBar: function () {
                            didDoBar = true;
                        }
                    });
                    var view = new MyView();
                    view.render();
                    view.$('.foo').trigger('click');
                    expect(didDoFoo).toBe(true);
                    expect(didDoBar).toBe(false);
                    view.$('.bar').trigger('click');
                    expect(didDoFoo).toBe(true);
                    expect(didDoBar).toBe(true);
                });
        });
        describe('"addProtoEvents" method', function () {
            var didDoFoo;
            var didDoBar;
            var MyView;
            var testEventsForView = function (view, activatedBar) {
                view.$('.foo').trigger('click');
                expect(didDoFoo).toBe(true);
                expect(didDoBar).toBe(false);
                view.$('.bar').trigger('click');
                expect(didDoFoo).toBe(true);
                expect(didDoBar).toBe(activatedBar);
                didDoBar = false;
                didDoFoo = false;
            };
            beforeEach(function () {
                didDoFoo = false;
                didDoBar = false;
                MyView = Backbone.BaseView.extend({
                    events: { 'click .foo' : 'doFoo' },
                    doFoo: function () {
                        didDoFoo = true;
                    },
                    render: function () {
                        this.$el.html('<p class="foo"></p><p class="bar"></p>');
                        return this;
                    }
                });
            });
            it('should add events from a hash to the existing events', function () {
                marinate.addProtoEvents(MyView, {
                    'click .bar': function () {
                        didDoBar = true;
                    }
                });
                var view = new MyView();
                view.render();
                testEventsForView(view, true);
            });
            it('should allow the user to remove added events by a namespace', function () {
                marinate.addProtoEvents(MyView, {
                    doop: {
                        'click .bar': function () {
                            didDoBar = true;
                        }
                    }
                });
                var view = new MyView();
                view.render();
                testEventsForView(view, true);
                view.$el.off('.doop');
                view.$('.foo').trigger('click');
                view.$('.bar').trigger('click');
                expect(didDoFoo).toBe(true);
                expect(didDoBar).toBe(false);
            });
            describe('"addEvents" method', function () {
                it('should only add events to instance', function () {
                    var view1 = new MyView().render();
                    var view2 = new MyView().render();
                    marinate.addEvents(view2, {
                        'click .bar': function () {
                            didDoBar = true;
                        }
                    });
                    view1.delegateEvents();
                    view2.delegateEvents();
                    testEventsForView(view1, false);
                    testEventsForView(view2, true);
                });
            });
        });
        describe('"marinateInstance" method', function () {
            it('should marinate only an instance, not the prototype', function () {
                var MyView = Backbone.BaseView.extend({ baz : 3 });
                var view1 = new MyView();
                var view2 = new MyView();
                marinate.marinateInstance(view2, { blam: 4 });
                expect(view1.blam).toBeFalsy();
                expect(view2.blam).toBe(4);
            });
        });
    });
}(this, jQuery, Backbone, _)); //eslint-disable-line no-undef
