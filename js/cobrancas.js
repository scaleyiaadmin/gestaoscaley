/* ===== CONTAS E PENDÊNCIAS ===== */

const Cobrancas = {
  init() {
    this.render();
  },

  render() {
    const ws = Store.getActiveWorkspace();
    const label = document.getElementById('mrr-title-label');
    
    if (ws.type === 'enterprise') {
      if (label) label.textContent = 'A Receber do Mês (MRR)';
      this.renderMrr();
    } else {
      if (label) label.textContent = 'Ganhos do Mês (Renda Fixa)';
      this.renderFixedIncomes();
    }
    
    this.renderFixedExpenses();
    lucide.createIcons();
  },

  renderMrr() {
    const clients = Store.getAll('clients').filter(c => parseFloat(c.mrr) > 0);
    const mrrList = document.getElementById('mrr-list');
    if (!mrrList) return;
    
    // Pegamos transacoes pagas _no_ mês corrente
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    
    const monthNameElem = document.getElementById('mrr-month-name');
    if (monthNameElem) monthNameElem.textContent = `${MONTHS[currentMonth]}/${currentYear}`;

    const startObj = new Date(currentYear, currentMonth, 1);
    const endObj = new Date(currentYear, currentMonth + 1, 0);
    const monthTx = Store.getAll('transactions').filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return t.type === 'receita' && t.category === 'mrr' && d >= startObj && d <= endObj;
    });

    const cards = [];

    clients.forEach(c => {
      const isPaid = monthTx.some(t => t.mrrClientId === c.id);
      
      if (!isPaid) {
        const mrrValue = parseFloat(c.mrr);
        const dueDay = parseInt(c.dueDay) || 1;
        
        let statusClass = 'warning';
        let statusText = 'A Vencer';

        if (currentDay >= dueDay) {
          statusClass = 'danger';
          statusText = 'Cobrar Hoje';
        }

        cards.push(`
          <div style="border: 1px solid var(--border-color); background: var(--bg-card); padding: 16px; border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 12px;">
            <div style="display:flex; justify-content: space-between; align-items:flex-start;">
              <strong style="color: var(--text-primary); font-size: 16px;">${c.company || c.name}</strong>
              <span class="badge badge-${statusClass}" style="font-size: 11px;">${statusText}</span>
            </div>
            <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
              Valor: <strong style="color:var(--text-primary)">R$ ${mrrValue.toFixed(2)}</strong> <br>
              <div style="display:flex; gap:6px; align-items:center; margin-top:4px;">
                <i data-lucide="calendar" style="width:14px;height:14px;"></i> Vencimento dia ${dueDay}
              </div>
            </div>
            <button class="btn btn-primary" style="margin-top: auto; padding: 10px; font-weight: 500; justify-content: center;" onclick="Cobrancas.payMrr('${c.id}', ${currentMonth}, ${currentYear})">
              Confirmar Recebimento
            </button>
          </div>
        `);
      }
    });

    if (cards.length === 0) {
      mrrList.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem;">
          <i data-lucide="check-circle-2" style="color: var(--color-success); width: 48px; height: 48px; margin-bottom: 1rem;"></i>
          <h3>Tudo recebido!</h3>
          <p>Nenhum MRR mensal pendente para este mês.</p>
        </div>
      `;
    } else {
      mrrList.innerHTML = cards.join('');
    }
  },

  renderFixedIncomes() {
    const incomes = Store.getAll('fixed_incomes');
    const list = document.getElementById('mrr-list'); 
    if (!list) return;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    
    const monthNameElem = document.getElementById('mrr-month-name');
    if (monthNameElem) monthNameElem.textContent = `${MONTHS[currentMonth]}/${currentYear}`;

    const startObj = new Date(currentYear, currentMonth, 1);
    const endObj = new Date(currentYear, currentMonth + 1, 0);
    const monthTx = Store.getAll('transactions').filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return t.type === 'receita' && t.fixedIncomeId && d >= startObj && d <= endObj;
    });

    const cards = [];

    incomes.forEach(i => {
      const isPaid = monthTx.some(t => t.fixedIncomeId === i.id);
      
      if (!isPaid) {
        const val = parseFloat(i.value);
        const dueDay = parseInt(i.dueDay) || 1;
        
        let statusClass = 'warning';
        let statusText = 'A Receber';

        if (currentDay >= dueDay) {
          statusClass = 'success';
          statusText = 'Receber Hoje';
        }

        cards.push(`
          <div style="border: 1px solid var(--border-color); background: var(--bg-card); padding: 16px; border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 12px;">
            <div style="display:flex; justify-content: space-between; align-items:flex-start;">
              <strong style="color: var(--text-primary); font-size: 16px;">${i.name}</strong>
              <span class="badge badge-${statusClass}" style="font-size: 11px;">${statusText}</span>
            </div>
            <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
              Valor: <strong style="color:var(--color-success)">R$ ${val.toFixed(2)}</strong> <br>
              <div style="display:flex; gap:6px; align-items:center; margin-top:4px;">
                <i data-lucide="calendar" style="width:14px;height:14px;"></i> Recebimento dia ${dueDay}
              </div>
            </div>
            <button class="btn btn-primary" style="margin-top: auto; padding: 10px; font-weight: 500; justify-content: center;" onclick="Cobrancas.payFixedIncome('${i.id}', ${currentMonth}, ${currentYear})">
              Confirmar Recebimento
            </button>
          </div>
        `);
      }
    });

    if (cards.length === 0) {
      list.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem;">
          <i data-lucide="check-circle-2" style="color: var(--color-success); width: 48px; height: 48px; margin-bottom: 1rem;"></i>
          <h3>Tudo recebido!</h3>
          <p>Nenhuma renda fixa pendente para este mês.</p>
        </div>
      `;
    } else {
      list.innerHTML = cards.join('');
    }
  },

  renderFixedExpenses() {
    const expenses = Store.getAll('fixed_expenses');
    const container = document.getElementById('fixed-exp-list');
    if (!container) return; 
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    
    const monthNameElem = document.getElementById('fixed-exp-month-name');
    if (monthNameElem) monthNameElem.textContent = `${MONTHS[currentMonth]}/${currentYear}`;

    const startObj = new Date(currentYear, currentMonth, 1);
    const endObj = new Date(currentYear, currentMonth + 1, 0);
    const monthTx = Store.getAll('transactions').filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return t.type === 'despesa' && t.fixedExpId && d >= startObj && d <= endObj;
    });

    const cards = [];

    expenses.forEach(e => {
      const isPaid = monthTx.some(t => t.fixedExpId === e.id);
      
      if (!isPaid) {
        const val = parseFloat(e.value);
        const dueDay = parseInt(e.dueDay) || 1;
        
        let statusClass = 'warning';
        let statusText = 'A Pagar';

        if (currentDay >= dueDay) {
          statusClass = 'danger';
          statusText = 'Pagar Hoje';
        }

        cards.push(`
          <div style="border: 1px solid var(--border-color); background: var(--bg-card); padding: 16px; border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 12px;">
            <div style="display:flex; justify-content: space-between; align-items:flex-start;">
              <strong style="color: var(--text-primary); font-size: 16px;">${e.name}</strong>
              <span class="badge badge-${statusClass}" style="font-size: 11px;">${statusText}</span>
            </div>
            <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
              Valor: <strong style="color:var(--color-danger)">R$ ${val.toFixed(2)}</strong> <br>
              <div style="display:flex; gap:6px; align-items:center; margin-top:4px;">
                <i data-lucide="calendar" style="width:14px;height:14px;"></i> Vencimento dia ${dueDay}
              </div>
            </div>
            <button class="btn btn-secondary" style="margin-top: auto; border: 1px solid var(--color-danger); color: var(--color-danger); padding: 10px; font-weight: 500; justify-content: center; background:transparent;" onclick="Cobrancas.payFixedExp('${e.id}', ${currentMonth}, ${currentYear})">
              Marcar como Pago
            </button>
          </div>
        `);
      }
    });

    if (cards.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 3rem;">
          <i data-lucide="check-circle-2" style="color: var(--color-success); width: 48px; height: 48px; margin-bottom: 1rem;"></i>
          <h3>Tudo pago!</h3>
          <p>Nenhuma despesa fixa pendente para este mês.</p>
        </div>
      `;
    } else {
      container.innerHTML = cards.join('');
    }
  },

  payMrr(clientId, month, year) {
    const c = Store.getById('clients', clientId);
    if (!c) return;
    
    const data = {
      description: `MRR - ${c.company || c.name}`,
      value: parseFloat(c.mrr),
      type: 'receita',
      date: todayStr(),
      category: 'mrr',
      mrrClientId: clientId
    };
    
    Store.add('transactions', data);
    this.render();
    Financeiro.render();
    Dashboard.render();
  },

  payFixedIncome(incomeId, month, year) {
    const i = Store.getById('fixed_incomes', incomeId);
    if (!i) return;
    
    const data = {
      description: `Receita Fixa - ${i.name}`,
      value: parseFloat(i.value),
      type: 'receita',
      date: todayStr(),
      category: i.category || 'salario',
      fixedIncomeId: incomeId
    };
    
    Store.add('transactions', data);
    this.render();
    Financeiro.render();
    Dashboard.render();
  },

  payFixedExp(expId, month, year) {
    const e = Store.getById('fixed_expenses', expId);
    if (!e) return;
    
    const data = {
      description: `Despesa Fixa - ${e.name}`,
      value: parseFloat(e.value),
      type: 'despesa',
      date: todayStr(),
      category: e.category || 'fixos',
      fixedExpId: expId
    };
    
    Store.add('transactions', data);
    this.render();
  }
};
