/**
 * Created by yetone on 14-10-10.
 */
var ifDirective = require('./directives/if');
var forDirective = require('./directives/for');
var bindDirective = require('./directives/bind');
var onDirective = require('./directives/on');
var classDirective = require('./directives/class');
var dom = require('./dom');
var utils = require('../utils');
var undefined;

var compile = function(vm, $node, scope) {
  $node = $node || vm.$el;
  scope = scope || vm.$data;
  var bind, hasBind, hasClass, hasOn, hasIf, hasFor, attrs;
  if ($node.nodeType === 3) {
    return utils._bind(vm, $node, 'textContent', scope);
  }
  hasBind = dom.hasAttribute($node, vm.$prefix + 'bind');
  hasClass = dom.hasAttribute($node, vm.$prefix + 'class');
  hasOn = true;
  hasIf = dom.hasAttribute($node, vm.$prefix + 'if');
  hasFor = dom.hasAttribute($node, vm.$prefix + 'for');
  attrs = utils.toArray($node.attributes);
  attrs = attrs.filter(function(v) {
    return v.name.indexOf(vm.$prefix) !== 0;
  });
  if (hasFor && !$node.inited) {
    forDirective.compile(vm, $node, scope);
    return;
  }
  attrs.forEach(function(v) {
    utils._bind(vm, v, 'value', scope);
  });
  if (hasBind) {
    bindDirective.compile(vm, $node, scope);
  }
  if (hasClass) {
    classDirective.compile(vm, $node, scope);
  }
  if (hasOn) {
    onDirective.compile(vm, $node, scope);
  }
  if (hasIf) {
    ifDirective.compile(vm, $node, scope);
  }
  if (dom.contains(utils.$DOC, $node)) {
    utils.toArray($node.childNodes).forEach(function($node) {
      compile(vm, $node);
    });
  }
};

module.exports = {
  compile: compile
};