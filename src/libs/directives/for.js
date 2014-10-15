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
        isArray;
    if (!expl || expl.length !== 3) return;
    obj = eval('(scope' + utils.genS(expl[2]) + ')');
    isArray = utils.isArray(obj);
    function _replace(str, kstr, key) {
      str = utils.replaceEvalStr(str, expl[1], expl[2] + '[\'' + key + '\']');
      str = utils.replaceEvalStr(str, kstr, '\'' + key + '\'');
      return str;
    }
    function _render() {
      var re = /\{\{(.*?)\}\}/g,
          kstr;
      !$node.inited && dom.removeElement($node);
      utils.forEach(obj, function(item, key) {
        if (key === '__observer__') return;
        if (utils.isStr(key) && key.startsWith('$')) return;
        if (!utils.hasOwn.call(obj, key)) return;
        if (isArray && isNaN(+key)) return;
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
        obj.__observer__.on('remove:' + key, (function($node, key) {
          return function() {
            dom.removeElement($node);
            acc[key] = null;
          }
        })($node, key));
        $node.inited = true;
        model.render($node);
      });
    }
    obj.__observer__.watch('length', function() {
      _render();
    });
  }
};
