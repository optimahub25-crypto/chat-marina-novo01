// =================================================================
// 🔑 CHAVE DA API INSERIDA (A Chave que você forneceu)
// =================================================================
const GEMINI_API_KEY = "AIzaSyD-872ZWnruby4Th-k85v5IZXwY1nroAOU"; 

// Variáveis DOM
const historyList = document.getElementById('history-list');
const chatInput = document.getElementById('chat-input');
const sendButton = document.querySelector('.send-btn');

// Inicialização da API (Esta linha falha se o SDK não carregar)
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
let chat = ai.chats.create({ model: "gemini-2.5-flash" }); 
let searchHistory = []; 

// Função para renderizar (mostrar) o histórico na tela
function renderHistory() {
    historyList.innerHTML = ''; 
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<li style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 15px;">Histórico vazio. Comece a pesquisar!</li>';
        return;
    }

    searchHistory.forEach(item => {
        const listItem = document.createElement('li');
        const iconClass = item.role === 'user' ? "fas fa-user" : (item.role === 'ai' ? "fas fa-robot" : "fas fa-exclamation-triangle");
        const roleClass = item.role === 'user' ? 'user-message' : (item.role === 'ai' ? 'ai-message' : 'error-message');
        const timeString = item.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        listItem.className = 'history-item ' + roleClass;
        
        listItem.innerHTML = `
            <i class="${iconClass}"></i>
            <span class="history-text">${item.text}</span>
            <span class="history-time">${timeString}</span>
        `;
        historyList.appendChild(listItem);
    });
    historyList.scrollTop = historyList.scrollHeight;
}

// Função ligada ao botão "EXCLUIR HISTÓRICO"
function clearHistory() {
    const confirmation = confirm("Tem certeza que deseja apagar todo o histórico de pesquisa?");
    
    if (confirmation) {
        searchHistory = []; 
        renderHistory();    
        alert("Histórico excluído com sucesso!");
        chat = ai.chats.create({ model: "gemini-2.5-flash" });
    }
}

// Função principal para enviar mensagens ao Gemini
async function sendMessage() {
    const message = chatInput.value.trim();
    if (message === "") { return; }

    // Bloqueia a interação
    chatInput.disabled = true;
    sendButton.disabled = true;

    const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Adiciona a mensagem do usuário
    searchHistory.push({ text: message, time: timeString, icon: "fas fa-user", role: "user" });
    
    // 2. Adiciona o indicador de 'carregando' (Digitando...)
    searchHistory.push({ 
        text: "Digitando...", 
        time: timeString,
        icon: "fas fa-robot", 
        role: "ai" 
    });
    
    renderHistory();
    chatInput.value = ''; 

    try {
        // 3. Comunicação com a API
        const response = await chat.sendMessage({ message: message });

        // 4. Remove o 'carregando'
        searchHistory.pop();

        // 5. Adiciona a resposta final da IA
        searchHistory.push({
            text: response.text, 
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            icon: "fas fa-robot",
            role: "ai"
        });

    } catch (error) {
        console.error("Erro ao comunicar com a API Gemini:", error);
        
        const errorMessage = "Erro na Comunicação. Verifique a chave de API ou a conexão de rede.";
        
        searchHistory.pop(); 
        searchHistory.push({
            text: errorMessage,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            icon: "fas fa-exclamation-triangle",
            role: "error"
        });
    } finally {
        renderHistory(); 

        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
}

// Roda a função de renderização quando a página carrega
document.addEventListener('DOMContentLoaded', renderHistory);
