/* ===== PROJETOS (KANBAN) ===== */

const Projetos = {
  draggedId: null,
  currentTagFilter: 'todas',

  init() {
    this.bindEvents();
    this.setupDragDrop();
  },

  bindEvents() {
    document.getElementById('add-project-btn').addEventListener('click', () => this.openForm());
    document.getElementById('save-project-btn').addEventListener('click', () => this.saveForm());

    const tagFilter = document.getElementById('filter-project-tag');
    if (tagFilter) {
      tagFilter.addEventListener('change', (e) => {
        this.currentTagFilter = e.target.value;
        this.render();
      });
    }
  },

  render() {
    this.updateClientSelect();
    let projects = Store.getAll('projects');

    // 1. Extrair todas as tags únicas para popular o filtro
    const allTags = new Set();
    projects.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(t => allTags.add(t));
      }
    });
    
    // Atualizar opções do select de filtro
    const tagSelect = document.getElementById('filter-project-tag');
    if (tagSelect) {
      // Guarda o valor atual para tentar repor
      const currVal = this.currentTagFilter;
      let optsHtml = '<option value="todas">Todas as Etiquetas</option>';
      let foundCurr = currVal === 'todas';
      
      Array.from(allTags).sort().forEach(tag => {
        if (tag === currVal) foundCurr = true;
        optsHtml += `<option value="${tag}">${tag}</option>`;
      });
      
      tagSelect.innerHTML = optsHtml;
      
      // Se a tag que estava filtrada não existir mais, volta pra "todas"
      if (!foundCurr) {
        this.currentTagFilter = 'todas';
      }
      tagSelect.value = this.currentTagFilter;
    }

    // 2. Aplicar filtro
    if (this.currentTagFilter !== 'todas') {
      projects = projects.filter(p => p.tags && p.tags.includes(this.currentTagFilter));
    }

    const columns = { todo: [], doing: [], done: [] };
    projects.forEach(p => {
      if (columns[p.status]) columns[p.status].push(p);
    });

    Object.entries(columns).forEach(([status, items]) => {
      const container = document.getElementById(`col-${status}`);
      const count = document.getElementById(`count-${status}`);
      count.textContent = items.length;

      if (items.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:2rem 1rem;color:var(--text-tertiary);font-size:var(--font-size-xs);">
            Arraste projetos aqui
          </div>
        `;
        return;
      }

      container.innerHTML = items.map(p => {
        const client = p.clientId ? Store.getById('clients', p.clientId) : null;
        
        // Tags markup
        const tagsHtml = (p.tags && p.tags.length > 0)
          ? `<div class="kanban-card-tags">${p.tags.map(t => `<span class="kanban-card-tag">${t}</span>`).join('')}</div>`
          : '';

        return `
          <div class="kanban-card priority-${p.priority}" draggable="true" data-id="${p.id}">
            <div class="kanban-card-title">${p.name}</div>
            ${p.description ? `<div class="kanban-card-desc">${p.description}</div>` : ''}
            ${tagsHtml}
            <div class="kanban-card-footer">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                ${p.deadline ? `<span class="card-date"><i data-lucide="calendar" style="width:12px;height:12px;"></i> ${formatDate(p.deadline)}</span>` : ''}
                ${client ? `<span class="badge badge-purple" style="font-size:10px;">${client.company ? client.company : client.name}</span>` : ''}
                <span class="priority-pill ${p.priority}">${p.priority}</span>
              </div>
              <div class="card-actions">
                <button onclick="Projetos.edit('${p.id}')" title="Editar"><i data-lucide="pencil" style="width:13px;height:13px;"></i></button>
                <button class="delete-btn" onclick="Projetos.confirmDelete('${p.id}')" title="Excluir"><i data-lucide="trash-2" style="width:13px;height:13px;"></i></button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    });

    lucide.createIcons();
    this.setupDragDrop();
  },

  setupDragDrop() {
    // Cards
    document.querySelectorAll('.kanban-card[draggable]').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.kanban-column-body').forEach(b => b.classList.remove('drag-over'));
      });
    });

    // Columns
    document.querySelectorAll('.kanban-column-body').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });
      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const newStatus = col.closest('.kanban-column').dataset.status;
        if (this.draggedId && newStatus) {
          Store.update('projects', this.draggedId, { status: newStatus });
          this.render();
        }
      });
    });
  },

  updateClientSelect() {
    const clients = Store.getAll('clients');
    const select = document.getElementById('pj-client');
    select.innerHTML = '<option value="">Nenhum</option>' +
      clients.map(c => `<option value="${c.id}">${c.company ? `${c.company} — ${c.name}` : c.name}</option>`).join('');
  },

  openForm(data = null) {
    this.updateClientSelect();
    document.getElementById('modal-project-title').textContent = data ? 'Editar Projeto' : 'Novo Projeto';
    document.getElementById('pj-name').value = data ? data.name : '';
    document.getElementById('pj-description').value = data ? (data.description || '') : '';
    document.getElementById('pj-deadline').value = data ? (data.deadline || '') : '';
    document.getElementById('pj-priority').value = data ? data.priority : 'media';
    document.getElementById('pj-client').value = data ? (data.clientId || '') : '';
    
    // Configura tags
    document.getElementById('pj-tags').value = (data && data.tags) ? data.tags.join(', ') : '';

    document.getElementById('pj-id').value = data ? data.id : '';
    document.getElementById('pj-status').value = data ? data.status : 'todo';
    openModal('modal-project');
  },

  saveForm() {
    const id = document.getElementById('pj-id').value;
    
    // Converte input de tags em array
    const tagsInput = document.getElementById('pj-tags').value;
    const tagsArray = tagsInput.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const data = {
      name: document.getElementById('pj-name').value.trim(),
      description: document.getElementById('pj-description').value.trim(),
      deadline: document.getElementById('pj-deadline').value,
      priority: document.getElementById('pj-priority').value,
      clientId: document.getElementById('pj-client').value,
      status: document.getElementById('pj-status').value,
      tags: tagsArray
    };
    if (!data.name) return;

    if (id) {
      Store.update('projects', id, data);
    } else {
      Store.add('projects', data);
    }
    closeModal('modal-project');
    this.render();
  },

  edit(id) {
    const item = Store.getById('projects', id);
    if (item) this.openForm(item);
  },

  confirmDelete(id) {
    document.getElementById('confirm-message').textContent = 'Tem certeza que deseja excluir este projeto?';
    const btn = document.getElementById('confirm-action-btn');
    btn.onclick = () => {
      Store.delete('projects', id);
      closeModal('modal-confirm');
      this.render();
    };
    openModal('modal-confirm');
  }
};
