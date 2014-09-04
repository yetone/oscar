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
      function build(arr) {
        var propertyList = [];
        for (var i in arr.__c__) {
          if (!arr.hasOwnProperty(i)) continue;
          if (typeof arr[i] === 'function') continue;
          self.genPropertyList(propertyList, i);
        }
        properties = '({' + propertyList.join(', ') + '})';
        Object.defineProperties(arr, eval(properties));
      }
      function buildArgs(args) {
        var a;
        for (var i = 0, l = args.length; i < l; i++) {
          a = args[i];
          switch (a.constructor) {
            case (window.Array):
              self.buildArray(a);
              break;
            case (window.Object):
              self.buildData(a);
              break;
          }
        }
      }
      arr.__c__ = [];
      arr.push = function() {
        args = window.Array.prototype.slice.call(arguments);
        buildArgs(args);
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
        buildArgs(args);
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
      arr.__build = function() {
        build(this);
      };
      for (var i in arr) {
        if (!arr.hasOwnProperty(i)) continue;
        if (typeof arr[i] === 'function') continue;
        if (i === '__c__') continue;
        arr.__c__[i] = arr[i];
        self.genPropertyList(propertyList, i);
      }
      properties = '({' + propertyList.join(', ') + '})';
      Object.defineProperties(arr, eval(properties));
    };
    proto.genPropertyList = function(lst, k) {
      lst.push(k + ': {get: function() {return this.__c__[\'' + k + '\'];}, set: function(v) {if (v.constructor === window.Array) {self.buildArray(v)} if (v.constructor === window.Object) {self.buildData(v)} this.__c__[\'' + k + '\'] = v; self.watcher();}}');
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
        self.genPropertyList(propertyList, k);
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