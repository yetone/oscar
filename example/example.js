// example
window.onload = function() {
  window.data0 = {
    name: 'yetone',
    age: 23,
    skills: [
      'Python',
      'Golang',
      'JavaScript'
    ],
    say: function() {
      return 'It works!';
    },
    dict: {
      a: 'red',
      b: 'green',
      3: 'blue'
    }
  };
  window.data1 = {
    name: 'enotey',
    age: 12,
    skills: [
      'Erlang',
      'Elixir',
      'Haskell'
    ]
  };
  window.data2 = {
    mode: 'a'
  };
  window.data3 = {
    country: 'China'
  };
  window.data4 = {
    countries: ['China', 'Japan'],
    ok: true
  };
  window.data5 = {
    time: new Date() - 0
  };
  var oscar = new Oscar();
  window.md0 = oscar.modelRegister({
    el: '#model0',
    data: data0
  });
  window.md1 = oscar.modelRegister({
    el: '#model1',
    data: data1
  });
  window.md2 = oscar.modelRegister({
    el: '#model2',
    data: data2
  });
  window.md3 = oscar.modelRegister({
    el: '#model3',
    data: data3
  });
  window.md4 = oscar.modelRegister({
    el: '#model4',
    data: data4
  });
  window.md5 = oscar.modelRegister({
    el: '#model5',
    data: data5
  });
};
