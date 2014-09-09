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
      a: 1,
      b: 2,
      3: 'c'
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
  var oscar = new Oscar();
  oscar.modelRegister({
    el: '#model0',
    data: data0
  });
  oscar.modelRegister({
    el: '#model1',
    data: data1
  });
  oscar.modelRegister({
    el: '#model2',
    data: data2
  });
  oscar.modelRegister({
    el: '#model3',
    data: data3
  });
  oscar.modelRegister({
    el: '#model4',
    data: data4
  });
};
