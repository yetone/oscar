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

var compile = function(model, $node, scope) {
  $node = $node || model.$el;
  scope = scope || model.data;
  var bind, hasBind, hasClass, hasOn, hasIf, hasFor, attrs;
  if ($node.nodeType === 3) {
    return utils._bind(model, $node, 'textContent', scope);
  }
  hasBind = dom.hasAttribute($node, model.prefix + 'bind');
  hasClass = dom.hasAttribute($node, model.prefix + 'class');
  hasOn = dom.hasAttribute($node, model.prefix + 'on');
  hasIf = dom.hasAttribute($node, model.prefix + 'if');
  hasFor = dom.hasAttribute($node, model.prefix + 'for');
  attrs = utils.toArray($node.attributes);
  attrs = attrs.filter(function(v) {
    return v.name.indexOf(model.prefix) !== 0;
  });
  if (hasFor && !$node.inited) {
    forDirective.compile(model, $node, scope);
    return;
  }
  attrs.forEach(function(v) {
    utils._bind(model, v, 'value', scope);
  });
  if (hasBind) {
    bindDirective.compile(model, $node, scope);
  }
  if (hasClass) {
    classDirective.compile(model, $node, scope);
  }
  if (hasOn) {
    onDirective.compile(model, $node, scope);
  }
  if (hasIf) {
    ifDirective.compile(model, $node, scope);
  }
  if (dom.contains(utils.$DOC, $node)) {
    utils.toArray($node.childNodes).forEach(function($node) {
      compile(model, $node);
    });
  }
};

module.exports = {
  compile: compile
};