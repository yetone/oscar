/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(vm, $node, scope) {
    var attrs = utils.toArray($node.attributes);
    utils.forEach(attrs, function(v) {
      if (v.name.indexOf(vm.prefix + 'on-') !== 0) return;
      var eventName = new RegExp(vm.prefix + 'on-' + '(.*)').exec(v.name)[1];
      var cbkStr = v.value;
      if (eventName) {
        dom.addEventListener($node, eventName, function (e) {
          utils.runWithEvent(cbkStr, scope, this, e);
        });
      }
    });
    var str = $node.getAttribute(vm.prefix + 'on');
    if (str) {
      var onObj = utils.runWithScope('{' + str + '}', scope);
      utils.forEach(onObj, function(cbk, evt) {
        dom.addEventListener($node, evt, cbk);
      });
    }
  }
};
