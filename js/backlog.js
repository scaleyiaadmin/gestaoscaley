/* ===== BACKLOG — TAREFAS CORPORATIVAS ===== */

const Backlog = {
  filter: 'todos',

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const addBtn = document.getElementById('add-backlog-task-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openForm());
    }

    const saveBtn = document.getElementById('save-task-btn');
    // Nota: O modal-task é compartilhado com Estudos, então o save-task-btn já tem um listener no Estudos.js.
    // Para o Backlog funcionar bem, vamos usar um listener específico se estivermos no backlog.
    
    document.querySelectorAll('#backlog-filters .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#backlog-filters .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.filter;
        this.render();
      });
    });
  },

  render() {
    let tasks = Store.getAll('backlog');
    if (this.filter === 'pendente') tasks = tasks.filter(t => !t.completed);
    else if (this.filter === 'concluido') tasks = tasks.filter(t => t.completed);

    const priorityOrder = { alta: 0, media: 1, baixa: 2 };
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    const container = document.getElementById('backlog-list');
    const empty = document.getElementById('backlog-empty');

    if (tasks.length === 0) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      lucide.createIcons();
      return;
    }
    empty.classList.add('hidden');

    container.innerHTML = tasks.map(t => `
      <div class="task-item ${t.completed ? 'completed' : ''}">
        <label class="checkbox-wrapper">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="Backlog.toggleComplete('${t.id}', this.checked)">
        </label>
        <div class="task-info">
          <div class="task-title">${t.title}</div>
          <div class="task-meta">
            <span class="priority-pill ${t.priority}">${t.priority}</span>
            ${t.deadline ? `<span><i data-lucide="calendar"></i> ${formatDate(t.deadline)}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button onclick="Backlog.edit('${t.id}')" title="Editar"><i data-lucide="pencil"></i></button>
          <button class="delete-btn" onclick="Backlog.confirmDelete('${t.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `).join('');
    lucide.createIcons();
  },

  toggleComplete(id, completed) {
    Store.update('backlog', id, { completed });
    this.render();
  },

  openForm(data = null) {
    // Usamos o mesmo modal de tarefa do Estudos.js
    document.getElementById('modal-task-title').textContent = data ? 'Editar Backlog' : 'Nova Tarefa de Backlog';
    document.getElementById('tk-title').value = data ? data.title : '';
    document.getElementById('tk-description').value = data ? (data.description || '') : '';
    document.getElementById('tk-deadline').value = data ? (data.deadline || '') : '';
    document.getElementById('tk-priority').value = data ? data.priority : 'media';
    document.getElementById('tk-id').value = data ? data.id : '';
    
    // Sobrescrevemos o save temporariamente para o backlog
    const saveBtn = document.getElementById('save-task-btn');
    const oldOnclick = saveBtn.onclick;
    saveBtn.onclick = () => {
      const id = document.getElementById('tk-id').value;
      const taskData = {
        title: document.getElementById('tk-title').value.trim(),
        description: document.getElementById('tk-description').value.trim(),
        deadline: document.getElementById('tk-deadline').value,
        priority: document.getElementById('tk-priority').value
      };
      if (!taskData.title) return;
      if (id) {
        Store.update('backlog', id, taskData);
      } else {
        taskData.completed = false;
        Store.add('backlog', taskData);
      }
      closeModal('modal-task');
      this.render();
      saveBtn.onclick = oldOnclick; // Restaura (embora o Estudos.js tenha seu próprio listener fixo)
    };

    openModal('modal-task');
  },

  edit(id) {
    const item = Store.getById('backlog', id);
    if (item) this.openForm(item);
  },

  confirmDelete(id) {
    document.getElementById('confirm-message').textContent = 'Tem certeza que deseja excluir esta tarefa do backlog?';
    const btn = document.getElementById('confirm-action-btn');
    btn.onclick = () => {
      Store.delete('backlog', id);
      closeModal('modal-confirm');
      this.render();
    };
    openModal('modal-confirm');
  }
};
