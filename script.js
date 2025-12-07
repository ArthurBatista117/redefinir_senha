const SUPABASE_URL = 'https://uyjjilpkgnyblxejjjlk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5amppbHBrZ255Ymx4ZWpqamxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NDM1ODUsImV4cCI6MjA3NzUxOTU4NX0.qdyztkodkAD1YSe6ixnxnFZU7MYFzLDc2uJO5xNPAd0';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Verificar se há token na URL (convite/recuperação)
async function checkSession() {
    try {
        // Tenta pegar o token do hash (#) ou query (?)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        let accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        let refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        let type = hashParams.get('type') || queryParams.get('type');

        console.log('Tokens encontrados:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        if (accessToken) {
            const { data, error } = await supabaseClient.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
            });

            if (error) {
                console.error('Erro ao definir sessão:', error);
                showMessage('Link inválido ou expirado. Solicite um novo convite.', 'error');
            } else {
                console.log('Sessão definida com sucesso!');
                showMessage('Link válido! Defina sua nova senha abaixo.', 'success');
            }
        } else {
            // Verifica se já há uma sessão ativa
            const { data: { session } } = await supabaseClient.auth.getSession();

            if (!session) {
                showMessage('Link inválido. Verifique se clicou no link correto do email.', 'error');
                submitBtn.disabled = true;
            } else {
                console.log('Sessão já existe');
            }
        }
    } catch (err) {
        console.error('Erro ao verificar sessão:', err);
        showMessage('Erro ao processar o link. Tente novamente.', 'error');
    }
}

// Executar verificação ao carregar a página
checkSession();

const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const strengthBar = document.getElementById('strengthBar');
const submitBtn = document.getElementById('submitBtn');
const form = document.getElementById('resetForm');
const loading = document.getElementById('loading');
const message = document.getElementById('message');

// Validação de força da senha
passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const length = password.length;

    strengthBar.className = 'strength-fill';

    if (length === 0) {
        strengthBar.style.width = '0%';
    } else if (length < 6) {
        strengthBar.classList.add('strength-weak');
    } else if (length < 10) {
        strengthBar.classList.add('strength-medium');
    } else {
        strengthBar.classList.add('strength-strong');
    }

    updateRequirements();
});

confirmPasswordInput.addEventListener('input', updateRequirements);

function updateRequirements() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Requisito de comprimento
    const lengthReq = document.getElementById('req-length');
    if (password.length >= 6) {
        lengthReq.classList.remove('invalid');
        lengthReq.classList.add('valid');
    } else {
        lengthReq.classList.remove('valid');
        lengthReq.classList.add('invalid');
    }

    // Requisito de correspondência
    const matchReq = document.getElementById('req-match');
    if (password === confirmPassword && password.length > 0 && confirmPassword.length > 0) {
        matchReq.classList.remove('invalid');
        matchReq.classList.add('valid');
    } else {
        matchReq.classList.remove('valid');
        matchReq.classList.add('invalid');
    }
}

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type} active`;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validações
    if (password.length < 6) {
        showMessage('A senha deve ter no mínimo 6 caracteres', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem', 'error');
        return;
    }

    // Mostrar loading
    loading.classList.add('active');
    submitBtn.disabled = true;
    message.classList.remove('active');

    try {
        const { data, error } = await supabaseClient.auth.updateUser({
            password: password
        });

        if (error) throw error;

        showMessage('✓ Senha atualizada com sucesso! Você já pode fazer login no aplicativo.', 'success');
        form.reset();
        strengthBar.style.width = '0%';
        updateRequirements();

        // Redirecionar após 3 segundos (opcional)
        setTimeout(() => {
            window.close();
        }, 3000);

    } catch (error) {
        showMessage('Erro ao atualizar senha: ' + error.message, 'error');
    } finally {
        loading.classList.remove('active');
        submitBtn.disabled = false;
    }
});