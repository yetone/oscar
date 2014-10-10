var assert = require('assert');
var utils = require('../src/utils');

var scope = {
  name: 'yetone',
  age: 23,
  skills: [
    'Python',
    'Golang',
    'JavaScript',
    'Erlang'
  ],
  other: {
    hehe: {
      lala: [1, 2, 3, '4']
    }
  }
};
describe('utils', function() {
  describe('isStr', function() {
    var func = utils.isStr;
    assert.equal(false, func({}));
    assert.equal(false, func([]));
    assert.equal(false, func(true));
    assert.equal(false, func(1));
    assert.equal(true, func('sdf'));
    assert.equal(false, func(/[a-z]/));
    assert.equal(false, func(function() {}));
  });
  describe('isObj', function() {
    var func = utils.isObj;
    assert.equal(true, func({}));
    assert.equal(false, func([]));
    assert.equal(false, func(true));
    assert.equal(false, func(1));
    assert.equal(false, func('sdf'));
    assert.equal(false, func(/[a-z]/));
    assert.equal(false, func(function() {}));
  });
  describe('isArray', function() {
    var func = utils.isArray;
    assert.equal(false, func({}));
    assert.equal(true, func([]));
    assert.equal(false, func(true));
    assert.equal(false, func(1));
    assert.equal(false, func('sdf'));
    assert.equal(false, func(/[a-z]/));
    assert.equal(false, func(function() {}));
  });
  describe('isFunction', function() {
    var func = utils.isFunction;
    assert.equal(false, func({}));
    assert.equal(false, func([]));
    assert.equal(false, func(true));
    assert.equal(false, func(1));
    assert.equal(false, func('sdf'));
    assert.equal(false, func(/[a-z]/));
    assert.equal(true, func(function() {}));
  });
  describe('toArray', function() {
    var obj = {
        0: 'zero',
        1: 'one',
        2: 'two',
        3: 'three',
        length: 3
      },
      arr = utils.toArray(obj);
    assert.equal(true, utils.isArray(arr));
    assert.equal(3, arr.length);
    assert.equal('zero', arr[0]);
    assert.equal('one', arr[1]);
    assert.equal('two', arr[2]);
    assert.equal(undefined, arr[3]);
  });
  describe('genS', function() {
    var str = 'a.b.c.0.1.efg.lmn.get';
    assert.equal(utils.genS(str), "['a']['b']['c']['0']['1']['efg']['lmn']['get']");
  });
  describe('genPath', function() {
    var str = "a['b']['c'][\"d\"][0][1].efg.h['2'].lmn[\"3\"]";
    assert.equal(utils.genPath(str), "a.b.c.d.0.1.efg.h.2.lmn.3");
  });
  describe('parseEvalStr', function() {
    var func = utils.parseEvalStr,
        str = '"sdf"+name + age + \'weed\' + hello[\'ioi\']+32+"skdlf"+yoo.xxx["iui"].opop[34].cvcv',
        obj = func(str),
        arr = obj.strL;
    assert.equal(5, arr.length);
    assert.equal('name', arr[0]);
    assert.equal('age', arr[1]);
    assert.equal('hello.ioi', arr[2]);
    assert.equal('32', arr[3]);
    assert.equal('yoo.xxx.iui.opop.34.cvcv', arr[4]);
  });
  describe('getType', function() {
    var func = utils.getType;
    assert.equal('Object', func({}));
    assert.equal('Array', func([]));
    assert.equal('Boolean', func(true));
    assert.equal('Number', func(1));
    assert.equal('String', func('sdf'));
    assert.equal('RegExp', func(/[a-z]/));
    assert.equal('Function', func(function() {}));
  });
});
