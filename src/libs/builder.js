/**
 * Created by yetone on 14-10-11.
 */
var Observer = require('./observer');
var utils = require('../utils');
var undefined;

function buildArray(arr, parent) {
  var args;
  utils.forEach(['push', 'pop', 'shift', 'unshift', 'splice'], function(method) {
    arr[method] = function() {
      var oldL = this.length;
      args = utils.toArray(arguments);
      switch (method) {
        case 'splice':
          utils.forEach(utils.range(args[0], args[1]), function(v) {
            arr.__observer__.trigger('remove:' + v);
            arr.__observer__.off('set:' + v);
            arr.__observer__.off('change:' + v);
          });
          break;
        case 'pop':
          arr.__observer__.trigger('remove:' + (this.length - 1));
          arr.__observer__.off('set:' + (this.length - 1));
          arr.__observer__.off('change:' + (this.length - 1));
          break;
        case 'shift':
          arr.__observer__.trigger('remove:0');
          arr.__observer__.off('set:0');
          arr.__observer__.off('change:0');
          break;
      }
      utils.arrProto[method].apply(this, args);
      buildObj(this, parent);
      if (oldL !== this.length) {
        arr.__observer__.trigger('change:length');
      }
    };
  });
  buildObj(arr, parent);
}

function buildObj(obj, parent) {
  var properties = {};
  if (obj.__observer__ === undefined || obj.__observer__.constructor !== Observer) {
    obj.__observer__ = new Observer(obj);
    if (parent && parent.__observer__) {
      obj.__observer__.__parent__ = parent.__observer__;
    }
  }
  utils.forEach(obj, function(v, k) {
    if (k === '__observer__') return;
    if (utils.isStr(k) && k.startsWith('$')) return;
    if (typeof v === 'function') return;
    obj.__observer__.store.set(k, v);
    if (utils.isArray(v)) {
      buildArray(v, obj);
    }
    if (utils.isObj(v)) {
      buildObj(v, obj);
    }
    properties[k] = {
      get: function() {
        return this.__observer__.store.get(k);
      },
      set: function(value) {
        if (utils.isArray(value)) {
          buildArray(value, obj);
        }
        if (utils.isObj(value)) {
          buildObj(value, obj);
        }
        var isNew = (this.__observer__.store.get(k) !== value);
        this.__observer__.store.set(k, value);
        if (isNew) {
          this.__observer__.trigger('change:' + k);
        }
      }
    };
    obj.__observer__.trigger('set:' + k);
  });
  utils.defs(obj, properties);
  obj.$watch = function() {
    if (!this.__observer__) {
      return console.warn('no observer!');
    }
    this.__observer__.watch.apply(this.__observer__, arguments);
  };
  obj.$trigger = function() {
    if (!this.__observer__) {
      return console.warn('no observer!');
    }
    this.__observer__.trigger.apply(this.__observer__, arguments);
  };
}

module.exports = {
  buildObj: buildObj
};
