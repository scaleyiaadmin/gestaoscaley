/* ===== COBRANÇAS ===== */

const Cobrancas = {
  init() {
    this.render();
  },

  render() {
    const clients = Store.getAll('clients').filter(c => parseFloat(c.mrr) > 0);
    const mrrList = document.getElementById('mrr-list');
    
    // Pegamos transacoes pagas _no_ mês corrente
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    
    document.getElementById('mrr-month-name').textContent = `${MONTHS[currentMonth]}/${currentYear}`;

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
          <h3>Tudo em dia!</h3>
          <p>Nenhuma cobrança mensal pendente para este mês.</p>
        </div>
      `;
    } else {
      mrrList.innerHTML = cards.join('');
    }

    lucide.createIcons();
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
    
    // Adiciona ao banco principal
    Store.add('transactions', data);
    
    // Remove o card da tela
    this.render();
    Financeiro.render();
    Dashboard.render();
  }
};
