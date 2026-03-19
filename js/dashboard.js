/* ===== DASHBOARD ===== */

const Dashboard = {
  chart: null,

  render() {
    this.renderWelcome();
    this.renderMrrAlerts();
    this.renderStats();
    this.renderChart();
    this.renderActivities();
    this.bindQuickActions();
  },

  renderMrrAlerts() {
    const clients = Store.getAll('clients').filter(c => parseFloat(c.mrr) > 0);
    const container = document.getElementById('dashboard-mrr-alerts');
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    // Pegamos transacoes pagas _no_ mês corrente
    const startObj = new Date(currentYear, currentMonth, 1);
    const endObj = new Date(currentYear, currentMonth + 1, 0);
    
    const monthTx = Store.getAll('transactions').filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return t.type === 'receita' && t.category === 'mrr' && d >= startObj && d <= endObj;
    });

    const alerts = [];

    clients.forEach(c => {
      const isPaid = monthTx.some(t => t.mrrClientId === c.id);
      if (!isPaid) {
        const dueDay = parseInt(c.dueDay) || 1;
        if (currentDay >= dueDay) {
          // Atrasado / Vence hoje
          alerts.push(`
            <div style="background: rgba(248, 113, 113, 0.1); border-left: 4px solid var(--color-danger); padding: 12px 16px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <i data-lucide="alert-circle" style="color: var(--color-danger); width: 20px; height: 20px;"></i>
                <div>
                  <strong style="color: var(--text-primary); font-size: 14px;">Cobrança Pendente: ${c.company || c.name}</strong>
                  <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">Venceu dia ${dueDay} (R$ ${parseFloat(c.mrr).toFixed(2)})</div>
                </div>
              </div>
              <button class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px; background: transparent;" onclick="document.querySelector('[data-page=financeiro]').click()">Acessar Painel</button>
            </div>
          `);
        } else if (dueDay - currentDay <= 3) {
          // Vence nos próximos 3 dias
          alerts.push(`
            <div style="background: rgba(251, 146, 60, 0.1); border-left: 4px solid var(--color-warning); padding: 12px 16px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <i data-lucide="clock" style="color: var(--color-warning); width: 20px; height: 20px;"></i>
                <div>
                  <strong style="color: var(--text-primary); font-size: 14px;">Vencimento Próximo: ${c.company || c.name}</strong>
                  <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">Vence em ${dueDay - currentDay} dia(s) (R$ ${parseFloat(c.mrr).toFixed(2)})</div>
                </div>
              </div>
            </div>
          `);
        }
      }
    });

    container.innerHTML = alerts.join('');
    // Call createIcons locally inside logic too
  },

  renderWelcome() {
    document.getElementById('welcome-name').textContent = Store.getUserName();
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    document.getElementById('welcome-date').textContent =
      `${getGreeting()}! Hoje é ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`;
  },

  renderStats() {
    const finance = Store.getFinanceSummary(getCurrentMonth(), getCurrentYear());
    const projects = Store.getProjectCounts();
    const clients = Store.getAll('clients').length;
    const tasks = Store.getTaskStats();

    document.getElementById('dashboard-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="trending-up"></i></div>
        <div class="stat-value text-success">${formatCurrency(finance.receitas)}</div>
        <div class="stat-label">Receitas do Mês</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><i data-lucide="trending-down"></i></div>
        <div class="stat-value text-danger">${formatCurrency(finance.despesas)}</div>
        <div class="stat-label">Despesas do Mês</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple"><i data-lucide="folder-kanban"></i></div>
        <div class="stat-value">${projects.doing}</div>
        <div class="stat-label">Projetos em Andamento</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i data-lucide="users"></i></div>
        <div class="stat-value">${clients}</div>
        <div class="stat-label">Clientes</div>
      </div>
    `;
    lucide.createIcons();
  },

  renderChart() {
    const data = Store.getChartData();
    const ctx = document.getElementById('finance-chart');
    if (!ctx) return;

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Receitas',
            data: data.receitas,
            backgroundColor: 'rgba(52, 211, 153, 0.3)',
            borderColor: '#34d399',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Despesas',
            data: data.despesas,
            backgroundColor: 'rgba(248, 113, 113, 0.3)',
            borderColor: '#f87171',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: '#8a8a9a',
              font: { family: 'Inter', size: 11 },
              boxWidth: 12,
              boxHeight: 12,
              borderRadius: 3,
              useBorderRadius: true,
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: '#1a1a28',
            titleColor: '#f0f0f5',
            bodyColor: '#8a8a9a',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            titleFont: { family: 'Inter', weight: '600' },
            bodyFont: { family: 'Inter' },
            callbacks: {
              label: function(ctx) {
                return ctx.dataset.label + ': ' + formatCurrency(ctx.raw);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#55556a', font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#55556a',
              font: { family: 'Inter', size: 11 },
              callback: (v) => formatCurrency(v)
            }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  },

  renderActivities() {
    const activities = Store.getAll('activities').slice(0, 8);
    const container = document.getElementById('activity-list');

    if (activities.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2rem;">
          <i data-lucide="activity"></i>
          <h3>Sem atividades ainda</h3>
          <p>Suas ações aparecerão aqui</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    const iconMap = {
      transactions: { icon: 'wallet', color: 'purple' },
      projects: { icon: 'kanban', color: 'blue' },
      clients: { icon: 'users', color: 'green' },
      tasks: { icon: 'list-checks', color: 'yellow' }
    };

    const actionText = {
      add: 'Adicionou',
      update: 'Atualizou',
      delete: 'Removeu'
    };

    container.innerHTML = activities.map(a => {
      const meta = iconMap[a.entity] || { icon: 'circle', color: 'purple' };
      const valueHtml = a.entity === 'transactions' && a.itemValue
        ? `<span class="activity-amount ${a.itemType === 'receita' ? 'text-success' : 'text-danger'}">${a.itemType === 'receita' ? '+' : '-'}${formatCurrency(a.itemValue)}</span>`
        : '';
      return `
        <div class="activity-item">
          <div class="activity-icon ${meta.color}" style="background: var(--${meta.color === 'purple' ? 'accent-primary' : meta.color === 'blue' ? 'accent-secondary' : meta.color === 'green' ? 'color-success' : 'color-warning'}-soft);">
            <i data-lucide="${meta.icon}" style="color: var(--${meta.color === 'purple' ? 'accent-primary' : meta.color === 'blue' ? 'accent-secondary' : meta.color === 'green' ? 'color-success' : 'color-warning'});"></i>
          </div>
          <div class="activity-info">
            <div class="activity-text">${actionText[a.action] || ''} <strong>${a.itemName}</strong></div>
            <div class="activity-time">${formatRelativeDate(a.createdAt)}</div>
          </div>
          ${valueHtml}
        </div>
      `;
    }).join('');
    lucide.createIcons();
  },

  bindQuickActions() {
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        switch (action) {
          case 'add-transaction':
            Financeiro.openForm();
            break;
          case 'add-project':
            Projetos.openForm();
            break;
          case 'add-client':
            Clientes.openForm();
            break;
          case 'add-task':
            Estudos.openForm();
            break;
        }
      });
    });
  }
};
