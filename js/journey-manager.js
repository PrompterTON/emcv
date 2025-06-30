const JourneyManager = (function() {
    const state = {
        jornadaId: null,
        perguntaAtualId: null,
        historico: [], // Armazena { perguntaId, opcaoId, trecho_prompt }
        promptParcial: "",
        config: null,
        isFinished: false
    };

    const LS_KEY_PREFIX = 'encontra_meu_cv_journey_';

    function getStorageKey() {
        return state.jornadaId ? `${LS_KEY_PREFIX}${state.jornadaId}` : null;
    }
    
    function resetState() {
        state.jornadaId = null;
        state.perguntaAtualId = null;
        state.historico = [];
        state.promptParcial = "";
        state.config = null;
        state.isFinished = false;
    }

    function saveProgress() {
        if (state.jornadaId) {
            Utils.saveToLocalStorage(getStorageKey(), state);
        }
    }

    function clearProgress() {
        if (state.jornadaId) {
            Utils.removeFromLocalStorage(getStorageKey());
        }
        resetState();
    }

    function buildPrompt() {
        const trechos = state.historico.map(passo => passo.trecho_prompt).filter(Boolean);
        // Exemplo de construção - pode ser mais complexo
        if (trechos.length > 0) {
            return `Atue como um especialista em recrutamento e otimização de carreira. Crie um texto com base nas seguintes diretrizes: ${trechos.join('. ')}.`;
        }
        return "";
    }
    
    return {
        async start(jornadaId, journeyConfig) {
            const savedState = Utils.getFromLocalStorage(`${LS_KEY_PREFIX}${jornadaId}`);
            if (savedState && !savedState.isFinished) {
                 Object.assign(state, savedState);
                 console.log('Jornada recuperada do localStorage.');
                 return this.getCurrentQuestion();
            }
            
            clearProgress(); // Limpa qualquer progresso anterior
            state.jornadaId = jornadaId;
            state.config = journeyConfig;
            state.perguntaAtualId = journeyConfig.jornada.pergunta_inicial;
            state.isFinished = false;
            saveProgress();
            return this.getCurrentQuestion();
        },

        cancel() {
            const jornadaId = state.jornadaId;
            clearProgress();
            return jornadaId; // Retorna o ID para que a UI possa decidir o que fazer
        },

        next(opcaoId) {
            const pergunta = this.getCurrentQuestion();
            if (!pergunta) return null;

            const opcaoEscolhida = pergunta.opcoes.find(o => o.id === opcaoId);
            if (!opcaoEscolhida) {
                console.error("Opção inválida:", opcaoId);
                return null;
            }

            state.historico.push({
                perguntaId: state.perguntaAtualId,
                opcaoId: opcaoId,
                trecho_prompt: opcaoEscolhida.trecho_prompt
            });

            state.promptParcial = buildPrompt();

            if (opcaoEscolhida.destino && state.config.perguntas[opcaoEscolhida.destino]) {
                state.perguntaAtualId = opcaoEscolhida.destino;
                saveProgress();
                return this.getCurrentQuestion();
            } else {
                state.isFinished = true;
                saveProgress();
                return this.finish();
            }
        },

        back() {
            if (state.historico.length === 0) {
                return null;
            }

            const ultimoPasso = state.historico.pop();
            state.perguntaAtualId = ultimoPasso.perguntaId;
            state.promptParcial = buildPrompt();
            state.isFinished = false;
            saveProgress();
            return this.getCurrentQuestion();
        },

        finish() {
            const finalPrompt = buildPrompt();
            clearProgress(); // Limpa o progresso ao finalizar
            return {
                isFinal: true,
                prompt: finalPrompt,
                historico: state.historico
            };
        },

        getCurrentQuestion() {
            if (!state.config || !state.perguntaAtualId) return null;
            return state.config.perguntas[state.perguntaAtualId];
        },
        
        getPromptPreview() {
            return state.promptParcial;
        },

        getBreadcrumb() {
            const totalEstimado = Object.keys(state.config?.perguntas || {}).length;
            const atual = state.historico.length + 1;
            return `Passo ${atual}`; // Sem revelar o total, como pedido.
        },
        
        hasHistory() {
            return state.historico.length > 0;
        }
    };
})();