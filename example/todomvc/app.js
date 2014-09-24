function onLoad() {
  var data = {
    todos: [],
    filterTodos: [],
    filter: 'all',
    remaining: 0,
    pluralize: function(txt, count) {
      if (count > 1) return txt + 's';
      return txt;
    },
    editedTodo: null,
    editTodo: function(todo) {
      todo.editing = true;
    },
    removeTodo: function(todo) {
      todo.removed = true;
    },
    allDone: function() {
      var bool = data.filterTodos.some(function(v) {return !v.completed});
      data.filterTodos.forEach(function(d) {
        d.completed = bool;
      });
    },
    submitEdit: function(todo, $this, $event) {
      if ($event.keyCode === 13) {
        todo.title = $this.value;
        todo.editing = false;
      }
    }
  };
  document.getElementById('new-todo').addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
      var title = this.value;
      var todo = {
        title: title,
        hide: false,
        completed: false,
        editing: false,
        removed: false
      };
      data.todos.push(todo);
      this.value = '';
    }
  });
  var oscar = new Oscar();
  var model = oscar.modelRegister({
    el: '#todoapp',
    data: data
  });
  function filter() {
    switch (data.filter) {
      case 'all':
        data.filterTodos.forEach(function(todo) {
          todo.hide = false;
        });
        break;
      case 'active':
        data.filterTodos.forEach(function(todo) {
          todo.hide = false;
          if (todo.completed) todo.hide = true;
        });
        break;
      case 'completed':
        data.filterTodos.forEach(function(todo) {
          todo.hide = false;
          if (!todo.completed) todo.hide = true;
        });
        break;
    }
  }
  model.watch('todos', function() {
    data.filterTodos = data.todos;
  });
  model.watch('filter', filter);
  model.watch('filterTodos', function() {
    var count = 0;
    data.todos.forEach(function(todo) {
      if (!todo.removed) count++;
    });
    data.remaining = count;
  });
  window.data = data;
  window.model = model;
}

window.onload = onLoad;
