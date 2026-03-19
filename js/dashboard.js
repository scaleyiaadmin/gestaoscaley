/* ===== DASHBOARD ===== */

const Dashboard = {
  chart: null,

  render() {
    this.renderWelcome();
    this.renderMrrAlerts();
    this.renderStats();
    this.renderQuickActions();
    this.renderChart();
    this.renderActivities();
    this.bindQuickActions();
  },

  renderMrrAlerts() {
    const ws = Store.getActiveWorkspace();
    const clients = Store.getAll('clients').filter(c => parseFloat(c.mrr) > 0);
    const fixedExpenses = Store.getAll('fixed_expenses');
    const container = document.getElementById('dashboard-mrr-alerts');
    if (!container) return;
    
    // Alertas de MRR so fazem sentido em Enterprise
    const canShowMrr = ws.type === 'enterprise';

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    const startObj = new Date(currentYear, currentMonth, 1);
    const endObj = new Date(currentYear, currentMonth + 1, 0);
    
    const monthTx = Store.getAll('transactions').filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return (t.category === 'mrr' || t.fixedExpId) && d >= startObj && d <= endObj;
    });

    const alerts = [];

    const isTodayOrYesterday = (day) => {
      if (day === currentDay) return true;
      if (day === currentDay - 1) return true;
      if (currentDay === 1 && day >= 28) return true; 
      return false;
    };

    // MRR (Só se for Enterprise)
    if (canShowMrr) {
      clients.forEach(c => {
        const alertId = `alert-mrr-${c.id}-${currentMonth}-${currentYear}`;
        if (Store.isAlertDismissed(alertId)) return;

        const isPaid = monthTx.some(t => t.mrrClientId === c.id);
        if (!isPaid) {
          const dueDay = parseInt(c.dueDay) || 1;
          if (isTodayOrYesterday(dueDay) && currentDay >= dueDay) {
            alerts.push(`
              <div style="background: rgba(248, 113, 113, 0.1); border-left: 4px solid var(--color-danger); padding: 12px 16px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <i data-lucide="alert-circle" style="color: var(--color-danger); width: 20px; height: 20px;"></i>
                  <div>
                    <strong style="color: var(--text-primary); font-size: 14px;">MRR Pendente: ${c.company || c.name}</strong>
                    <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">Venceu dia ${dueDay} (R$ ${parseFloat(c.mrr).toFixed(2)})</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <button class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px; background: transparent;" onclick="document.querySelector('[data-page=cobrancas]').click()">Cobrar</button>
                  <button class="btn-icon" style="opacity: 0.6; padding: 4px;" onclick="Dashboard.dismissAlert('${alertId}')">
                    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                  </button>
                </div>
              </div>
            `);
          }
        }
      });
    }

    // Despesas Fixas (Sempre mostra)
    fixedExpenses.forEach(e => {
      const alertId = `alert-exp-${e.id}-${currentMonth}-${currentYear}`;
      if (Store.isAlertDismissed(alertId)) return;

      const isPaid = monthTx.some(t => t.fixedExpId === e.id);
      if (!isPaid) {
        const dueDay = parseInt(e.dueDay) || 1;
        if (isTodayOrYesterday(dueDay) && currentDay >= dueDay) {
          alerts.push(`
            <div style="background: rgba(248, 113, 113, 0.1); border-left: 4px solid var(--color-danger); padding: 12px 16px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <i data-lucide="alert-triangle" style="color: var(--color-danger); width: 20px; height: 20px;"></i>
                <div>
                  <strong style="color: var(--text-primary); font-size: 14px;">Despesa Fixa a Pagar: ${e.name}</strong>
                  <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">Venceu dia ${dueDay} (R$ ${parseFloat(e.value).toFixed(2)})</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px; background: transparent;" onclick="document.querySelector('[data-page=cobrancas]').click()">Pagar</button>
                <button class="btn-icon" style="opacity: 0.6; padding: 4px;" onclick="Dashboard.dismissAlert('${alertId}')">
                  <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                </button>
              </div>
            </div>
          `);
        }
      }
    });

    container.innerHTML = alerts.join('');
    lucide.createIcons();
  },

  dismissAlert(alertId) {
    Store.dismissAlert(alertId);
    this.renderMrrAlerts();
  },

  async renderWelcome() {
    const name = await Store.getDisplayUser();
    const ws = Store.getActiveWorkspace();
    document.getElementById('welcome-name').textContent = name;
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    
    const context = ws.type === 'enterprise' ? 'Gestão Corporativa' : 'Gestão Pessoal';
    document.getElementById('welcome-date').textContent =
      `${getGreeting()}! Hoje é ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} • ${context}`;
  },

  renderStats() {
    const ws = Store.getActiveWorkspace();
    const finance = Store.getFinanceSummary(getCurrentMonth(), getCurrentYear());
    const projects = Store.getProjectCounts();
    const clients = Store.getAll('clients').length;
    const tasks = Store.getTaskStats();

    let html = `
      <div class="stat-card">
        <div class="stat-icon green"><i data-lucide="trending-up"></i></div>
        <div class="stat-value text-success">${formatCurrency(finance.receitas)}</div>
        <div class="stat-label">${ws.type === 'enterprise' ? 'Receitas do Mês' : 'Renda do Mês'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><i data-lucide="trending-down"></i></div>
        <div class="stat-value text-danger">${formatCurrency(finance.despesas)}</div>
        <div class="stat-label">Despesas do Mês</div>
      </div>
    `;

    if (ws.type === 'enterprise') {
      html += `
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
    } else {
      const books = Store.getAll('books').length;
      const courses = Store.getAll('courses').length;
      html += `
        <div class="stat-card">
          <div class="stat-icon yellow"><i data-lucide="check-square"></i></div>
          <div class="stat-value">${tasks.pending}</div>
          <div class="stat-label">Tarefas Pendentes</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><i data-lucide="graduation-cap"></i></div>
          <div class="stat-value">${books + courses}</div>
          <div class="stat-label">Livros & Cursos</div>
        </div>
      `;
    }

    document.getElementById('dashboard-stats').innerHTML = html;
    lucide.createIcons();
  },

  renderQuickActions() {
    const ws = Store.getActiveWorkspace();
    const container = document.getElementById('dashboard-quick-actions');
    if (!container) return;

    let html = `
      <button class="quick-action-btn" data-action="add-transaction">
        <i data-lucide="plus-circle"></i>
        <span>Nova Transação</span>
      </button>
    `;

    if (ws.type === 'enterprise') {
      html += `
        <button class="quick-action-btn" data-action="add-project">
          <i data-lucide="folder-plus"></i>
          <span>Novo Projeto</span>
        </button>
        <button class="quick-action-btn" data-action="add-client">
          <i data-lucide="user-plus"></i>
          <span>Novo Cliente</span>
        </button>
      `;
    } else {
      html += `
        <button class="quick-action-btn" data-action="add-book">
          <i data-lucide="book-plus"></i>
          <span>Novo Livro</span>
        </button>
        <button class="quick-action-btn" data-action="add-course">
          <i data-lucide="graduation-cap"></i>
          <span>Novo Curso</span>
        </button>
      `;
    }

    html += `
      <button class="quick-action-btn" data-action="add-task">
        <i data-lucide="list-plus"></i>
        <span>Nova Tarefa</span>
      </button>
    `;

    container.innerHTML = html;
  },

  renderChart() {
    const ws = Store.getActiveWorkspace();
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
            label: ws.type === 'enterprise' ? 'Receitas' : 'Ganhos',
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
    if (!container) return;

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
      tasks: { icon: 'list-checks', color: 'yellow' },
      books: { icon: 'book', color: 'blue' },
      courses: { icon: 'graduation-cap', color: 'purple' }
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
          <div class="activity-icon ${meta.color}">
            <i data-lucide="${meta.icon}"></i>
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
      // Use replaceWith for clean listener re-binding if needed, 
      // though for simple app it might be okay to just clear and re-add if we handle it well.
      btn.onclick = () => {
        const action = btn.dataset.action;
        switch (action) {
          case 'add-transaction': Financeiro.openForm(); break;
          case 'add-project': Projetos.openForm(); break;
          case 'add-client': Clientes.openForm(); break;
          case 'add-task': Estudos.openForm(); break;
          case 'add-book': Estudos.openBookForm(); break;
          case 'add-course': Estudos.openCourseForm(); break;
        }
      };
    });
  }
};
