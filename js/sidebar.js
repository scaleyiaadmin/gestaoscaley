/* ===== SIDEBAR ===== */

const Sidebar = {
  init() {
    this.bindNavigation();
    this.bindWorkspace();
    this.bindMobileMenu();
  },

  bindMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('mobile-open');
      });

      // Fecha ao clicar fora (no main content)
      document.getElementById('main-content').addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
      });
    }
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

    // Fecha a sidebar no mobile após navegar
    document.getElementById('sidebar').classList.remove('mobile-open');

    // Refresh the page data
    switch (page) {
      case 'dashboard': Dashboard.render(); break;
      case 'financeiro': Financeiro.render(); break;
      case 'projetos': Projetos.render(); break;
      case 'clientes': Clientes.render(); break;
      case 'cobrancas': Cobrancas.render(); break;
      case 'estudos': Estudos.render(); break;
      case 'backlog': Backlog.render(); break;
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
      document.getElementById('modal-workspace').querySelector('h2').textContent = 'Novo Workspace';
      document.getElementById('ws-id').value = '';
      document.getElementById('ws-name').value = '';
      document.getElementById('ws-color').value = '#7c5cfc';
      document.getElementById('ws-type').value = 'personal';
      document.getElementById('save-workspace-btn').textContent = 'Criar';
      openModal('modal-workspace');
    });

    document.getElementById('save-workspace-btn').addEventListener('click', () => {
      const id = document.getElementById('ws-id').value;
      const name = document.getElementById('ws-name').value.trim();
      const color = document.getElementById('ws-color').value;
      const type = document.getElementById('ws-type').value;

      if (!name) return;

      if (id) {
        Store.updateWorkspace(id, { name, color, type });
      } else {
        Store.addWorkspace(name, color, type);
      }

      closeModal('modal-workspace');
      this.renderWorkspaces();
      // Atualiza a navegação após salvar (caso tenha mudado o tipo do ativo)
      this.updateNavigationVisibility();
    });

    this.renderWorkspaces();
    this.updateNavigationVisibility();
  },

  updateNavigationVisibility() {
    const active = Store.getActiveWorkspace();
    const navEstudos = document.getElementById('nav-estudos');
    const navBacklog = document.getElementById('nav-backlog');

    const navClientes = document.getElementById('nav-clientes');
    const navCobrancas = document.getElementById('nav-cobrancas');

    if (active.type === 'enterprise') {
      navEstudos.classList.add('hidden');
      navBacklog.classList.remove('hidden');
      navClientes.classList.remove('hidden');
      navCobrancas.querySelector('span').textContent = 'Cobranças';
    } else {
      navEstudos.classList.remove('hidden');
      navBacklog.classList.add('hidden');
      navClientes.classList.add('hidden');
      navCobrancas.querySelector('span').textContent = 'Contas e Ganhos';
    }
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
        <div class="ws-info">
          <span class="ws-color" style="background: ${ws.color};"></span>
          <span class="ws-label">${ws.name} ${ws.type === 'enterprise' ? '<small>(Empresa)</small>' : ''}</span>
        </div>
        <div class="ws-actions">
          <button class="ws-action-btn edit" title="Editar"><i data-lucide="edit-3"></i></button>
          ${workspaces.length > 1 ? `<button class="ws-action-btn delete" title="Excluir"><i data-lucide="trash-2"></i></button>` : ''}
        </div>
      </div>
    `).join('');

    lucide.createIcons();

    // Bind clicks selection
    list.querySelectorAll('.ws-info').forEach(info => {
      info.addEventListener('click', (e) => {
        const item = info.closest('.workspace-item');
        Store.setActiveWorkspace(item.dataset.wsId);
        this.renderWorkspaces();
        this.updateNavigationVisibility();
        
        // Fecha a sidebar no mobile após mudar workspace
        document.getElementById('sidebar').classList.remove('mobile-open');
        
        // Refresh current page
        const activePage = document.querySelector('.nav-item.active');
        if (activePage) this.navigateTo(activePage.dataset.page);
        
        // Close dropdown
        document.getElementById('workspace-toggle').classList.remove('open');
        document.getElementById('workspace-dropdown').classList.remove('show');
      });
    });

    // Bind Edit
    list.querySelectorAll('.ws-action-btn.edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.closest('.workspace-item').dataset.wsId;
        const ws = workspaces.find(w => w.id === id);
        
        document.getElementById('modal-workspace').querySelector('h2').textContent = 'Editar Workspace';
        document.getElementById('ws-id').value = ws.id;
        document.getElementById('ws-name').value = ws.name;
        document.getElementById('ws-color').value = ws.color;
        document.getElementById('ws-type').value = ws.type || 'personal';
        document.getElementById('save-workspace-btn').textContent = 'Salvar Alterações';
        
        document.getElementById('workspace-dropdown').classList.remove('show');
        document.getElementById('workspace-toggle').classList.remove('open');
        openModal('modal-workspace');
      });
    });

    // Bind Delete
    list.querySelectorAll('.ws-action-btn.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.closest('.workspace-item').dataset.wsId;
        const ws = workspaces.find(w => w.id === id);
        
        if (confirm(`Tem certeza que deseja excluir o workspace "${ws.name}"? Todos os dados vinculados a ele serão perdidos localmente.`)) {
          Store.deleteWorkspace(id);
          this.renderWorkspaces();
          this.updateNavigationVisibility();
        }
      });
    });
  }
};
