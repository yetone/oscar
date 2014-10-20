/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(vm, $node, scope) {
    var $tmp = $node,
        $pn = $node.parentNode,
        $startCmt = utils.$DOC.createComment('oscar-for start'),
        $endCmt = utils.$DOC.createComment('oscar-for end'),
        exp = $node.getAttribute(vm.$prefix + 'for'),
        expl = /([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*)/.exec(exp),
        acc = {},
        obj,
        isArray;
    if (!expl || expl.length !== 3) return;
    obj = eval('(scope' + utils.genS(expl[2]) + ')');
    isArray = utils.isArray(obj);
    function _replace(str, kstr, key) {
      str = utils.replaceEvalStr(str, expl[1], expl[2] + '[\'' + key + '\']');
      str = utils.replaceEvalStr(str, kstr, '\'' + key + '\'');
      return str;
    }
    $pn.insertBefore($endCmt, $node);
    $pn.insertBefore($startCmt, $endCmt);
    dom.removeElement($node);
    obj.$startCmt = $startCmt;
    obj.$endCmt = $endCmt;
    function _render(key) {
      var item = obj[key];
      var re = /\{\{(.*?)\}\}/g;
      if (utils.isStr(key) && ['$', '_'].indexOf(key.charAt(0)) > -1) return;
      if (!utils.hasOwn.call(obj, key)) return;
      if (isArray && isNaN(+key)) return;
      var kstr = '$key';
      if (isArray) {
        kstr = '$index';
      }
      var $node = $tmp.cloneNode(true);
      // 起名什么的最讨厌了！
      (function __($node) {
        if ($node.nodeType === 3) {
          $node.textContent = $node.textContent.replace(re, function(_, a) {
            a = _replace(a, kstr, key);
            return '{{' + a + '}}';
          });
          return;
        }
        var oscarAttrs = ['bind', 'on', 'class', 'if'],
            attrs = utils.toArray($node.attributes),
            $cns = utils.toArray($node.childNodes);
        oscarAttrs.forEach(function(_attr) {
          var attr = vm.$prefix + _attr,
            a;
          if (dom.hasAttribute($node, attr)) {
            a = $node.getAttribute(attr);
            a = _replace(a, kstr, key);
            $node.setAttribute(attr, a);
          }
        });
        attrs = attrs.filter(function(v) {
          return v.name.indexOf(vm.$prefix) !== 0;
        });
        attrs.forEach(function(v) {
          v.value = v.value.replace(re, function(_, a) {
            a = _replace(a, kstr, key);
            return '{{' + a + '}}';
          });
        });
        $cns.forEach(function($n) {
          __($n);
        });
      })($node);
      var attrs = utils.toArray($node.attributes).filter(function(v) {
        return v.name.indexOf(vm.$prefix) !== 0;
      });
      attrs.forEach(function(v) {
        utils._bind(vm, v, 'value', scope);
      });

      if (item.$el) {
        dom.removeElement(item.$el);
      }
      $pn.insertBefore($node, obj.$endCmt);
      item.$el = $node;
      acc[key] = $node;

      $node.inited = true;
      vm.render($node);
    }
    function _iterate() {
      var differ = utils.diff(obj, acc);
      utils.forEach(differ.remove, function(key) {
        dom.removeElement(acc[key]);
        delete acc[key];
      });
      utils.forEach(obj, function(_, key) {
        _render(key);
      });
    }
    obj.__observer__.watch('$length', function() {
      _iterate();
    });
  }
};
