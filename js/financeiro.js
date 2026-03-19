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
    this.renderMrr(month, year);
    this.renderTable(month, year, type);
  },

  renderMrr(month, year) {
    const clients = Store.getAll('clients').filter(c => parseFloat(c.mrr) > 0);
    const mrrList = document.getElementById('mrr-list');
    
    const monthLabel = month === -1 ? 'Todos' : MONTHS[month];
    document.getElementById('mrr-month-name').textContent = month === -1 ? 'Anual' : `${monthLabel}/${year}`;

    if (month === -1) {
      mrrList.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;padding:12px;">Selecione um mês específico para ver detalhamento e pagar MRR.</p>';
      document.getElementById('mrr-stat-total').textContent = '-';
      document.getElementById('mrr-stat-pending').textContent = '-';
      return;
    }

    // Transações mrr desse mes
    const startObj = new Date(year, month, 1);
    const endObj = new Date(year, month + 1, 0);
    const monthTx = Store.getAll('transactions').filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return t.type === 'receita' && t.category === 'mrr' && d >= startObj && d <= endObj;
    });

    let totalVal = 0;
    let pendingCount = 0;
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const currentDay = today.getDate();

    const cards = clients.map(c => {
      const mrrValue = parseFloat(c.mrr);
      totalVal += mrrValue;
      
      const dueDay = parseInt(c.dueDay) || 1;
      const isPaid = monthTx.some(t => t.mrrClientId === c.id);
      
      let status = 'pago';
      let statusClass = 'success';
      let statusText = 'Pago';

      if (!isPaid) {
        pendingCount++;
        if (!isCurrentMonth && today > startObj) {
          status = 'pendente';
          statusClass = 'danger';
          statusText = 'Atrasado';
        } else if (!isCurrentMonth && today < startObj) {
          statusClass = 'warning';
          statusText = 'A Vencer (Futuro)';
        } else {
           if (currentDay >= dueDay) {
             status = 'pendente';
             statusClass = 'danger';
             statusText = 'Cobrar Hoje';
           } else {
             statusClass = 'warning';
             statusText = 'A Vencer';
           }
        }
      }

      return `
        <div style="border: 1px solid var(--border-color); background: var(--bg-card); padding: 12px; border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 8px;">
          <div style="display:flex; justify-content: space-between; align-items:flex-start;">
            <strong style="color: var(--text-primary); font-size: 14px;">${c.company ? c.company : c.name}</strong>
            <span class="badge badge-${statusClass}" style="font-size: 10px;">${statusText}</span>
          </div>
          <div style="font-size: 13px; color: var(--text-secondary);">
            MRR: R$ ${mrrValue.toFixed(2)} <br>
            <i data-lucide="calendar" style="width:12px;height:12px;"></i> Vence dia ${dueDay}
          </div>
          ${!isPaid ? `
            <button class="btn btn-primary" style="padding: 6px 10px; font-size: 12px; margin-top: 4px; width: 100%; justify-content:center;" onclick="Financeiro.payMrr('${c.id}', ${month}, ${year})">
              Marcar como Pago
            </button>
          ` : ''}
        </div>
      `;
    });

    if (cards.length === 0) {
      mrrList.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;padding:12px;">Nenhum cliente com MRR cadastrado.</p>';
    } else {
      mrrList.innerHTML = cards.join('');
    }

    document.getElementById('mrr-stat-total').textContent = `Total Lançado: R$ ${totalVal.toFixed(2)}`;
    document.getElementById('mrr-stat-pending').textContent = `Pendentes: ${pendingCount}`;
    lucide.createIcons();
  },

  payMrr(clientId, month, year) {
    const c = Store.getById('clients', clientId);
    if (!c) return;
    const dueDay = parseInt(c.dueDay) || 1;
    // Tenta usar o dia de vencimento para gerar registro no passado/futuro se for o caso
    let dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(Math.min(dueDay, 28)).padStart(2, '0')}`;
    // Se for no mes corrente, coloca a data real de recebimento que eh hoje
    if (new Date().getMonth() === month && new Date().getFullYear() === year) {
      dateStr = todayStr();
    }
    
    const data = {
      description: `MRR - ${c.company ? c.company : c.name}`,
      value: parseFloat(c.mrr),
      type: 'receita',
      date: dateStr,
      category: 'mrr',
      mrrClientId: clientId
    };
    
    Store.add('transactions', data);
    this.render();
  },

  renderSummary(month, year) {
    const summary = Store.getFinanceSummary(month, year);
    document.getElementById('finance-summary').innerHTML = `
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
