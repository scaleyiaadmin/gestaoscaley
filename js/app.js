/* ===== APP — Inicialização ===== */

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar ícones
  lucide.createIcons();

  // Sincronizar com o Banco de Dados Nuvem (Supabase)
  await Store.initSync();

  // Inicializar módulos
  Sidebar.init();
  Financeiro.init();
  Projetos.init();
  Clientes.init();
  Estudos.init();

  // Renderizar dashboard
  Dashboard.render();

  // Settings btn — prompt para nome do usuário
  document.getElementById('settings-btn').addEventListener('click', () => {
    const name = prompt('Qual é o seu nome?', Store.getUserName());
    if (name && name.trim()) {
      Store.setUserName(name.trim());
      Dashboard.renderWelcome();
    }
  });

  console.log('✨ Gestão Scaley inicializado com sucesso!');
});
