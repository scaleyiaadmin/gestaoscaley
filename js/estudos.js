/* ===== ESTUDOS — TAREFAS, LIVROS, CURSOS, METAS ===== */

const Estudos = {
  filter: 'todos',
  activeSubtab: 'tarefas',

  init() {
    this.bindEvents();
    this.bindSubtabs();
    this.bindBooks();
    this.bindCourses();
    this.bindGoals();
  },

  bindEvents() {
    document.getElementById('add-task-btn').addEventListener('click', () => this.openForm());
    document.getElementById('save-task-btn').addEventListener('click', () => this.saveForm());

    document.querySelectorAll('#task-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#task-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.filter;
        this.renderTasks();
      });
    });
  },

  // ===== SUB-TABS =====
  bindSubtabs() {
    document.querySelectorAll('#estudos-main-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#estudos-main-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeSubtab = btn.dataset.subtab;
        this.showSubtab(btn.dataset.subtab);
        this.updateActionButton();
      });
    });
  },

  showSubtab(subtab) {
    document.querySelectorAll('.estudos-subtab-content').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`subtab-${subtab}`);
    if (el) el.classList.add('active');
    // Re-render active subtab data
    switch (subtab) {
      case 'tarefas': this.renderTasks(); break;
      case 'livros': this.renderBooks(); break;
      case 'cursos': this.renderCourses(); break;
      case 'metas': this.renderGoals(); break;
    }
  },

  updateActionButton() {
    const container = document.getElementById('estudos-action-btns');
    const btnMap = {
      tarefas: { label: 'Nova Tarefa', icon: 'plus', action: () => this.openForm() },
      livros: { label: 'Novo Livro', icon: 'plus', action: () => this.openBookForm() },
      cursos: { label: 'Novo Curso', icon: 'plus', action: () => this.openCourseForm() },
      metas: { label: 'Nova Meta', icon: 'plus', action: () => this.openGoalForm() }
    };
    const cfg = btnMap[this.activeSubtab] || btnMap.tarefas;
    container.innerHTML = `
      <button class="btn btn-primary" id="dynamic-add-btn">
        <i data-lucide="${cfg.icon}"></i>
        ${cfg.label}
      </button>
    `;
    lucide.createIcons();
    document.getElementById('dynamic-add-btn').addEventListener('click', cfg.action);
  },

  render() {
    this.renderStats();
    this.showSubtab(this.activeSubtab);
    this.updateActionButton();
  },

  renderStats() {
    const taskStats = Store.getTaskStats();
    const books = Store.getAll('books');
    const courses = Store.getAll('courses');
    const goals = Store.getAll('goals');

    const booksReading = books.filter(b => b.pagesRead < b.totalPages).length;
    const coursesActive = courses.filter(c => c.completedLessons < c.totalLessons).length;
    const goalsActive = goals.filter(g => g.current < g.target).length;

    document.getElementById('estudos-stats').innerHTML = `
      <div class="estudos-stat">
        <div class="stat-number">${taskStats.pending}</div>
        <div class="stat-text">Tarefas Pendentes</div>
      </div>
      <div class="estudos-stat">
        <div class="stat-number" style="color: var(--accent-primary);">${booksReading}</div>
        <div class="stat-text">Livros Lendo</div>
      </div>
      <div class="estudos-stat">
        <div class="stat-number" style="color: var(--accent-secondary);">${coursesActive}</div>
        <div class="stat-text">Cursos Ativos</div>
      </div>
      <div class="estudos-stat">
        <div class="stat-number" style="color: var(--color-warning);">${goalsActive}</div>
        <div class="stat-text">Metas Ativas</div>
      </div>
    `;

    // Progresso geral: média de tarefas + livros + cursos + metas
    const counts = [];
    if (taskStats.total > 0) counts.push(taskStats.percent);
    if (books.length > 0) {
      const avgBook = Math.round(books.reduce((s, b) => s + Math.min(100, (b.pagesRead / b.totalPages) * 100), 0) / books.length);
      counts.push(avgBook);
    }
    if (courses.length > 0) {
      const avgCourse = Math.round(courses.reduce((s, c) => s + Math.min(100, (c.completedLessons / c.totalLessons) * 100), 0) / courses.length);
      counts.push(avgCourse);
    }
    if (goals.length > 0) {
      const avgGoal = Math.round(goals.reduce((s, g) => s + Math.min(100, (g.current / g.target) * 100), 0) / goals.length);
      counts.push(avgGoal);
    }
    const overallPercent = counts.length > 0 ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0;

    document.getElementById('progress-percent').textContent = `${overallPercent}%`;
    document.getElementById('progress-fill').style.width = `${overallPercent}%`;
  },

  // ===== TAREFAS =====
  renderTasks() {
    let tasks = Store.getAll('tasks');
    if (this.filter === 'pendente') tasks = tasks.filter(t => !t.completed);
    else if (this.filter === 'concluido') tasks = tasks.filter(t => t.completed);

    const priorityOrder = { alta: 0, media: 1, baixa: 2 };
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    const container = document.getElementById('task-list');
    const empty = document.getElementById('tasks-empty');

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
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="Estudos.toggleComplete('${t.id}', this.checked)">
        </label>
        <div class="task-info">
          <div class="task-title">${t.title}</div>
          <div class="task-meta">
            <span class="priority-pill ${t.priority}">${t.priority}</span>
            ${t.deadline ? `<span><i data-lucide="calendar"></i> ${formatDate(t.deadline)}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button onclick="Estudos.edit('${t.id}')" title="Editar"><i data-lucide="pencil"></i></button>
          <button class="delete-btn" onclick="Estudos.confirmDelete('${t.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `).join('');
    lucide.createIcons();
  },

  toggleComplete(id, completed) {
    Store.update('tasks', id, { completed });
    this.renderStats();
    this.renderTasks();
  },

  openForm(data = null) {
    document.getElementById('modal-task-title').textContent = data ? 'Editar Tarefa' : 'Nova Tarefa';
    document.getElementById('tk-title').value = data ? data.title : '';
    document.getElementById('tk-description').value = data ? (data.description || '') : '';
    document.getElementById('tk-deadline').value = data ? (data.deadline || '') : '';
    document.getElementById('tk-priority').value = data ? data.priority : 'media';
    document.getElementById('tk-id').value = data ? data.id : '';
    openModal('modal-task');
  },

  saveForm() {
    const id = document.getElementById('tk-id').value;
    const data = {
      title: document.getElementById('tk-title').value.trim(),
      description: document.getElementById('tk-description').value.trim(),
      deadline: document.getElementById('tk-deadline').value,
      priority: document.getElementById('tk-priority').value
    };
    if (!data.title) return;
    if (id) {
      Store.update('tasks', id, data);
    } else {
      data.completed = false;
      Store.add('tasks', data);
    }
    closeModal('modal-task');
    this.renderStats();
    this.renderTasks();
  },

  edit(id) {
    const item = Store.getById('tasks', id);
    if (item) this.openForm(item);
  },

  confirmDelete(id) {
    document.getElementById('confirm-message').textContent = 'Tem certeza que deseja excluir esta tarefa?';
    const btn = document.getElementById('confirm-action-btn');
    btn.onclick = () => {
      Store.delete('tasks', id);
      closeModal('modal-confirm');
      this.renderStats();
      this.renderTasks();
    };
    openModal('modal-confirm');
  },

  // ===== LIVROS =====
  bindBooks() {
    document.getElementById('save-book-btn').addEventListener('click', () => this.saveBook());
    document.getElementById('save-reading-btn').addEventListener('click', () => this.saveReading());

    // Upload de capa
    const coverArea = document.getElementById('bk-cover-area');
    const coverInput = document.getElementById('bk-cover-input');
    const coverPreview = document.getElementById('bk-cover-preview');

    coverArea.addEventListener('click', () => coverInput.click());
    coverInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        // Comprime a imagem para evitar exceder o localStorage
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_W = 400;
          const scale = Math.min(1, MAX_W / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          document.getElementById('bk-cover-data').value = compressed;
          coverPreview.innerHTML = `<img src="${compressed}" alt="Capa">`;
          coverPreview.classList.add('has-image');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  renderBooks() {
    const books = Store.getAll('books');
    const grid = document.getElementById('books-grid');
    const empty = document.getElementById('books-empty');

    if (books.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      lucide.createIcons();
      return;
    }
    empty.classList.add('hidden');

    grid.innerHTML = books.map(b => {
      const pct = Math.min(100, Math.round((b.pagesRead / b.totalPages) * 100));
      const remaining = b.totalPages - b.pagesRead;
      const daysLeft = remaining > 0 ? Math.ceil(remaining / b.pagesPerDay) : 0;
      const isComplete = b.pagesRead >= b.totalPages;
      const readingLog = b.readingLog || [];
      const recentLogs = readingLog.slice(-5).reverse();
      const hasCover = b.cover && b.cover.length > 0;

      return `
        <div class="book-card ${isComplete ? 'completed-book' : ''}">
          <div class="book-card-cover">
            ${hasCover
              ? `<img src="${b.cover}" alt="${b.title}">`
              : `<div class="no-cover"><i data-lucide="book-open"></i><span>${b.title}</span></div>`
            }
            <div class="cover-overlay"></div>
          </div>
          <div class="book-card-body">
            <div class="book-card-header">
              <div class="book-info">
                <div class="book-title">${b.title}</div>
                <div class="book-author">${b.author || 'Autor desconhecido'}</div>
                <span class="category-tag">${b.category || 'outros'}</span>
              </div>
              <div class="book-card-actions">
                <button onclick="Estudos.editBook('${b.id}')" title="Editar"><i data-lucide="pencil"></i></button>
                <button class="delete-btn" onclick="Estudos.confirmDeleteBook('${b.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
              </div>
            </div>

            <div class="book-progress-section">
              <div class="book-progress-header">
                <span class="progress-text">${b.pagesRead} de ${b.totalPages} páginas</span>
                <span class="progress-pct">${pct}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${pct}%;"></div>
              </div>
            </div>

            <div class="book-stats">
              <div class="book-stat">
                <span class="bs-value">${b.pagesPerDay}</span>
                <span class="bs-label">Págs/dia</span>
              </div>
              <div class="book-stat">
                <span class="bs-value">${remaining}</span>
                <span class="bs-label">Restantes</span>
              </div>
              <div class="book-stat">
                <span class="bs-value">${isComplete ? '✓' : daysLeft + 'd'}</span>
                <span class="bs-label">${isComplete ? 'Concluído' : 'Previsão'}</span>
              </div>
            </div>

            ${!isComplete ? `
              <div class="book-card-footer">
                <button class="btn btn-primary btn-sm" onclick="Estudos.openReadingForm('${b.id}')">
                  <i data-lucide="plus"></i> Registrar Leitura
                </button>
              </div>
            ` : ''}

            ${recentLogs.length > 0 ? `
              <div class="reading-log">
                <div class="reading-log-title">Últimas leituras</div>
                <div class="reading-log-entries">
                  ${recentLogs.map(l => `
                    <div class="reading-entry">
                      <span class="re-date">${formatDate(l.date)}</span>
                      <span class="re-pages">+${l.pages} págs</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    lucide.createIcons();
  },

  openBookForm(data = null) {
    document.getElementById('modal-book-title').textContent = data ? 'Editar Livro' : 'Novo Livro';
    document.getElementById('bk-title').value = data ? data.title : '';
    document.getElementById('bk-author').value = data ? (data.author || '') : '';
    document.getElementById('bk-total-pages').value = data ? data.totalPages : '';
    document.getElementById('bk-pages-per-day').value = data ? data.pagesPerDay : '';
    document.getElementById('bk-pages-read').value = data ? data.pagesRead : 0;
    document.getElementById('bk-category').value = data ? (data.category || 'outros') : 'tecnologia';
    document.getElementById('bk-id').value = data ? data.id : '';

    // Capa
    const coverPreview = document.getElementById('bk-cover-preview');
    const coverInput = document.getElementById('bk-cover-input');
    coverInput.value = '';
    if (data && data.cover) {
      document.getElementById('bk-cover-data').value = data.cover;
      coverPreview.innerHTML = `<img src="${data.cover}" alt="Capa">`;
      coverPreview.classList.add('has-image');
    } else {
      document.getElementById('bk-cover-data').value = '';
      coverPreview.innerHTML = `<i data-lucide="image-plus"></i><span>Clique para adicionar capa</span>`;
      coverPreview.classList.remove('has-image');
      lucide.createIcons();
    }

    openModal('modal-book');
  },

  saveBook() {
    const id = document.getElementById('bk-id').value;
    const data = {
      title: document.getElementById('bk-title').value.trim(),
      author: document.getElementById('bk-author').value.trim(),
      totalPages: parseInt(document.getElementById('bk-total-pages').value),
      pagesPerDay: parseInt(document.getElementById('bk-pages-per-day').value),
      pagesRead: parseInt(document.getElementById('bk-pages-read').value) || 0,
      category: document.getElementById('bk-category').value,
      cover: document.getElementById('bk-cover-data').value || ''
    };
    if (!data.title || !data.totalPages || !data.pagesPerDay) return;

    if (id) {
      const existing = Store.getById('books', id);
      data.readingLog = existing ? existing.readingLog : [];
      Store.update('books', id, data);
    } else {
      data.readingLog = [];
      Store.add('books', data);
    }
    closeModal('modal-book');
    this.renderStats();
    this.renderBooks();
  },

  editBook(id) {
    const item = Store.getById('books', id);
    if (item) this.openBookForm(item);
  },

  confirmDeleteBook(id) {
    document.getElementById('confirm-message').textContent = 'Tem certeza que deseja excluir este livro?';
    const btn = document.getElementById('confirm-action-btn');
    btn.onclick = () => {
      Store.delete('books', id);
      closeModal('modal-confirm');
      this.renderStats();
      this.renderBooks();
    };
    openModal('modal-confirm');
  },

  openReadingForm(bookId) {
    document.getElementById('rd-pages').value = '';
    document.getElementById('rd-date').value = todayStr();
    document.getElementById('rd-book-id').value = bookId;
    openModal('modal-reading');
  },

  saveReading() {
    const bookId = document.getElementById('rd-book-id').value;
    const pages = parseInt(document.getElementById('rd-pages').value);
    const date = document.getElementById('rd-date').value;
    if (!pages || !bookId) return;

    const book = Store.getById('books', bookId);
    if (!book) return;

    const readingLog = book.readingLog || [];
    readingLog.push({ pages, date: date || todayStr() });

    const newPagesRead = Math.min(book.totalPages, book.pagesRead + pages);
    Store.update('books', bookId, { pagesRead: newPagesRead, readingLog });

    closeModal('modal-reading');
    this.renderStats();
    this.renderBooks();
  },

  // ===== CURSOS =====
  bindCourses() {
    document.getElementById('save-course-btn').addEventListener('click', () => this.saveCourse());
  },

  renderCourses() {
    const courses = Store.getAll('courses');
    const container = document.getElementById('courses-list');
    const empty = document.getElementById('courses-empty');

    if (courses.length === 0) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      lucide.createIcons();
      return;
    }
    empty.classList.add('hidden');

    container.innerHTML = courses.map(c => {
      const pct = Math.min(100, Math.round((c.completedLessons / c.totalLessons) * 100));
      const isComplete = c.completedLessons >= c.totalLessons;

      return `
        <div class="course-item">
          <div class="course-icon">
            <i data-lucide="${isComplete ? 'award' : 'graduation-cap'}"></i>
          </div>
          <div class="course-info">
            <div class="course-name">${c.name}${c.link ? ` <a href="${c.link}" target="_blank" style="color:var(--accent-secondary);font-size:11px;">↗</a>` : ''}</div>
            <div class="course-platform">${c.platform || 'Sem plataforma'}</div>
            <div class="course-progress-row">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${pct}%;"></div>
              </div>
              <span class="progress-text">${c.completedLessons}/${c.totalLessons} aulas (${pct}%)</span>
            </div>
          </div>
          ${!isComplete ? `
            <button class="btn btn-secondary btn-sm" onclick="Estudos.addLesson('${c.id}')" title="Concluir aula">
              <i data-lucide="plus" style="width:14px;height:14px;"></i> Aula
            </button>
          ` : `
            <span class="badge badge-success">Concluído</span>
          `}
          <div class="course-actions">
            <button onclick="Estudos.editCourse('${c.id}')" title="Editar"><i data-lucide="pencil"></i></button>
            <button class="delete-btn" onclick="Estudos.confirmDeleteCourse('${c.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      `;
    }).join('');
    lucide.createIcons();
  },

  openCourseForm(data = null) {
    document.getElementById('modal-course-title').textContent = data ? 'Editar Curso' : 'Novo Curso';
    document.getElementById('cs-name').value = data ? data.name : '';
    document.getElementById('cs-platform').value = data ? (data.platform || '') : '';
    document.getElementById('cs-total-lessons').value = data ? data.totalLessons : '';
    document.getElementById('cs-completed-lessons').value = data ? data.completedLessons : 0;
    document.getElementById('cs-link').value = data ? (data.link || '') : '';
    document.getElementById('cs-id').value = data ? data.id : '';
    openModal('modal-course');
  },

  saveCourse() {
    const id = document.getElementById('cs-id').value;
    const data = {
      name: document.getElementById('cs-name').value.trim(),
      platform: document.getElementById('cs-platform').value.trim(),
      totalLessons: parseInt(document.getElementById('cs-total-lessons').value),
      completedLessons: parseInt(document.getElementById('cs-completed-lessons').value) || 0,
      link: document.getElementById('cs-link').value.trim()
    };
    if (!data.name || !data.totalLessons) return;

    if (id) {
      Store.update('courses', id, data);
    } else {
      Store.add('courses', data);
    }
    closeModal('modal-course');
    this.renderStats();
    this.renderCourses();
  },

  editCourse(id) {
    const item = Store.getById('courses', id);
    if (item) this.openCourseForm(item);
  },

  addLesson(id) {
    const course = Store.getById('courses', id);
    if (!course) return;
    const newCompleted = Math.min(course.totalLessons, course.completedLessons + 1);
    Store.update('courses', id, { completedLessons: newCompleted });
    this.renderStats();
    this.renderCourses();
  },

  confirmDeleteCourse(id) {
    document.getElementById('confirm-message').textContent = 'Tem certeza que deseja excluir este curso?';
    const btn = document.getElementById('confirm-action-btn');
    btn.onclick = () => {
      Store.delete('courses', id);
      closeModal('modal-confirm');
      this.renderStats();
      this.renderCourses();
    };
    openModal('modal-confirm');
  },

  // ===== METAS =====
  bindGoals() {
    document.getElementById('save-goal-btn').addEventListener('click', () => this.saveGoal());
  },

  renderGoals() {
    const goals = Store.getAll('goals');
    const container = document.getElementById('goals-list');
    const empty = document.getElementById('goals-empty');

    if (goals.length === 0) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      lucide.createIcons();
      return;
    }
    empty.classList.add('hidden');

    container.innerHTML = goals.map(g => {
      const pct = Math.min(100, Math.round((g.current / g.target) * 100));
      const isComplete = g.current >= g.target;

      return `
        <div class="goal-card ${isComplete ? 'completed-goal' : ''}">
          <div class="goal-card-header">
            <div class="goal-icon">
              <i data-lucide="${isComplete ? 'trophy' : 'target'}"></i>
            </div>
            <div class="goal-card-actions">
              <button onclick="Estudos.editGoal('${g.id}')" title="Editar"><i data-lucide="pencil"></i></button>
              <button class="delete-btn" onclick="Estudos.confirmDeleteGoal('${g.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
            </div>
          </div>
          <div class="goal-title">${g.title}</div>
          ${g.description ? `<div class="goal-description">${g.description}</div>` : ''}

          <div class="goal-progress-section">
            <div class="goal-progress-stats">
              <span class="gps-current">${g.current} <span style="font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:400;">/ ${g.target} ${g.unit || ''}</span></span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>

          <div class="goal-footer">
            ${g.deadline ? `<span class="goal-deadline"><i data-lucide="calendar"></i> ${formatDate(g.deadline)}</span>` : '<span></span>'}
            ${!isComplete ? `
              <button class="btn btn-secondary btn-sm" onclick="Estudos.incrementGoal('${g.id}')">
                <i data-lucide="plus" style="width:12px;height:12px;"></i> Atualizar
              </button>
            ` : `
              <span class="badge badge-success">Concluída!</span>
            `}
          </div>
        </div>
      `;
    }).join('');
    lucide.createIcons();
  },

  openGoalForm(data = null) {
    document.getElementById('modal-goal-title').textContent = data ? 'Editar Meta' : 'Nova Meta';
    document.getElementById('gl-title').value = data ? data.title : '';
    document.getElementById('gl-description').value = data ? (data.description || '') : '';
    document.getElementById('gl-target').value = data ? data.target : '';
    document.getElementById('gl-current').value = data ? data.current : 0;
    document.getElementById('gl-unit').value = data ? (data.unit || '') : '';
    document.getElementById('gl-deadline').value = data ? (data.deadline || '') : '';
    document.getElementById('gl-id').value = data ? data.id : '';
    openModal('modal-goal');
  },

  saveGoal() {
    const id = document.getElementById('gl-id').value;
    const data = {
      title: document.getElementById('gl-title').value.trim(),
      description: document.getElementById('gl-description').value.trim(),
      target: parseInt(document.getElementById('gl-target').value),
      current: parseInt(document.getElementById('gl-current').value) || 0,
      unit: document.getElementById('gl-unit').value.trim(),
      deadline: document.getElementById('gl-deadline').value
    };
    if (!data.title || !data.target) return;

    if (id) {
      Store.update('goals', id, data);
    } else {
      Store.add('goals', data);
    }
    closeModal('modal-goal');
    this.renderStats();
    this.renderGoals();
  },

  editGoal(id) {
    const item = Store.getById('goals', id);
    if (item) this.openGoalForm(item);
  },

  incrementGoal(id) {
    const goal = Store.getById('goals', id);
    if (!goal) return;
    const increment = parseInt(prompt(`Adicionar progresso (atual: ${goal.current}/${goal.target} ${goal.unit || ''})`, '1'));
    if (!increment || isNaN(increment)) return;
    const newCurrent = Math.min(goal.target, goal.current + increment);
    Store.update('goals', id, { current: newCurrent });
    this.renderStats();
    this.renderGoals();
  },

  confirmDeleteGoal(id) {
    document.getElementById('confirm-message').textContent = 'Tem certeza que deseja excluir esta meta?';
    const btn = document.getElementById('confirm-action-btn');
    btn.onclick = () => {
      Store.delete('goals', id);
      closeModal('modal-confirm');
      this.renderStats();
      this.renderGoals();
    };
    openModal('modal-confirm');
  }
};
