var Model = require('./libs/model').Model,
    Store = require('./libs/store').Store,
    utils = require('./utils');

(function(window, undefined) {
  window.Oscar = (function() {
    function Oscar() {
      this.modelList = [];
      this.__init__();
    }
    var proto = Oscar.prototype;
    proto.__init__ = function() {
    };
    proto.buildArray = function(arr, model, root) {
      root = root || '';
      var self = this,
          args;
      ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(function(method) {
        arr[method] = function() {
          var oldL = this.length;
          args = utils.toArray(arguments);
          // clone arguments
          var _args = utils.toArray(arguments);
          if (method === 'splice') {
            var subArgs = args.slice(2);
            self.buildObj([subArgs], model);
            args = args.slice(0, 2);
            utils.arrProto.push.apply(args, subArgs);
          } else {
            self.buildObj(args, model);
          }
          utils.arrProto[method].apply(this, args);
          this.__c__.apply(method, _args);
          self.buildObj(this, model, root);
          if (model !== undefined) {
            model.trigger('change:' + root);
            model.trigger('change:*');
            if (oldL !== this.length) {
              model.trigger('change:' + utils.genPath(root, '__index__'));
            }
          }
        };
      });
      self.buildObj(arr, model, root);
    };
    proto.buildObj = function(obj, model, root) {
      root = root || '';
      var self = this,
          properties = {};
      if (obj.__c__ === undefined || obj.__c__.constructor !== Store) {
        obj.__c__ = new Store();
      }
      utils.getObjKeys(obj).forEach(function(k) {
        if (k === '__c__') return;
        if (typeof obj[k] === 'function') return;
        obj.__c__.set(k, obj[k]);
        var path = utils.genPath(root, k);
        if (utils.isArray(obj[k])) {
          self.buildArray(obj[k], model, path);
        }
        if (utils.isObj(obj[k])) {
          self.buildObj(obj[k], model, path);
        }
        properties[k] = {
          get: function() {
            return this.__c__.get(k);
          },
          set: function(v) {
            if (utils.isArray(v)) {
              self.buildArray(v, model, path);
            }
            if (utils.isObj(v)) {
              self.buildObj(v, model, path);
            }
            var isNew = (this.__c__.get(k) !== v);
            this.__c__.set(k, v);
            if (model !== undefined && isNew) {
              model.trigger('change:' + path);
              model.trigger('change:*');
            }
          }
        };
        if (model !== undefined) {
          model.trigger('set:' + path);
        }
      });
      utils.defs(obj, properties);
    };
    proto.modelRegister = function(obj) {
      if (typeof obj !== 'object' || typeof obj.el !== 'string' ||  typeof obj.data !== 'object') {
        throw new Error('invalid model type');
      }
      var $els = window.document.querySelectorAll(obj.el);
      if (!$els.length) {
        throw new Error('cannot find the element');
      }
      var $el = $els[0],
          model;
      model = new Model({
        $el: $el,
        tpl: $el.innerHTML,
        data: obj.data
      });
      this.buildObj(model.data, model);
      this.modelList.push(model);
      model.render();
      model.inited = true;
      return model;
    };
    proto.watcher = function() {
      var self = this;
      self.modelList.forEach(function(model) {
        model.render();
      });
    };
    return Oscar;
  })();
})((new Function('return this;'))());
