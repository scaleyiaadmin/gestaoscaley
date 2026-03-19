/* ===== APP — Inicialização ===== */

document.addEventListener('DOMContentLoaded', async () => {
  
  // Checar Autenticação
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  // Inicializar ícones
  lucide.createIcons();

  // Sincronizar com o Banco de Dados Nuvem (Supabase)
  await Store.initSync();

  // Inicializar módulos
  Sidebar.init();
  Financeiro.init();
  Cobrancas.init();
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

  // Logout btn
  document.getElementById('logout-btn').addEventListener('click', async () => {
    if (confirm('Deseja realmente sair?')) {
      await supabaseClient.auth.signOut();
      localStorage.clear(); // Limpa dados locais para evitar vazamento entre logins
      window.location.href = 'login.html';
    }
  });

  console.log('✨ Gestão Scaley inicializado com sucesso!');
});
