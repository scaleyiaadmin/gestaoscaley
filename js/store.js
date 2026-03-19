/* ===== STORE — Gerenciamento de Dados com localStorage + Supabase Sync ===== */

// Credenciais Supabase
const supabaseUrl = 'https://aabnysljsvtifgjjozuf.supabase.co';
const supabaseKey = 'sb_publishable_1EifRl4fEjp_vrDHDUDTuQ_WuavygM7';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const Store = {
  isSyncing: false,

  // Chave base
  _key(entity) {
    const ws = this.getActiveWorkspace();
    return `scaley_${ws.id}_${entity}`;
  },

  // Inicializa o sync com Supabase quando abrir o app
  async initSync(onComplete) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    
    // Mostra um estado de loading no console ou UI (opcional)
    console.log('[Sync] Iniciando download do Supabase...');

    try {
      // 1. Pega a sessão e o ID do usuário
      const { data: { session } } = await supabaseClient.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) throw new Error('Usuário não autenticado');

      // 2. Pega os workspaces do usuário
      const { data: wsData, error: wsErr } = await supabaseClient.from('scaley_workspaces').select('*').eq('user_id', userId);
      if (wsErr) throw wsErr;

      if (!wsData || wsData.length === 0) {
        // Banco limpo: se não tiver workspace, não tem nada. Limpa tudo local.
        localStorage.clear();
        // Recria apenas o pessoal e envia pra nuvem.
        const defaultWs = [{ id: 'pessoal', name: 'Pessoal', color: '#7c5cfc' }];
        localStorage.setItem('scaley_workspaces', JSON.stringify(defaultWs));
        await supabaseClient.from('scaley_workspaces').insert({ id: 'pessoal', data: defaultWs[0] });
      } else {
        // Tem dados: substitui o local
        const workspaces = wsData.map(w => w.data);
        localStorage.setItem('scaley_workspaces', JSON.stringify(workspaces));
      }

      // 2. Garante que 'pessoal' (ou o default recriado) está ativo para sync do conteúdo
      const activeWs = this.getActiveWorkspace();

      // 3. Pega todo conteúdo da tabela genérica para esse workspace e usuário
      // Nota: userId e session já foram definidos no topo do try
      const { data: contentData, error: contentErr } = await supabaseClient
        .from('scaley_data')
        .select('*')
        .eq('workspace_id', activeWs.id)
        .eq('user_id', userId);

      if (contentErr) throw contentErr;

      // Limpa os dados de entidades locais desse workspace
      ['transactions', 'projects', 'clients', 'tasks', 'activities', 'books', 'courses', 'goals'].forEach(ent => {
        localStorage.setItem(this._key(ent), JSON.stringify([]));
      });

      // Se tiver dados na nuvem, distribui pelos locais
      if (contentData && contentData.length > 0) {
        const entitiesMap = {};
        contentData.forEach(row => {
          if (!entitiesMap[row.entity_type]) entitiesMap[row.entity_type] = [];
          entitiesMap[row.entity_type].push(row.data);
        });

        Object.keys(entitiesMap).forEach(entity => {
          localStorage.setItem(this._key(entity), JSON.stringify(entitiesMap[entity]));
        });
      }

      console.log('[Sync] Download finalizado.');
    } catch (err) {
      console.error('[Sync] Erro:', err);
    } finally {
      this.isSyncing = false;
      if (onComplete) onComplete();
    }
  },

  // Salva no banco da nuvem em background (para entidades e arquivos JSON)
  async syncUp(entity, action, itemData) {
    const ws = this.getActiveWorkspace();
    
    // Pega o usuario ativo para assinar o envio
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const userId = session.user.id;
    
    // Se a entidade for "workspaces", usa a tabela separada
    if (entity === 'workspaces') {
      try {
        if (action === 'delete') {
          await supabaseClient.from('scaley_workspaces').delete().eq('id', itemData.id);
        } else {
          await supabaseClient.from('scaley_workspaces').upsert({
            id: itemData.id,
            user_id: userId,
            data: itemData
          });
        }
      } catch (err) { console.error('Erro no SyncUp Workspace:', err); }
      return;
    }

    // Caso normal
    try {
      if (action === 'delete') {
        await supabaseClient.from('scaley_data')
          .delete()
          .eq('workspace_id', ws.id)
          .eq('id', itemData.id)
          .eq('entity_type', entity);
      } else {
        await supabaseClient.from('scaley_data').upsert({
          id: itemData.id,
          workspace_id: ws.id,
          user_id: userId,
          entity_type: entity,
          data: itemData
        });
      }
    } catch (err) {
      console.error('Erro no SyncUp Geral:', err);
    }
  },

  // ===== WORKSPACES =====
  getWorkspaces() {
    let data = localStorage.getItem('scaley_workspaces');
    if (!data || JSON.parse(data).length === 0) {
      const defaults = [
        { id: 'pessoal', name: 'Pessoal', color: '#7c5cfc', type: 'personal' }
      ];
      localStorage.setItem('scaley_workspaces', JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  },

  saveWorkspaces(workspaces) {
    localStorage.setItem('scaley_workspaces', JSON.stringify(workspaces));
  },

  addWorkspace(name, color, type = 'personal') {
    const workspaces = this.getWorkspaces();
    const ws = { id: generateId(), name, color, type };
    workspaces.push(ws);
    this.saveWorkspaces(workspaces);
    // Sincroniza
    this.syncUp('workspaces', 'add', ws);
    return ws;
  },

  updateWorkspace(id, updates) {
    const workspaces = this.getWorkspaces();
    const idx = workspaces.findIndex(w => w.id === id);
    if (idx !== -1) {
      workspaces[idx] = { ...workspaces[idx], ...updates };
      this.saveWorkspaces(workspaces);
      this.syncUp('workspaces', 'update', workspaces[idx]);
      return workspaces[idx];
    }
    return null;
  },

  deleteWorkspace(id) {
    let workspaces = this.getWorkspaces();
    workspaces = workspaces.filter(w => w.id !== id);
    this.saveWorkspaces(workspaces);
    this.syncUp('workspaces', 'delete', { id });
    // Limpar dados locais
    ['transactions', 'projects', 'clients', 'tasks', 'activities', 'books', 'courses', 'goals'].forEach(entity => {
      localStorage.removeItem(`scaley_${id}_${entity}`);
    });
  },

  getActiveWorkspace() {
    const id = localStorage.getItem('scaley_active_workspace') || 'pessoal';
    const workspaces = this.getWorkspaces();
    return workspaces.find(w => w.id === id) || workspaces[0];
  },

  setActiveWorkspace(id) {
    localStorage.setItem('scaley_active_workspace', id);
  },

  // ===== CRUD GENÉRICO =====
  getAll(entity) {
    const data = localStorage.getItem(this._key(entity));
    return data ? JSON.parse(data) : [];
  },

  save(entity, items) {
    localStorage.setItem(this._key(entity), JSON.stringify(items));
  },

  add(entity, item) {
    const items = this.getAll(entity);
    item.id = item.id || generateId();
    item.createdAt = new Date().toISOString();
    items.push(item);
    this.save(entity, items);
    
    // Sync Nuvem
    this.syncUp(entity, 'add', item);

    this.addActivity(entity, 'add', item);
    return item;
  },

  update(entity, id, updates) {
    const items = this.getAll(entity);
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save(entity, items);
      
      // Sync Nuvem
      this.syncUp(entity, 'update', items[idx]);

      this.addActivity(entity, 'update', items[idx]);
      return items[idx];
    }
    return null;
  },

  delete(entity, id) {
    let items = this.getAll(entity);
    const item = items.find(i => i.id === id);
    if (!item) return;

    items = items.filter(i => i.id !== id);
    this.save(entity, items);
    
    // Sync Nuvem
    this.syncUp(entity, 'delete', item);

    this.addActivity(entity, 'delete', item);
  },

  getById(entity, id) {
    return this.getAll(entity).find(i => i.id === id);
  },

  // ===== ATIVIDADES =====
  addActivity(entity, action, item) {
    const activities = this.getAll('activities');
    const activity = {
      id: generateId(),
      entity,
      action,
      itemName: item.description || item.name || item.title || 'Item',
      itemValue: item.value || null,
      itemType: item.type || null,
      createdAt: new Date().toISOString()
    };
    activities.unshift(activity);
    if (activities.length > 50) activities.length = 50;
    this.save('activities', activities);
    
    // Sync nuvem silencioso
    this.syncUp('activities', 'add', activity);
  },

  // ===== MÉTODOS DE CONSULTA =====

  getFixedExpensesPending(month, year) {
    const expenses = this.getAll('fixed_expenses');
    // Se month/year não passados, assume hoje
    const m = month !== undefined && month !== -1 ? month : new Date().getMonth();
    const y = year !== undefined ? year : new Date().getFullYear();

    // Filtra transações despesas fixas daquele mês
    const startObj = new Date(y, m, 1);
    const endObj = new Date(y, m+1, 0);
    const monthTx = this.getAll('transactions').filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return t.type === 'despesa' && t.fixedExpId && d >= startObj && d <= endObj;
    });

    return expenses
      .filter(e => !monthTx.some(t => t.fixedExpId === e.id))
      .reduce((s, e) => s + Number(e.value), 0);
  },

  getFixedIncomesPending(month, year) {
    const incomes = this.getAll('fixed_incomes');
    const m = month !== undefined && month !== -1 ? month : new Date().getMonth();
    const y = year !== undefined ? year : new Date().getFullYear();

    const startObj = new Date(y, m, 1);
    const endObj = new Date(y, m+1, 0);
    const monthTx = this.getAll('transactions').filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return t.type === 'receita' && t.fixedIncomeId && d >= startObj && d <= endObj;
    });

    return incomes
      .filter(i => !monthTx.some(t => t.fixedIncomeId === i.id))
      .reduce((s, i) => s + Number(i.value), 0);
  },

  // Transações filtradas por mês/ano
  getTransactions(month, year, type) {
    let items = this.getAll('transactions');
    if (month !== undefined && month !== -1) {
      items = items.filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        return d.getMonth() === month;
      });
    }
    if (year !== undefined) {
      items = items.filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        return d.getFullYear() === year;
      });
    }
    if (type && type !== 'todos') {
      items = items.filter(t => t.type === type);
    }
    // Ordenar por data decrescente
    items.sort((a, b) => b.date.localeCompare(a.date));
    return items;
  },

  // Resumo financeiro
  getFinanceSummary(month, year) {
    const items = this.getTransactions(month, year);
    const receitas = items.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.value), 0);
    const despesas = items.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.value), 0);
    const aPagar = this.getFixedExpensesPending(month, year);
    const aReceber = this.getFixedIncomesPending(month, year);
    
    const ws = this.getActiveWorkspace();
    let mrrOrSalary = 0;
    if (ws.type === 'enterprise') {
      mrrOrSalary = this.getAll('clients').reduce((acc, c) => acc + (parseFloat(c.mrr) || 0), 0);
    } else {
      mrrOrSalary = this.getAll('fixed_incomes').reduce((acc, i) => acc + (parseFloat(i.value) || 0), 0);
    }

    return { receitas, despesas, saldo: receitas - despesas, aPagar, aReceber, mrrOrSalary, wsType: ws.type };
  },

  // Dados do gráfico (últimos 6 meses)
  getChartData() {
    const now = new Date();
    const labels = [];
    const receitas = [];
    const despesas = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(MONTH_SHORT[d.getMonth()]);
      const summary = this.getFinanceSummary(d.getMonth(), d.getFullYear());
      receitas.push(summary.receitas);
      despesas.push(summary.despesas);
    }
    return { labels, receitas, despesas };
  },

  // Contagem de projetos por status
  getProjectCounts() {
    const projects = this.getAll('projects');
    return {
      todo: projects.filter(p => p.status === 'todo').length,
      doing: projects.filter(p => p.status === 'doing').length,
      done: projects.filter(p => p.status === 'done').length,
      total: projects.length
    };
  },

  // Stats de tarefas
  getTaskStats() {
    const tasks = this.getAll('tasks');
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percent };
  },

  // Configurações do usuário
  getUserName() {
    return localStorage.getItem('scaley_username') || 'Usuário';
  },

  async getDisplayUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user?.email) {
      const name = localStorage.getItem('scaley_username');
      return name || session.user.email.split('@')[0];
    }
    return 'Usuário';
  },

  setUserName(name) {
    localStorage.setItem('scaley_username', name);
  }
};
