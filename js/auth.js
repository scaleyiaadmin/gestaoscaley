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
  const registerFields = document.getElementById('register-fields');
  const nameInput = document.getElementById('auth-name');
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-pass');
  const errorBox = document.getElementById('auth-error');
  const successBox = document.getElementById('auth-success');
  const form = document.getElementById('auth-form');

  // Alternar entre Login e Cadastro
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    errorBox.style.display = 'none';
    successBox.style.display = 'none';
    
    if (isLoginMode) {
      title.textContent = 'Olá novamente!';
      subtitle.textContent = 'Introduza seus dados para acessar o painel administrativo.';
      authBtn.innerHTML = '<span>Entrar na Plataforma</span> <i data-lucide="arrow-right"></i>';
      toggleText.textContent = 'Ainda não tem uma conta?';
      toggleBtn.textContent = 'Criar conta agora';
      registerFields.classList.add('hidden');
    } else {
      title.textContent = 'Crie sua conta';
      subtitle.textContent = 'Junte-se ao Scaley e comece sua jornada de gestão.';
      authBtn.innerHTML = '<span>Começar Gratuitamente</span> <i data-lucide="user-plus"></i>';
      toggleText.textContent = 'Já faz parte do time?';
      toggleBtn.textContent = 'Fazer Login';
      registerFields.classList.remove('hidden');
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
    const fullName = nameInput.value.trim();
    
    if (!email || !password) return;

    const originalBtnContent = authBtn.innerHTML;
    authBtn.innerHTML = '<span>Processando...</span>';
    authBtn.disabled = true;

    if (isLoginMode) {
      // ===== LOGIN =====
      const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        errorBox.textContent = 'Credenciais inválidas: ' + error.message;
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
        password: password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        errorBox.textContent = 'Falha ao processar cadastro: ' + error.message;
        errorBox.style.display = 'block';
        authBtn.innerHTML = originalBtnContent;
        authBtn.disabled = false;
      } else {
        // Se cadastrou nome, salva no localStorage para saudação imediata
        if (fullName) localStorage.setItem('scaley_username', fullName);
        
        successBox.textContent = 'Bem-vindo ao Scaley! Sua conta foi ativada com sucesso.';
        successBox.style.display = 'block';
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    }
  });
});
