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

  const form = document.getElementById('auth-form');
  const toggleBtn = document.getElementById('toggle-auth-mode');
  const authBtn = document.getElementById('auth-btn');
  const errorBox = document.getElementById('auth-error');
  const successBox = document.getElementById('auth-success');
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-pass');

  // Alternar entre Login e Cadastro
  toggleBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    errorBox.style.display = 'none';
    successBox.style.display = 'none';
    
    if (isLoginMode) {
      authBtn.textContent = 'Entrar no Sistema';
      document.getElementById('auth-toggle-box').innerHTML = 'Não tem uma conta? <a href="#" id="toggle-auth-mode">Criar agora</a>';
    } else {
      authBtn.textContent = 'Criar minha Conta';
      document.getElementById('auth-toggle-box').innerHTML = 'Já possui uma conta? <a href="#" id="toggle-auth-mode">Fazer login</a>';
    }

    // Reatar o evento do novo <a> gerado pelo innerHTML
    document.getElementById('toggle-auth-mode').addEventListener('click', (e) => {
      e.preventDefault();
      toggleBtn.click();
    });
  });

  // Listener principal do form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    successBox.style.display = 'none';

    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    
    if (!email || !password) return;

    authBtn.textContent = 'Aguarde...';
    authBtn.disabled = true;

    if (isLoginMode) {
      // ===== LOGIN =====
      const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        errorBox.textContent = 'Erro ao entrar: ' + error.message;
        errorBox.style.display = 'block';
        authBtn.textContent = 'Entrar no Sistema';
        authBtn.disabled = false;
      } else {
        // Sucesso
        window.location.href = 'index.html';
      }
    } else {
      // ===== CADASTRO =====
      const { data, error } = await supabaseAuthClient.auth.signUp({
        email: email,
        password: password
      });

      if (error) {
        errorBox.textContent = 'Erro ao cadastrar: ' + error.message;
        errorBox.style.display = 'block';
        authBtn.textContent = 'Criar minha Conta';
        authBtn.disabled = false;
      } else {
        successBox.textContent = 'Conta criada com sucesso! Redirecionando...';
        successBox.style.display = 'block';
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    }
  });
});
