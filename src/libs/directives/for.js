/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var $tmp = $node,
        $ps = $node.previousSibling,
        $ns = $node.nextSibling,
        $pn = $node.parentNode,
        $cns = $node.childNodes,
        exp = $node.getAttribute(model.prefix + 'for'),
        expl = /([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*)/.exec(exp),
        acc = [],
        obj,
        isArray,
        bindValues;
    if (!expl || expl.length !== 3) return;
    bindValues = model.getBindValues('{{' + expl[2] + '}}', scope);
    obj = eval('(scope' + utils.genS(expl[2]) + ')');
    isArray = utils.isArray(obj);
    function _replace(str, kstr, key) {
      str = utils.replaceEvalStr(str, expl[1], expl[2] + '[\'' + key + '\']');
      str = utils.replaceEvalStr(str, kstr, '\'' + key + '\'');
      return str;
    }
    function render() {
      var re = /\{\{(.*?)\}\}/g,
          kstr;
      dom.removeElement($node);
      for (var key in obj) {
        if (key === '__c__') continue;
        if (!utils.hasOwn.call(obj, key)) continue;
        if (isArray && isNaN(+key)) continue;
        kstr = '$key';
        if (isArray) {
          kstr = '$index';
        }
        if (acc[key]) {
          $node = acc[key]['$node'];
        } else {
          $node = $tmp.cloneNode(true);
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
              var attr = model.prefix + _attr,
                a;
              if (dom.hasAttribute($node, attr)) {
                a = $node.getAttribute(attr);
                a = _replace(a, kstr, key);
                $node.setAttribute(attr, a);
              }
            });
            attrs = attrs.filter(function(v) {
              return v.name.indexOf(model.prefix) !== 0;
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
          acc.push({
            $node: $node
          });
        }

        if (dom.contains(utils.$DOC, $node)) return;
        if ($ns) {
          $pn.insertBefore($node, $ns);
        } else if ($ps && $ps.nextSibling) {
          $pn.insertBefore($node, $ps.nextSibling);
        } else if ($pn) {
          $pn.appendChild($node);
        }
        $ps = $node.previousSibling;
        $ns = $node.nextSibling;
        $pn = $node.parentNode;
        $cns = $node.childNodes;
        var attrs = utils.toArray($node.attributes).filter(function(v) {
          return v.name.indexOf(model.prefix) !== 0;
        });
        attrs.forEach(function(v) {
          utils._bind(model, v, 'value', scope);
        });
        model.watch(bindValues, function() {
          var dv = eval('(scope' + utils.genS(expl[2]) + ')'),
              hasMe = key in dv;
          if (!hasMe) {
            dom.removeElement($node);
          }
        });
        $node.inited = true;
        model.render($node);
      }
    }
    model.watch(bindValues, function() {
      render();
    });
  }
};
