const Utils = {
    /**
     * Busca um arquivo JSON de uma URL.
     * @param {string} url - O caminho para o arquivo JSON.
     * @returns {Promise<object>} Os dados do JSON.
     */
    async fetchJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro na rede: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Falha ao buscar JSON de ${url}:`, error);
            throw error; // Propaga o erro para ser tratado pelo chamador
        }
    },

    /**
     * Salva um valor no localStorage após convertê-lo para JSON.
     * @param {string} key - A chave para o item.
     * @param {*} value - O valor a ser salvo.
     */
    saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Falha ao salvar no localStorage (chave: ${key}):`, error);
        }
    },

    /**
     * Obtém um valor do localStorage e o converte de JSON.
     * @param {string} key - A chave do item.
     * @returns {*} O valor parseado ou null se não existir ou houver erro.
     */
    getFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Falha ao ler do localStorage (chave: ${key}):`, error);
            return null;
        }
    },

    /**
     * Remove um item do localStorage.
     * @param {string} key - A chave do item a ser removido.
     */
    removeFromLocalStorage(key) {
        localStorage.removeItem(key);
    },

    /**
     * Função simples para criar elementos DOM com atributos e filhos.
     * @param {string} tag - A tag HTML do elemento.
     * @param {object} [attributes={}] - Um objeto de atributos (ex: { class: 'btn' }).
     * @param {(string|Node|Array<string|Node>)} [children=[]] - Texto, um nó ou um array de nós filhos.
     * @returns {HTMLElement} O elemento criado.
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        for (const key in attributes) {
            element.setAttribute(key, attributes[key]);
        }
        
        const appendChild = (child) => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        };

        if (Array.isArray(children)) {
            children.forEach(appendChild);
        } else {
            appendChild(children);
        }

        return element;
    }
};