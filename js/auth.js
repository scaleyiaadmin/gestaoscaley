/**
 * LÓGICA DE AUTENTICAÇÃO
 * -------------------
 * Conecta-se com o Supabase Auth.
 */

const supabaseUrl = 'https://aabnysljsvtifgjjozuf.supabase.co';
const supabaseKey = 'sb_publishable_1EifRl4fEjp_vrDHDUDTuQ_WuavygM7';
const supabaseAuthClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let isLoginMode = true; // true = SignIn | false = SignUp

document.addEventListener('DOMContentLoaded', async () => {
  // Se já estiver logado, joga pro index.html
  const { data: { session } } = await supabaseAuthClient.auth.getSession();
  if (session) {
    window.location.href = 'index.html';
  }

  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const toggleText = document.getElementById('toggle-text');
  const authBtn = document.getElementById('auth-btn');
  const toggleBtn = document.getElementById('toggle-auth-mode');
  
  // Alternar entre Login e Cadastro
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    errorBox.style.display = 'none';
    successBox.style.display = 'none';
    
    if (isLoginMode) {
      title.textContent = 'Gestão Scaley';
      subtitle.textContent = 'Entre com suas credenciais para continuar';
      authBtn.innerHTML = '<span>Acessar Dashboard</span> <i data-lucide="arrow-right"></i>';
      toggleText.textContent = 'Não tem uma conta corporativa?';
      toggleBtn.textContent = 'Solicitar Acesso';
    } else {
      title.textContent = 'Criar Conta';
      subtitle.textContent = 'Preencha os dados para começar sua gestão';
      authBtn.innerHTML = '<span>Criar minha Conta</span> <i data-lucide="user-plus"></i>';
      toggleText.textContent = 'Já possui uma conta?';
      toggleBtn.textContent = 'Fazer Login';
    }
    lucide.createIcons();
  });

  // Listener principal do form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    successBox.style.display = 'none';

    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    
    if (!email || !password) return;

    const originalBtnContent = authBtn.innerHTML;
    authBtn.innerHTML = '<span>Aguarde um momento...</span>';
    authBtn.disabled = true;

    if (isLoginMode) {
      // ===== LOGIN =====
      const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        errorBox.textContent = 'Falha na autenticação: ' + error.message;
        errorBox.style.display = 'block';
        authBtn.innerHTML = originalBtnContent;
        authBtn.disabled = false;
      } else {
        window.location.href = 'index.html';
      }
    } else {
      // ===== CADASTRO =====
      const { data, error } = await supabaseAuthClient.auth.signUp({
        email: email,
        password: password
      });

      if (error) {
        errorBox.textContent = 'Falha ao criar conta: ' + error.message;
        errorBox.style.display = 'block';
        authBtn.innerHTML = originalBtnContent;
        authBtn.disabled = false;
      } else {
        successBox.textContent = 'Conta criada com sucesso! Redirecionando para o seu Dashboard...';
        successBox.style.display = 'block';
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    }
  });
});
