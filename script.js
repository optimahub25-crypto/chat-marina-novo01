// =================================================================
// 🔑 SUA CHAVE DA API AQUI (A chave que você forneceu)
// =================================================================
// NOTA: A chave que você forneceu parece incompleta. Se possível, garanta que ela tenha 43 caracteres.
const GEMINI_API_KEY = "AIzaSyD-872ZWnruby4Th-k85v5IZXwY1nroAOU"; 

// Variáveis DOM
const historyList = document.getElementById('history-list');
const chatInput = document.getElementById('chat-input');
const sendButton = document.querySelector('.send-btn');
const CHAT_MODEL = "gemini-2.5-flash"; 

// O histórico agora é uma coleção de objetos com o papel (role) para a API
let searchHistory = [
    { role: "user", parts: [{ text: "Responda em português. Você é Marina Chat IA, uma assistente virtual prestativa." }] }
]; 

// Função para renderizar (mostrar) o histórico na tela
function renderHistory() {
    historyList.innerHTML = ''; 
    // Filtra o histórico para manter apenas as mensagens que devem ser exibidas
    const displayHistory = searchHistory.filter(item => item.role !== 'system');
    
    if (displayHistory.length === 0) {
        historyList.innerHTML = '<li style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 15px;">Histórico vazio. Comece a conversar!</li>';
        return;
    }

    displayHistory.forEach(item => {
        const text = item.parts ? item.parts[0].text : item.text;
        if (!text) return; // Ignora mensagens sem texto
        
        const role = item.role === 'model' ? 'ai' : item.role; // O Gemini usa 'model'
        
        const listItem = document.createElement('li');
        const iconClass = role === 'user' ? "fas fa-user" : (role === 'ai' ? "fas fa-robot" : "fas fa-exclamation-triangle");
        const roleClass = role === 'user' ? 'user-message' : (role === 'ai' ? 'ai-message' : 'error-message');
        const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        listItem.className = 'history-item ' + roleClass;
        
        listItem.innerHTML = `
            <i class="${iconClass}"></i>
            <span class="history-text">${text}</span>
            <span class="history-time">${timeString}</span>
        `;
        historyList.appendChild(listItem);
    });
    // Rola para a mensagem mais recente
    historyList.scrollTop = historyList.scrollHeight;
}

// Função ligada ao botão "EXCLUIR HISTÓRICO"
function clearHistory() {
    const confirmation = confirm("Tem certeza que deseja apagar todo o histórico de conversa?");
    
    if (confirmation) {
        // Reinicializa o histórico mantendo apenas a instrução de personalidade
        searchHistory = [
            { role: "user", parts: [{ text: "Responda em português. Você é Marina Chat IA, uma assistente virtual prestativa." }] }
        ];
        renderHistory();    
        alert("Histórico excluído com sucesso!");
    }
}

// Função principal para enviar mensagens à API do Gemini (usando FETCH puro)
async function sendMessage() {
    const message = chatInput.value.trim();
    if (message === "") { return; }

    // Adiciona a mensagem do usuário ao histórico e renderiza
    searchHistory.push({ role: "user", parts: [{ text: message }] });
    searchHistory.push({ role: "model", parts: [{ text: "Digitando..." }] });
    renderHistory(); 

    // Bloqueia a interação
    chatInput.disabled = true;
    sendButton.disabled = true;
    chatInput.value = '';

    try {
        // Filtra o histórico para manter apenas as mensagens com 'user' ou 'model'
        const messagesToSend = searchHistory.filter(item => item.role === 'user' || item.role === 'model');

        // Comunicação com a API do Gemini (Endpoint de Chat Completions)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: messagesToSend,
                // ✅ CORREÇÃO: Usamos generationConfig em vez de config
                generationConfig: { 
                    temperature: 0.7 
                }
            })
        });

        const data = await response.json();

        // 4. Remove o 'Digitando...' (A penúltima mensagem)
        searchHistory.splice(searchHistory.length - 1, 1);

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content;
            
            // 5. Adiciona a resposta final da IA
            searchHistory.push(aiResponse);
        } else if (data.error) {
            throw new Error(data.error.message || "Erro desconhecido da API.");
        } else {
            throw new Error("Resposta inesperada. Chave de API inválida ou limites excedidos.");
        }

    } catch (error) {
        console.error("Erro na comunicação com o Gemini:", error);
        
        // Remove o 'Digitando...' (Se ainda estiver lá)
        if (searchHistory[searchHistory.length - 1].parts[0].text === "Digitando...") {
            searchHistory.splice(searchHistory.length - 1, 1);
        }

        searchHistory.push({
            role: "error",
            parts: [{text: `Erro de comunicação: ${error.message}.`}]
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
