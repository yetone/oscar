/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../utils');
var undefined;

var Observer = (function() {
  function Observer() {
    this.eventHandlerObj = {};
  }
  var proto = Observer.prototype;
  proto.on = function(eventType, cbk) {
    if (!utils.isFunction(cbk)) {
      throw new Error('eventHandler must be a function');
    }
    var self = this;
    if (!(eventType in self.eventHandlerObj)) {
      self.eventHandlerObj[eventType] = [];
    }
    self.eventHandlerObj[eventType].push(cbk);
    return self;
  };
  proto.off = function(eventType, fun) {
    var self = this;
    if (!(eventType in self.eventHandlerObj)) {
      return self;
    }
    self.eventHandlerObj[eventType] = self.eventHandlerObj[eventType].filter(function(item) {
      return item !== fun;
    });
    return self;
  };
  proto.trigger = function(e) {
    var self = this,
      handlerArgs = utils.arrProto.slice(arguments, 1);
    if (e in self.eventHandlerObj) {
      self.eventHandlerObj[e].forEach(function(cbk) {
        cbk && cbk.apply(self, handlerArgs);
      });
    }
    return self;
  };
  proto.watch = function(el, cbk) {
    var self = this;
    if (utils.isStr(el)) {
      el = el.split(' ');
    }
    utils.forEach.call(el, function(e) {
      self.on('set:' + e, cbk);
      self.on('change:' + e, cbk);
      self.on('change:' + utils.genPath(e, '__index__'), cbk);
    });
    cbk();
  };
  return Observer;
})();

module.exports = {
  Observer: Observer
};
