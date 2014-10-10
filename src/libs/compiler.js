/**
 * Created by yetone on 14-10-10.
 */
var ifDirective = require('./directives/if');
var forDirective = require('./directives/for');
var bindDirective = require('./directives/bind');
var actionDirective = require('./directives/action');
var classDirective = require('./directives/class');
var utils = require('../utils');
var DOC = utils.DOC;
var undefined;

var compile = function(model, $node, scope) {
  $node = $node || model.$el;
  scope = scope || model.data;
  var bind, hasBind, hasClass, hasAction, hasIf, hasFor, bindValues, attrs;
  if ($node.nodeType === 3) {
    return utils._bind(model, $node, 'textContent', scope);
  }
  hasBind = $node.hasAttribute(model.prefix + 'bind');
  hasClass = $node.hasAttribute(model.prefix + 'class');
  hasAction = $node.hasAttribute(model.prefix + 'action');
  hasIf = $node.hasAttribute(model.prefix + 'if');
  hasFor = $node.hasAttribute(model.prefix + 'for');
  attrs = utils.toArray($node.attributes);
  attrs = attrs.filter(function(v) {
    return v.name.indexOf(model.prefix) !== 0;
  });
  attrs.forEach(function(v) {
    utils._bind(model, v, 'value', scope);
  });
  if (hasFor && !$node.inited) {
    forDirective.compile(model, $node, scope);
    return;
  }
  if (hasBind) {
    bindDirective.compile(model, $node, scope);
  }
  if (hasClass) {
    classDirective.compile(model, $node, scope);
  }
  if (hasAction) {
    actionDirective.compile(model, $node, scope);
  }
  if (hasIf) {
    ifDirective.compile(model, $node, scope);
  }
  if (DOC.contains($node)) {
    utils.toArray($node.childNodes).forEach(function($node) {
      compile(model, $node);
    });
  }
};

module.exports = {
  compile: compile
};