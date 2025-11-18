// =================================================================
// 🔑 CHAVE DA API INSERIDA AQUI
// =================================================================
const GEMINI_API_KEY = "AIzaSyCZEhsooN9qY1KP10ouJnCQArrn9kW87DI"; 
const historyList = document.getElementById('history-list');
const chatInput = document.getElementById('chat-input');
const sendButton = document.querySelector('.send-btn');

// Inicializa o cliente Gemini com sua chave
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
let chat = ai.chats.create({ model: "gemini-2.5-flash" }); // Cria uma sessão de chat
let searchHistory = []; // Histórico de mensagens local

// Função para renderizar (mostrar) o histórico na tela
function renderHistory() {
    historyList.innerHTML = ''; 
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<li style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 15px;">Histórico vazio. Comece a pesquisar!</li>';
        return;
    }

    searchHistory.forEach(item => {
        const listItem = document.createElement('li');
        // Adiciona classes para estilização de usuário vs IA
        listItem.className = 'history-item ' + (item.role === 'user' ? 'user-message' : 'ai-message');
        
        listItem.innerHTML = `
            <i class="${item.icon}"></i>
            <span class="history-text">${item.text}</span>
            <span class="history-time">${item.time}</span>
        `;
        historyList.appendChild(listItem);
    });
    // Rola para a mensagem mais recente
    historyList.scrollTop = historyList.scrollHeight;
}

// Função ligada ao botão "EXCLUIR HISTÓRICO"
function clearHistory() {
    const confirmation = confirm("Tem certeza que deseja apagar todo o histórico de pesquisa?");
    
    if (confirmation) {
        searchHistory = []; 
        renderHistory();    
        alert("Histórico excluído com sucesso!");
        // Reinicia a sessão do chat para limpar o contexto do modelo também
        chat = ai.chats.create({ model: "gemini-2.5-flash" });
    }
}

// Função principal para enviar mensagens ao Gemini
async function sendMessage() {
    const message = chatInput.value.trim();
    if (message === "") { return; }

    // Bloqueia a interação enquanto espera a resposta da IA
    chatInput.disabled = true;
    sendButton.disabled = true;
    chatInput.value = '';

    const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Adiciona a mensagem do usuário
    searchHistory.push({ text: message, time: timeString, icon: "fas fa-user", role: "user" });
    
    // 2. Adiciona o indicador de 'carregando' (Digitando...)
    searchHistory.push({ 
        text: "Digitando...", 
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 
        icon: "fas fa-robot", 
        role: "ai" 
    });
    renderHistory(); 

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
        searchHistory.pop(); 
        searchHistory.push({
            text: "Ocorreu um erro. Verifique a chave de API ou as restrições de uso.",
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            icon: "fas fa-exclamation-triangle",
            role: "error"
        });
    } finally {
        // 6. Atualiza a tela com a resposta (ou erro)
        renderHistory(); 

        // 7. Reabilita a interação
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
}

// Roda a função de renderização quando a página carrega

document.addEventListener('DOMContentLoaded', renderHistory);
