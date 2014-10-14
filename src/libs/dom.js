/**
 * Created by yetone on 14-10-13.
 */
// DOM 操作不使用 shim 是因为某些渣渣浏览器无法访问到 Event 和 Element 对象
function addEventListener($el, type, listener) {
  function wrapper(e) {
    e.target = e.srcElement;
    e.currentTarget = $el;
    if (listener.handleEvent) {
      listener.handleEvent(e);
    } else {
      listener.call($el, e);
    }
  }
  if ($el.addEventListener) {
    return $el.addEventListener(type, listener, false);
  }
  if ($el.attachEvent) {
    return $el.attachEvent('on' + type, wrapper);
  }
  return $el['on' + type] = function() {
    wrapper(window.event);
  };
}
function removeEventListener($el, type, listener) {
  if ($el.removeEventListener) {
    return $el.removeEventListener(type, listener);
  }
  if ($el.detachEvent) {
    return $el.detachEvent('on' + type, listener);
  }
  return $el['on' + type] = null;
}
function removeElement($el) {
  if ($el.remove) {
    return $el.remove();
  }
  if ($el.parentNode) {
    return $el.parentNode.removeChild($el);
  }
}
function querySelectorAll($el, selector) {
  if ($el.querySelectorAll) {
    return $el.querySelectorAll(selector);
  }
  // TODO
  return [$el.getElementById(selector.slice(1))];
}
function hasAttribute($el, attr) {
  if ($el.hasAttribute) {
    return $el.hasAttribute(attr);
  }
  return $el[attr] !== undefined;
}
function fixContains(a, b) {
  if (b) {
    while ((b = b.parentNode)) {
      if (b === a) {
        return true;
      }
    }
  }
  return false;
}
function contains($el, $el0) {
  if (typeof $el.contains === 'function') {
    return $el.contains($el0);
  }
  return fixContains($el, $el0)
}
function underAttribute($node, attr) {
  if ($node.parentElement && hasAttribute($node.parentElement, attr)) return true;
  if ($node.tagName === 'BODY') {
    return hasAttribute($node, attr);
  } else {
    return underAttribute($node.parentNode, attr);
  }
}

module.exports = {
  addEventListener: addEventListener,
  removeEventListener: removeEventListener,
  removeElement: removeElement,
  querySelectorAll: querySelectorAll,
  hasAttribute: hasAttribute,
  contains: contains,
  underAttribute: underAttribute
};
