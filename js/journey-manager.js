// Este módulo gerencia o estado da jornada (perguntas, histórico, etc.)

const state = {
    journeyId: null,
    currentQuestionId: null,
    history: [], // [{ questionId, optionId, promptChunk }]
    config: null,
    isFinished: false,
};

const LS_KEY = 'encontra_meu_cv_journey_progress';

function saveProgress() {
    if (state.journeyId) {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
    }
}

function clearProgress() {
    localStorage.removeItem(LS_KEY);
}

function resetState() {
    state.journeyId = null;
    state.currentQuestionId = null;
    state.history = [];
    state.config = null;
    state.isFinished = false;
}

function buildPrompt() {
    const chunks = state.history.map(step => step.promptChunk).filter(Boolean);
    if (chunks.length === 0) return "";
    return `Atue como um especialista em recrutamento e otimização de carreira. Crie um texto com base nas seguintes diretrizes: ${chunks.join('. ')}.`;
}

// O objeto JourneyManager é a interface pública do módulo.
const JourneyManager = {
    async start(journeyId, journeyConfig) {
        const savedState = JSON.parse(localStorage.getItem(LS_KEY));
        
        // Se houver um estado salvo para a mesma jornada e ela não estiver finalizada, recupera.
        if (savedState && savedState.journeyId === journeyId && !savedState.isFinished) {
            Object.assign(state, savedState);
            console.log('Jornada recuperada do localStorage.');
            return this.getCurrentQuestion();
        }

        // Caso contrário, inicia uma nova jornada
        resetState();
        state.journeyId = journeyId;
        state.config = journeyConfig;
        state.currentQuestionId = journeyConfig.jornada.pergunta_inicial;
        state.isFinished = false;
        saveProgress();
        return this.getCurrentQuestion();
    },

    cancel() {
        clearProgress();
        resetState();
    },

    next(optionId) {
        const question = this.getCurrentQuestion();
        if (!question) return null;

        const chosenOption = question.opcoes.find(o => o.id === optionId);
        if (!chosenOption) {
            console.error("Opção inválida:", optionId);
            return null;
        }

        state.history.push({
            questionId: state.currentQuestionId,
            optionId,
            promptChunk: chosenOption.trecho_prompt,
        });

        if (chosenOption.destino && state.config.perguntas[chosenOption.destino]) {
            state.currentQuestionId = chosenOption.destino;
            saveProgress();
            return this.getCurrentQuestion();
        } else {
            // Fim da jornada
            state.isFinished = true;
            saveProgress(); // Salva o estado final antes de limpar
            return this.finish();
        }
    },

    back() {
        if (state.history.length === 0) {
            return null; // Não pode voltar do primeiro passo
        }
        const lastStep = state.history.pop();
        state.currentQuestionId = lastStep.questionId;
        state.isFinished = false;
        saveProgress();
        return this.getCurrentQuestion();
    },

    finish() {
        const finalPrompt = buildPrompt();
        clearProgress();
        const finalHistory = [...state.history]; // Copia o histórico
        resetState(); // Limpa o estado para a próxima jornada
        return {
            isFinal: true,
            prompt: finalPrompt,
            history: finalHistory,
        };
    },

    // Getters para acessar o estado interno de forma segura
    getCurrentQuestion() {
        if (!state.config || !state.currentQuestionId) return null;
        return state.config.perguntas[state.currentQuestionId];
    },

    getPromptPreview() {
        return buildPrompt();
    },

    getBreadcrumb() {
        if (!state.config) return "";
        const journeyTitle = state.config.jornada.titulo;
        const currentStep = state.history.length + 1;
        return `${journeyTitle} - Passo ${currentStep}`;
    },

    hasHistory() {
        return state.history.length > 0;
    },
};

export default JourneyManager;
