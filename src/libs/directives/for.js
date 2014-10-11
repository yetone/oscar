/**
 * Created by yetone on 14-10-10.
 */
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
        acc = [];
    if (!expl && expl.length !== 3) return;
    function render() {
      var dv = eval('(scope' + utils.genS(expl[2]) + ')'),
        obj = dv;
      if (utils.isObj(dv)) {
        obj = utils.getObjKeys(dv);
      }
      utils.removeElement($node);
      obj.forEach(function(v, k) {
        if (utils.isObj(dv) && v === '__c__') return;
        var $node,
          re = /\{\{(.*?)\}\}/g,
          idx = k,
          kstr = '$index';
        if (utils.isObj(dv)) {
          idx = v;
          kstr = '$key';
        }
        if (acc[idx]) {
          $node = acc[idx]['$node'];
        } else {
          $node = $tmp.cloneNode(true);
          // 起名什么的最讨厌了！
          (function __($node) {
            if ($node.nodeType === 3) {
              $node.textContent = $node.textContent.replace(re, function(_, a) {
                a = utils.replaceEvalStr(a, expl[1], expl[2] + '[\'' + idx + '\']');
                a = utils.replaceEvalStr(a, kstr, '\'' + idx + '\'');
                return '{{' + a + '}}';
              });
              return;
            }
            var oscarAttrs = ['bind', 'action', 'class', 'if'],
              attrs = utils.toArray($node.attributes),
              $cns = utils.toArray($node.childNodes);
            oscarAttrs.forEach(function(_attr) {
              var attr = model.prefix + _attr,
                a;
              if (utils.hasAttribute($node, attr)) {
                a = $node.getAttribute(attr);
                a = utils.replaceEvalStr(a, expl[1], expl[2] + '[\'' + idx + '\']');
                a = utils.replaceEvalStr(a, kstr, '\'' + idx + '\'');
                $node.setAttribute(attr, a);
              }
            });
            attrs = attrs.filter(function(v) {
              return v.name.indexOf(model.prefix) !== 0;
            });
            attrs.forEach(function(v) {
              v.value = v.value.replace(re, function(_, a) {
                a = utils.replaceEvalStr(a, expl[1], expl[2] + '[\'' + idx + '\']');
                a = utils.replaceEvalStr(a, kstr, '\'' + idx + '\'');
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

        if (utils.$DOC.contains($node)) return;
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
            hasMe;
          if (utils.isObj(dv)) {
            hasMe = v in dv;
          } else {
            hasMe = k in dv;
          }
          if (!hasMe) {
            utils.removeElement($node);
          }
        });
        $node.inited = true;
        model.render($node);
      });
    }
    var bindValues = model.getBindValues('{{' + expl[2] + '}}', scope);
    model.watch(bindValues, function() {
      render();
    });
  }
};
