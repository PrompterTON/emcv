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
    // ...restante do JS conforme anexo...
};
