/**
 * Created by yetone on 14-10-10.
 */
var ifDirective = require('./directives/if');
var forDirective = require('./directives/for');
var bindDirective = require('./directives/bind');
var actionDirective = require('./directives/action');
var classDirective = require('./directives/class');
var utils = require('../utils');
var undefined;

var compile = function(model, $node, scope) {
  $node = $node || model.$el;
  scope = scope || model.data;
  var bind, hasBind, hasClass, hasAction, hasIf, hasFor, bindValues, attrs;
  if ($node.nodeType === 3) {
    return utils._bind(model, $node, 'textContent', scope);
  }
  hasBind = utils.hasAttribute($node, model.prefix + 'bind');
  hasClass = utils.hasAttribute($node, model.prefix + 'class');
  hasAction = utils.hasAttribute($node, model.prefix + 'action');
  hasIf = utils.hasAttribute($node, model.prefix + 'if');
  hasFor = utils.hasAttribute($node, model.prefix + 'for');
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
  if (hasAction) {
    actionDirective.compile(model, $node, scope);
  }
  if (hasIf) {
    ifDirective.compile(model, $node, scope);
  }
  if (utils.$DOC.contains($node)) {
    utils.toArray($node.childNodes).forEach(function($node) {
      compile(model, $node);
    });
  }
};

module.exports = {
  compile: compile
};