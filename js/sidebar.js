/* ===== SIDEBAR ===== */

const Sidebar = {
  init() {
    this.bindNavigation();
    this.bindWorkspace();
  },

  bindNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });
  },

  navigateTo(page) {
    // Update nav items
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update page sections
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(`page-${page}`);
    if (section) section.classList.add('active');

    // Refresh the page data
    switch (page) {
      case 'dashboard': Dashboard.render(); break;
      case 'financeiro': Financeiro.render(); break;
      case 'projetos': Projetos.render(); break;
      case 'clientes': Clientes.render(); break;
      case 'estudos': Estudos.render(); break;
    }
  },

  bindWorkspace() {
    const toggle = document.getElementById('workspace-toggle');
    const dropdown = document.getElementById('workspace-dropdown');
    const addBtn = document.getElementById('add-workspace-btn');

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle.classList.toggle('open');
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      toggle.classList.remove('open');
      dropdown.classList.remove('show');
    });

    dropdown.addEventListener('click', (e) => e.stopPropagation());

    addBtn.addEventListener('click', () => {
      dropdown.classList.remove('show');
      toggle.classList.remove('open');
      openModal('modal-workspace');
    });

    document.getElementById('save-workspace-btn').addEventListener('click', () => {
      const name = document.getElementById('ws-name').value.trim();
      const color = document.getElementById('ws-color').value;
      if (!name) return;
      Store.addWorkspace(name, color);
      document.getElementById('ws-name').value = '';
      closeModal('modal-workspace');
      this.renderWorkspaces();
    });

    this.renderWorkspaces();
  },

  renderWorkspaces() {
    const workspaces = Store.getWorkspaces();
    const active = Store.getActiveWorkspace();
    const list = document.getElementById('workspace-list');

    // Update current
    document.getElementById('ws-current-name').textContent = active.name;
    document.getElementById('ws-current-color').style.background = active.color;

    // Render dropdown list
    list.innerHTML = workspaces.map(ws => `
      <div class="workspace-item ${ws.id === active.id ? 'active' : ''}" data-ws-id="${ws.id}">
        <span class="ws-color" style="background: ${ws.color};"></span>
        <span>${ws.name}</span>
      </div>
    `).join('');

    // Bind clicks
    list.querySelectorAll('.workspace-item').forEach(item => {
      item.addEventListener('click', () => {
        Store.setActiveWorkspace(item.dataset.wsId);
        this.renderWorkspaces();
        // Refresh current page
        const activePage = document.querySelector('.nav-item.active');
        if (activePage) this.navigateTo(activePage.dataset.page);
        // Close dropdown
        document.getElementById('workspace-toggle').classList.remove('open');
        document.getElementById('workspace-dropdown').classList.remove('show');
      });
    });
  }
};
