/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../utils');
var undefined;

var Observer = (function() {
  function Observer(ctx) {
    this._ctx = ctx || this;
    this._cbks = {};
    this.store = {};
  }
  var proto = Observer.prototype;
  proto.on = function(eventName, cbk) {
    if (!utils.isFunction(cbk)) {
      throw new TypeError('eventHandler must be a function');
    }
    var self = this;
    if (!(eventName in self._cbks)) {
      self._cbks[eventName] = [];
    }
    self._cbks[eventName].push(cbk);
    return self;
  };
  proto.off = function(eventName, fun) {
    var self = this;
    if (!(eventName in self._cbks)) {
      return self;
    }
    if (!fun) {
      self._cbks[eventName] = [];
      return self;
    }
    self._cbks[eventName] = self._cbks[eventName].filter(function(item) {
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
    if (self.__parent__) {
      return self.__parent__.trigger('change:*');
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
    });
    cbk();
  };
  return Observer;
})();

module.exports = Observer;
