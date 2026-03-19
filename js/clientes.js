/* ===== CLIENTES ===== */

const Clientes = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('add-client-btn').addEventListener('click', () => this.openForm());
    document.getElementById('save-client-btn').addEventListener('click', () => this.saveForm());
    document.getElementById('client-search').addEventListener('input', (e) => this.render(e.target.value));
    document.getElementById('cl-contract-file').addEventListener('change', (e) => this.handleFileUpload(e));
  },

  handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo do contrato é muito grande (Máx: 5MB).');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('cl-contract-data').value = event.target.result;
      document.getElementById('cl-contract-name').value = file.name;
    };
    reader.readAsDataURL(file);
  },

  render(search = '') {
    let clients = Store.getAll('clients');
    const grid = document.getElementById('clients-grid');
    const empty = document.getElementById('clients-empty');

    if (search) {
      const q = search.toLowerCase();
      clients = clients.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.cnpj && c.cnpj.toLowerCase().includes(q))
      );
    }

    if (clients.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      lucide.createIcons();
      return;
    }

    empty.classList.add('hidden');
    const projects = Store.getAll('projects');

    grid.innerHTML = clients.map(c => {
      const projCount = projects.filter(p => p.clientId === c.id).length;
      return `
        <div class="client-card">
          <div class="client-card-header">
            <div class="client-avatar">${getInitials(c.name)}</div>
            <div class="client-card-actions">
              <button onclick="Clientes.edit('${c.id}')" title="Editar">
                <i data-lucide="pencil"></i>
              </button>
              <button class="delete-btn" onclick="Clientes.confirmDelete('${c.id}')" title="Excluir">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
          <div class="client-name" style="margin-bottom: 2px;">${c.name}</div>
          ${c.company ? `<div class="client-company" style="display:flex;align-items:center;gap:4px;color:var(--accent-secondary);font-weight:500;margin-bottom:12px;"><i data-lucide="building-2" style="width:14px;height:14px;"></i> ${c.company}</div>` : '<div style="margin-bottom:12px;"></div>'}
          <div class="client-details">
            ${c.mrr ? `<div class="client-detail"><i data-lucide="badge-dollar-sign"></i> MRR: R$ ${parseFloat(c.mrr).toFixed(2)} (Dia ${c.dueDay || '--'})</div>` : ''}
            ${c.cnpj ? `<div class="client-detail"><i data-lucide="file-badge-2"></i> ${c.cnpj}</div>` : ''}
            ${c.email ? `<div class="client-detail"><i data-lucide="mail"></i> ${c.email}</div>` : ''}
            ${c.phone ? `<div class="client-detail"><i data-lucide="phone"></i> ${c.phone}</div>` : ''}
            ${c.contractData ? `<div class="client-detail"><a href="${c.contractData}" download="${c.contractName || 'contrato'}"><i data-lucide="file-text"></i> Baixar Contrato</a></div>` : ''}
          </div>
          <div class="client-projects-count">
            <i data-lucide="folder"></i>
            ${projCount} projeto${projCount !== 1 ? 's' : ''} vinculado${projCount !== 1 ? 's' : ''}
          </div>
        </div>
      `;
    }).join('');
    lucide.createIcons();
  },

  openForm(data = null) {
    document.getElementById('modal-client-title').textContent = data ? 'Editar Cliente' : 'Novo Cliente';
    document.getElementById('cl-name').value = data ? data.name : '';
    document.getElementById('cl-email').value = data ? (data.email || '') : '';
    document.getElementById('cl-phone').value = data ? (data.phone || '') : '';
    document.getElementById('cl-company').value = data ? (data.company || '') : '';
    document.getElementById('cl-cnpj').value = data ? (data.cnpj || '') : '';
    document.getElementById('cl-mrr').value = data ? (data.mrr || '') : '';
    document.getElementById('cl-due-day').value = data ? (data.dueDay || '') : '';
    document.getElementById('cl-notes').value = data ? (data.notes || '') : '';
    document.getElementById('cl-id').value = data ? data.id : '';
    document.getElementById('cl-contract-file').value = '';
    document.getElementById('cl-contract-data').value = data ? (data.contractData || '') : '';
    document.getElementById('cl-contract-name').value = data ? (data.contractName || '') : '';
    openModal('modal-client');
  },

  saveForm() {
    const id = document.getElementById('cl-id').value;
    const data = {
      name: document.getElementById('cl-name').value.trim(),
      email: document.getElementById('cl-email').value.trim(),
      phone: document.getElementById('cl-phone').value.trim(),
      company: document.getElementById('cl-company').value.trim(),
      cnpj: document.getElementById('cl-cnpj').value.trim(),
      mrr: document.getElementById('cl-mrr').value.trim(),
      dueDay: document.getElementById('cl-due-day').value.trim(),
      notes: document.getElementById('cl-notes').value.trim(),
      contractData: document.getElementById('cl-contract-data').value,
      contractName: document.getElementById('cl-contract-name').value
    };
    if (!data.name) return;

    if (id) {
      Store.update('clients', id, data);
    } else {
      Store.add('clients', data);
    }
    closeModal('modal-client');
    this.render();
  },

  edit(id) {
    const item = Store.getById('clients', id);
    if (item) this.openForm(item);
  },

  confirmDelete(id) {
    document.getElementById('confirm-message').textContent = 'Tem certeza que deseja excluir este cliente?';
    const btn = document.getElementById('confirm-action-btn');
    btn.onclick = () => {
      Store.delete('clients', id);
      closeModal('modal-confirm');
      this.render();
    };
    openModal('modal-confirm');
  }
};
