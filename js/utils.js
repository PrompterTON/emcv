/**
 * Busca um arquivo JSON de uma URL.
 * @param {string} url - O caminho para o arquivo JSON.
 * @returns {Promise<object>} Os dados do JSON.
 */
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Falha ao buscar JSON de ${url}:`, error);
        throw error;
    }
}

/**
 * Função para criar elementos DOM com atributos e filhos.
 * Mais simples, ideal para os casos de uso deste app.
 * @param {string} htmlString - A string HTML a ser convertida em um elemento.
 * @returns {HTMLElement} O primeiro elemento criado a partir da string.
 */
function createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

/**
 * Copia um texto para a área de transferência e fornece feedback visual.
 * @param {string} text - O texto a ser copiado.
 * @param {HTMLElement} buttonElement - O botão que acionou a cópia.
 */
function copyToClipboard(text, buttonElement) {
    const originalText = buttonElement.textContent;
    
    // Usa a API Clipboard, com fallback para o método antigo.
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showFeedback('✓ Copiado!');
        }).catch(err => {
            console.error('Falha ao copiar com a API Clipboard: ', err);
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
    
    function showFeedback(message) {
        buttonElement.textContent = message;
        buttonElement.disabled = true;
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
        }, 2000);
    }
    
    function fallbackCopy(textToCopy) {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showFeedback('✓ Copiado!');
        } catch (err) {
            console.error('Falha ao copiar com execCommand: ', err);
            showFeedback('Erro ao copiar');
        }
        document.body.removeChild(textArea);
    }
}


// Exporta as funções para serem usadas em outros módulos
export { fetchJSON, createElementFromHTML, copyToClipboard };
