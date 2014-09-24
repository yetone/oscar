function onLoad() {
  var data = {
    todos: JSON.parse(window.localStorage.getItem('todos-oscarjs') || '[]'),
    filter: 'all',
    remaining: 0,
    completedCount: 0,
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
      var bool = data.todos.some(function(v) {return !v.completed});
      data.todos.forEach(function(d) {
        d.completed = bool;
      });
    },
    submitEdit: function(todo, $this, $event) {
      if ($event.keyCode === 13) {
        todo.title = $this.value;
        todo.editing = false;
      }
    },
    removeCompleted: function() {
      data.todos.forEach(function(todo) {
        todo.completed && (todo.removed = true);
      });
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
        data.todos.forEach(function(todo) {
          todo.hide = false;
        });
        break;
      case 'active':
        data.todos.forEach(function(todo) {
          todo.hide = false;
          if (todo.completed) todo.hide = true;
        });
        break;
      case 'completed':
        data.todos.forEach(function(todo) {
          todo.hide = false;
          if (!todo.completed) todo.hide = true;
        });
        break;
    }
  }
  model.watch('filter', filter);
  model.watch('todos', function() {
    var remaining = 0,
        completedCount = 0;
    data.todos.forEach(function(todo) {
      if (!todo.removed && !todo.completed) remaining++;
      if (!todo.removed && todo.completed) completedCount++;
    });
    data.remaining = remaining;
    data.completedCount = completedCount;
    window.localStorage.setItem('todos-oscarjs', JSON.stringify(data.todos));
  });
  window.data = data;
  window.model = model;
}

window.onload = onLoad;
