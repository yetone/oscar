;(function(window, undefined) {
  window.Oscar = (function() {
    function Oscar() {
      this.modelList = [];
      this.__init__();
    }
    var proto = Oscar.prototype;
    proto.__init__ = function() {
    };
    proto.buildArray = function(arr) {
      var self = this,
          propertyList = [],
          properties,
          args;
      arr.__c__ = [];
      arr.push = function() {
        args = window.Array.prototype.slice.call(arguments);
        window.Array.prototype.push.apply(this, args);
        window.Array.prototype.push.apply(this.__c__, args);
        build(this);
        self.watcher();
      };
      arr.pop = function() {
        args = window.Array.prototype.slice.call(arguments);
        window.Array.prototype.pop.apply(this, args);
        window.Array.prototype.pop.apply(this.__c__, args);
        build(this);
        self.watcher();
      };
      arr.shift = function() {
        args = window.Array.prototype.slice.call(arguments);
        window.Array.prototype.shift.apply(this, args);
        window.Array.prototype.shift.apply(this.__c__, args);
        build(this);
        self.watcher();
      };
      arr.unshift = function() {
        args = window.Array.prototype.slice.call(arguments);
        window.Array.prototype.unshift.apply(this, args);
        window.Array.prototype.unshift.apply(this.__c__, args);
        build(this);
        self.watcher();
      };
      arr.slice = function() {
        args = window.Array.prototype.slice.call(arguments);
        window.Array.prototype.slice.apply(this, args);
        window.Array.prototype.slice.apply(this.__c__, args);
        build(this);
        self.watcher();
      };
      function build(arr) {
        for (var i in arr.__c__) {
          if (!arr.hasOwnProperty(i)) continue;
          if (typeof arr[i] === 'function') continue;
          propertyList.push(i + ': {get: function() {return this.__c__[' + i + '];}, set: function(v) {this.__c__[' + i + '] = v; self.watcher();}}');
        }
        properties = '({' + propertyList.join(', ') + '})';
        Object.defineProperties(arr, eval(properties));
      }
      for (var i in arr) {
        if (!arr.hasOwnProperty(i)) continue;
        if (typeof arr[i] === 'function') continue;
        if (i === '__c__') continue;
        arr.__c__[i] = arr[i];
        propertyList.push(i + ': {get: function() {return this.__c__[\'' + i + '\'];}, set: function(v) {this.__c__[\'' + i + '\'] = v; self.watcher();}}');
      }
      properties = '({' + propertyList.join(', ') + '})';
      Object.defineProperties(arr, eval(properties));
    };
    proto.buildData = function(data) {
      var self = this,
          propertyList = [],
          properties;
      data.__c__ = {};
      for (var k in data) {
        if (!data.hasOwnProperty(k)) continue;
        if (k === '__c__') continue;
        data.__c__[k] = data[k];
        if (data[k].constructor === window.Array) {
          self.buildArray(data[k]);
        }
        if (data[k].constructor === window.Object) {
          self.buildData(data[k]);
        }
        propertyList.push(k + ': {get: function() {return this.__c__[\'' + k + '\'];}, set: function(v) {this.__c__[\'' + k + '\'] = v; self.watcher();}}');
      }
      properties = '({' + propertyList.join(', ') + '})';
      Object.defineProperties(data, eval(properties));
    };
    proto.modelRegister = function(obj) {
      if (typeof obj !== 'object' || typeof obj.el !== 'string' ||  typeof obj.data !== 'object') {
        throw new Error('invailed model type');
      }
      var $el = window.document.querySelectorAll(obj.el);
      if (!$el.length) {
        throw new Error('cannot find the element');
      }
      this.buildData(obj.data);
      this.modelList.push({
        $el: $el[0],
        tpl: $el[0].innerHTML,
        data: obj.data
      });
      this.watcher();
    };
    proto.watcher = function() {
      var self = this;
      self.modelList.forEach(function(e) {
        e.$el.innerHTML = window.shani.compile(e.tpl.replace(/&gt;/g, '>').replace(/&lt;/g, '<'))(e.data);
      });
    };
    return Oscar;
  })();
})(window);
