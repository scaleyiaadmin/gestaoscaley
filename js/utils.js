/* ===== UTILITÁRIOS ===== */

// Gerar ID único
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Formatar moeda BRL
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Formatar data para exibição
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Formatar data relativa
function formatRelativeDate(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Agora mesmo';
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return formatDate(dateStr.split('T')[0]);
}

// Data de hoje no formato YYYY-MM-DD
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Mês/Ano atuais
function getCurrentMonth() {
  return new Date().getMonth();
}

function getCurrentYear() {
  return new Date().getFullYear();
}

// Nomes dos meses
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// Saudação baseada na hora
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Obter iniciais de um nome
function getInitials(name) {
  return name.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Nomes de categorias
const CATEGORY_NAMES = {
  salario: 'Salário',
  freelance: 'Freelance',
  investimento: 'Investimento',
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  moradia: 'Moradia',
  educacao: 'Educação',
  lazer: 'Lazer',
  saude: 'Saúde',
  outros: 'Outros'
};

// Cores dos workspaces padrão
const WS_COLORS = ['#7c5cfc', '#4cc9f0', '#34d399', '#fbbf24', '#f87171', '#fb923c'];

// Modal Helpers
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
    e.target.classList.remove('active');
  }
});

// Close modal on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
});
