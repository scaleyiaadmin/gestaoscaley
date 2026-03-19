/* ===== FINANCEIRO ===== */

const Financeiro = {
  currentMonth: getCurrentMonth(),
  currentYear: getCurrentYear(),

  init() {
    this.buildFilters();
    this.bindEvents();
  },

  buildFilters() {
    const monthSelect = document.getElementById('filter-month');
    const yearSelect = document.getElementById('filter-year');

    monthSelect.innerHTML = '<option value="-1">Todos</option>' +
      MONTHS.map((m, i) => `<option value="${i}" ${i === this.currentMonth ? 'selected' : ''}>${m}</option>`).join('');

    const currentYear = getCurrentYear();
    yearSelect.innerHTML = '';
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
      yearSelect.innerHTML += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
    }
  },

  bindEvents() {
    document.getElementById('filter-month').addEventListener('change', () => this.render());
    document.getElementById('filter-year').addEventListener('change', () => this.render());
    document.getElementById('filter-type').addEventListener('change', () => this.render());
    document.getElementById('add-transaction-btn').addEventListener('click', () => this.openForm());
    document.getElementById('save-transaction-btn').addEventListener('click', () => this.saveForm());

    // Eventos Despesas Fixas
    document.getElementById('manage-expenses-btn').addEventListener('click', () => this.openFixedExpensesModal());
    document.getElementById('manage-incomes-btn').addEventListener('click', () => this.openFixedIncomesModal());
    document.getElementById('btn-new-fixed-exp').addEventListener('click', () => this.openFixedExpForm());
    document.getElementById('btn-new-fixed-inc').addEventListener('click', () => this.openFixedIncForm());
    document.getElementById('save-fixed-exp-btn').addEventListener('click', () => this.saveFixedExp());
    document.getElementById('save-fixed-income-btn').addEventListener('click', () => this.saveFixedIncome());
  },

  render() {
    const month = parseInt(document.getElementById('filter-month').value);
    const year = parseInt(document.getElementById('filter-year').value);
    const type = document.getElementById('filter-type').value;

    this.renderSummary(month, year);
    this.renderTable(month, year, type);
  },


  renderSummary(month, year) {
    const summary = Store.getFinanceSummary(month, year);
    const isPersonal = summary.wsType === 'personal';
    
    document.getElementById('finance-summary').innerHTML = `
      <div class="summary-card">
        <div class="summary-label">${isPersonal ? 'Renda Fixa' : 'MRR Estimado'}</div>
        <div class="summary-value" style="color: var(--accent-primary);">${formatCurrency(summary.mrrOrSalary)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Receitas</div>
        <div class="summary-value text-success">${formatCurrency(summary.receitas)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Despesas</div>
        <div class="summary-value text-danger">${formatCurrency(summary.despesas)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">A Pagar (Fixas)</div>
        <div class="summary-value" style="color: var(--color-warning);">${formatCurrency(summary.aPagar)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Saldo Atual</div>
        <div class="summary-value" style="color: ${summary.saldo >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};">${formatCurrency(summary.saldo)}</div>
      </div>
    `;
  },

  renderTable(month, year, type) {
    const transactions = Store.getTransactions(month, year, type);
    const tbody = document.getElementById('transactions-body');
    const empty = document.getElementById('transactions-empty');
    const table = document.getElementById('transactions-table');

    if (transactions.length === 0) {
      table.classList.add('hidden');
      empty.classList.remove('hidden');
      lucide.createIcons();
      return;
    }

    table.classList.remove('hidden');
    empty.classList.add('hidden');

    tbody.innerHTML = transactions.map(t => `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.description}</td>
        <td><span class="category-tag">${CATEGORY_NAMES[t.category] || t.category}</span></td>
        <td><span class="type-indicator ${t.type}">${t.type === 'receita' ? 'Receita' : 'Despesa'}</span></td>
        <td style="font-weight: 600; color: ${t.type === 'receita' ? 'var(--color-success)' : 'var(--color-danger)'};">
          ${t.type === 'receita' ? '+' : '-'}${formatCurrency(t.value)}
        </td>
        <td>
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <button class="btn-ghost btn-icon btn-sm" onclick="Financeiro.edit('${t.id}')" title="Editar">
              <i data-lucide="pencil" style="width:14px;height:14px;"></i>
            </button>
            <button class="btn-ghost btn-icon btn-sm" onclick="Financeiro.confirmDelete('${t.id}')" title="Excluir">
              <i data-lucide="trash-2" style="width:14px;height:14px;color:var(--color-danger);"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    lucide.createIcons();
  },

  openForm(data = null) {
    document.getElementById('modal-transaction-title').textContent = data ? 'Editar Transação' : 'Nova Transação';
    document.getElementById('tr-description').value = data ? data.description : '';
    document.getElementById('tr-value').value = data ? data.value : '';
    document.getElementById('tr-type').value = data ? data.type : 'receita';
    document.getElementById('tr-date').value = data ? data.date : todayStr();
    document.getElementById('tr-category').value = data ? data.category : 'outros';
    document.getElementById('tr-id').value = data ? data.id : '';
    openModal('modal-transaction');
  },

  saveForm() {
    const id = document.getElementById('tr-id').value;
    const data = {
      description: document.getElementById('tr-description').value.trim(),
      value: parseFloat(document.getElementById('tr-value').value),
      type: document.getElementById('tr-type').value,
      date: document.getElementById('tr-date').value,
      category: document.getElementById('tr-category').value
    };
    if (!data.description || !data.value || !data.date) return;

    if (id) {
      Store.update('transactions', id, data);
    } else {
      Store.add('transactions', data);
    }
    closeModal('modal-transaction');
    this.render();
  },

  edit(id) {
    const item = Store.getById('transactions', id);
    if (item) this.openForm(item);
  },

  confirmDelete(id) {
    document.getElementById('confirm-message').textContent = 'Tem certeza que deseja excluir esta transação?';
    const btn = document.getElementById('confirm-action-btn');
    btn.onclick = () => {
      Store.delete('transactions', id);
      closeModal('modal-confirm');
      this.render();
    };
    openModal('modal-confirm');
  },

  // ======== DESPESAS FIXAS ========

  openFixedExpensesModal() {
    this.renderFixedExpensesList();
    openModal('modal-fixed-expenses');
  },

  renderFixedExpensesList() {
    const list = Store.getAll('fixed_expenses');
    const container = document.getElementById('fixed-expenses-list-manage');

    if (list.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;padding:12px;text-align:center;">Nenhuma despesa fixa cadastrada.</p>';
      return;
    }

    container.innerHTML = list.map(item => `
      <div style="border: 1px solid var(--border-color); background: var(--bg-hover); padding: 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: var(--text-primary); font-size: 14px;">${item.name}</strong>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top:2px;">
            R$ ${parseFloat(item.value).toFixed(2)} • Todo dia ${item.dueDay}
          </div>
        </div>
        <div style="display:flex; gap: 4px;">
          <button class="btn-ghost btn-icon btn-sm" onclick="Financeiro.editFixedExp('${item.id}')" title="Editar">
            <i data-lucide="pencil" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn-ghost btn-icon btn-sm" onclick="Financeiro.confirmDeleteFixedExp('${item.id}')" title="Excluir">
            <i data-lucide="trash-2" style="width:14px;height:14px;color:var(--color-danger);"></i>
          </button>
        </div>
      </div>
    `).join('');
    lucide.createIcons();
  },

  openFixedExpForm(data = null) {
    document.getElementById('modal-fixed-exp-title').textContent = data ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa';
    document.getElementById('fe-name').value = data ? data.name : '';
    document.getElementById('fe-value').value = data ? data.value : '';
    document.getElementById('fe-due-day').value = data ? data.dueDay : '';
    document.getElementById('fe-category').value = data ? data.category : 'fixos';
    document.getElementById('fe-id').value = data ? data.id : '';
    openModal('modal-fixed-exp-form');
  },

  saveFixedExp() {
    const id = document.getElementById('fe-id').value;
    const data = {
      name: document.getElementById('fe-name').value.trim(),
      value: document.getElementById('fe-value').value.trim(),
      dueDay: document.getElementById('fe-due-day').value.trim(),
      category: document.getElementById('fe-category').value
    };
    
    if (!data.name || !data.value || !data.dueDay) return;

    if (id) {
      Store.update('fixed_expenses', id, data);
    } else {
      Store.add('fixed_expenses', data);
    }
    
    closeModal('modal-fixed-exp-form');
    this.renderFixedExpensesList();
    if(typeof Cobrancas !== 'undefined') Cobrancas.render();
  },

  editFixedExp(id) {
    const item = Store.getById('fixed_expenses', id);
    if (item) this.openFixedExpForm(item);
  },

  confirmDeleteFixedExp(id) {
    document.getElementById('confirm-message').textContent = 'Excluir esta Despesa Fixa? O histórico de pagamentos dela NÃO será apagado.';
    const btn = document.getElementById('confirm-action-btn');
    btn.onclick = () => {
      Store.delete('fixed_expenses', id);
      closeModal('modal-confirm');
      this.renderFixedExpensesList();
      if(typeof Cobrancas !== 'undefined') Cobrancas.render();
    };
    openModal('modal-confirm');
  },

  // ======== RECEITAS FIXAS ========

  openFixedIncomesModal() {
    this.renderFixedIncomesList();
    openModal('modal-fixed-incomes');
  },

  renderFixedIncomesList() {
    const list = Store.getAll('fixed_incomes');
    const container = document.getElementById('fixed-incomes-list-manage');

    if (list.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;padding:12px;text-align:center;">Nenhuma receita fixa cadastrada.</p>';
      return;
    }

    container.innerHTML = list.map(item => `
      <div style="border: 1px solid var(--border-color); background: var(--bg-hover); padding: 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: var(--text-primary); font-size: 14px;">${item.name}</strong>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top:2px;">
            R$ ${parseFloat(item.value).toFixed(2)} • Todo dia ${item.dueDay}
          </div>
        </div>
        <div style="display:flex; gap: 4px;">
          <button class="btn-ghost btn-icon btn-sm" onclick="Financeiro.editFixedInc('${item.id}')" title="Editar">
            <i data-lucide="pencil" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn-ghost btn-icon btn-sm" onclick="Financeiro.confirmDeleteFixedInc('${item.id}')" title="Excluir">
            <i data-lucide="trash-2" style="width:14px;height:14px;color:var(--color-danger);"></i>
          </button>
        </div>
      </div>
    `).join('');
    lucide.createIcons();
  },

  openFixedIncForm(data = null) {
    document.getElementById('modal-fixed-income-title').textContent = data ? 'Editar Receita Fixa' : 'Nova Receita Fixa';
    document.getElementById('fi-name').value = data ? data.name : '';
    document.getElementById('fi-value').value = data ? data.value : '';
    document.getElementById('fi-due-day').value = data ? data.dueDay : '';
    document.getElementById('fi-category').value = data ? data.category : 'salario';
    document.getElementById('fi-id').value = data ? data.id : '';
    openModal('modal-fixed-income-form');
  },

  saveFixedIncome() {
    const id = document.getElementById('fi-id').value;
    const data = {
      name: document.getElementById('fi-name').value.trim(),
      value: document.getElementById('fi-value').value.trim(),
      dueDay: document.getElementById('fi-due-day').value.trim(),
      category: document.getElementById('fi-category').value
    };
    
    if (!data.name || !data.value || !data.dueDay) return;

    if (id) {
      Store.update('fixed_incomes', id, data);
    } else {
      Store.add('fixed_incomes', data);
    }
    
    closeModal('modal-fixed-income-form');
    this.renderFixedIncomesList();
    if(typeof Cobrancas !== 'undefined') Cobrancas.render();
  },

  editFixedInc(id) {
    const item = Store.getById('fixed_incomes', id);
    if (item) this.openFixedIncForm(item);
  },

  confirmDeleteFixedInc(id) {
    document.getElementById('confirm-message').textContent = 'Excluir esta Receita Fixa? O histórico de recebimentos dela NÃO será apagado.';
    const btn = document.getElementById('confirm-action-btn');
    btn.onclick = () => {
      Store.delete('fixed_incomes', id);
      closeModal('modal-confirm');
      this.renderFixedIncomesList();
      if(typeof Cobrancas !== 'undefined') Cobrancas.render();
    };
    openModal('modal-confirm');
  }
};
