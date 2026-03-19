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
    const totalMrr = Store.getAll('clients').reduce((acc, c) => acc + (parseFloat(c.mrr) || 0), 0);
    
    document.getElementById('finance-summary').innerHTML = `
      <div class="summary-card">
        <div class="summary-label">MRR Estimado</div>
        <div class="summary-value" style="color: var(--accent-primary);">${formatCurrency(totalMrr)}</div>
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
        <div class="summary-label">Saldo</div>
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
  }
};
