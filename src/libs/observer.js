/**
 * Created by yetone on 14-10-10.
 */
var Store = require('./store');
var utils = require('../utils');
var undefined;

var Observer = (function() {
  function Observer(ctx) {
    this._ctx = ctx || this;
    this._cbks = {};
    this.store = new Store();
  }
  var proto = Observer.prototype;
  proto.on = function(eventType, cbk) {
    if (!utils.isFunction(cbk)) {
      throw new TypeError('eventHandler must be a function');
    }
    var self = this;
    if (!(eventType in self._cbks)) {
      self._cbks[eventType] = [];
    }
    self._cbks[eventType].push(cbk);
    return self;
  };
  proto.off = function(eventType, fun) {
    var self = this;
    if (!(eventType in self._cbks)) {
      return self;
    }
    self._cbks[eventType] = self._cbks[eventType].filter(function(item) {
      return item !== fun;
    });
    return self;
  };
  proto.trigger = function(e) {
    var self = this,
        handlerArgs = utils.arrProto.slice(arguments, 1);
    if (e in self._cbks) {
      utils.forEach(self._cbks[e], function(cbk) {
        cbk && cbk.apply(self._ctx, handlerArgs);
      });
    }
    return self;
  };
  proto.watch = function(el, cbk) {
    var self = this;
    if (utils.isStr(el)) {
      el = el.split(' ');
    }
    utils.forEach(el, function(e) {
      self.on('set:' + e, cbk);
      self.on('change:' + e, cbk);
      self.on('change:length', cbk);
    });
    cbk();
  };
  return Observer;
})();

module.exports = Observer;
