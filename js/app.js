import { fetchJSON, createElementFromHTML, copyToClipboard } from './utils.js';
import JourneyManager from './journey-manager.js';

// Módulo principal da aplicação
document.addEventListener('DOMContentLoaded', () => {

    // Referências aos elementos do DOM
    const appContainer = document.getElementById('app-container');
    const navJourneysList = document.getElementById('nav-journeys-list');
    const logoLink = document.getElementById('logo-link');
    const homeNavLink = document.getElementById('home-nav-link');

    // Referências ao Modal
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    let modalConfirmCallback = null;

    let allJourneys = [];

    // Objeto principal da aplicação
    const App = {
        async init() {
            this.addEventListeners();
            try {
                const manifest = await fetchJSON('journeys.manifest.json');
                allJourneys = manifest.journeys;
                this.renderNav();
                this.renderHomePage();
            } catch (error) {
                this.renderError('Não foi possível carregar as jornadas. Tente novamente mais tarde.');
            }
        },

        addEventListeners() {
            // Navegação principal
            logoLink.addEventListener('click', e => {
                e.preventDefault();
                this.handleNavigation('home');
            });
            homeNavLink.addEventListener('click', e => {
                e.preventDefault();
                this.handleNavigation('home');
            });

            // Delegação de eventos para ações dinâmicas
            appContainer.addEventListener('click', e => {
                const target = e.target;
                if (target.matches('[data-action="start-journey"]')) {
                    this.startJourney(target.dataset.journeyId);
                } else if (target.matches('[data-action="copy-prompt"]')) {
                    const promptText = document.getElementById('prompt-final-output').textContent;
                    copyToClipboard(promptText, target);
                } else if (target.matches('[data-action="restart"]')) {
                    this.renderHomePage();
                } else if (target.matches('[data-action="back"]')) {
                    this.goBack();
                } else if (target.matches('[data-action="cancel"]')) {
                    this.showModal(
                        'Cancelar Jornada',
                        'Tem certeza? Todo o progresso será perdido.',
                        () => {
                            JourneyManager.cancel();
                            this.renderHomePage();
                        }
                    );
                }
            });

            // Seleção de opções da jornada
            appContainer.addEventListener('change', e => {
                if (e.target.matches('input[type="radio"][name="option"]')) {
                    document.querySelectorAll('.opcoes-lista label').forEach(label => label.classList.remove('selected'));
                    e.target.closest('label').classList.add('selected');
                    setTimeout(() => this.goNext(e.target.value), 250);
                }
            });

            // Eventos do Modal
            modalCancelBtn.addEventListener('click', () => this.hideModal());
            modalConfirmBtn.addEventListener('click', () => {
                if (modalConfirmCallback) modalConfirmCallback();
                this.hideModal();
            });
        },
        
        handleNavigation(targetView) {
            if (targetView === 'home' && JourneyManager.hasHistory()) {
                 this.showModal(
                    'Voltar ao Início',
                    'Deseja voltar à página inicial? O progresso atual será perdido.',
                    () => {
                        JourneyManager.cancel();
                        this.renderHomePage();
                    }
                );
            } else {
                this.renderHomePage();
            }
        },

        // --- Lógica de Renderização ---

        renderNav() {
            navJourneysList.innerHTML = '';
            allJourneys.forEach(journey => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = journey.title;
                a.addEventListener('click', e => {
                    e.preventDefault();
                    this.startJourney(journey.id);
                });
                li.appendChild(a);
                navJourneysList.appendChild(li);
            });
        },

        renderHomePage() {
            appContainer.innerHTML = '';
            const hero = createElementFromHTML(`
                <section class="hero-section">
                    <h1>Crie Prompts Poderosos para sua Carreira</h1>
                    <p>Use nossas jornadas guiadas para gerar prompts personalizados e otimizar seu perfil profissional em minutos.</p>
                </section>
            `);
            const grid = document.createElement('div');
            grid.className = 'journeys-grid';
            allJourneys.forEach(journey => {
                const card = createElementFromHTML(`
                    <div class="card journey-card">
                        <h3>${journey.title}</h3>
                        <p>${journey.description}</p>
                        <button class="button" data-action="start-journey" data-journey-id="${journey.id}">Iniciar Jornada &rarr;</button>
                    </div>
                `);
                grid.appendChild(card);
            });
            appContainer.append(hero, grid);
        },

        async startJourney(journeyId) {
            try {
                const journeyInfo = allJourneys.find(j => j.id === journeyId);
                if (!journeyInfo) throw new Error('Jornada não encontrada.');
                
                const journeyConfig = await fetchJSON(`data/${journeyId}.json`);
                const question = await JourneyManager.start(journeyId, journeyConfig);
                this.renderQuestion(question);
            } catch (error) {
                this.renderError('Falha ao iniciar a jornada.');
            }
        },

        renderQuestion(question) {
            if (!question) {
                this.renderError('Ocorreu um erro ao carregar a pergunta.');
                return;
            }
            appContainer.innerHTML = `
                <div id="jornada-ativa-container">
                    <div class="jornada-main-content">
                        <div class="jornada-header">
                            <p class="breadcrumb">${JourneyManager.getBreadcrumb()}</p>
                            <h2 class="pergunta-texto">${question.texto}</h2>
                        </div>
                        <form id="question-form">
                            <ul class="opcoes-lista">
                                ${question.opcoes.map(opt => `
                                    <li>
                                        <label for="opt-${opt.id}">
                                            <input type="radio" name="option" value="${opt.id}" id="opt-${opt.id}">
                                            <span>${opt.texto}</span>
                                        </label>
                                    </li>
                                `).join('')}
                            </ul>
                        </form>
                    </div>
                    <aside class="jornada-sidebar">
                        <div class="card">
                            <h3>Prévia do Prompt</h3>
                            <div class="prompt-preview-content">${JourneyManager.getPromptPreview() || 'Seu prompt será construído aqui...'}</div>
                            <div class="sidebar-actions">
                                <button class="button secondary" data-action="back" ${!JourneyManager.hasHistory() ? 'disabled' : ''}>← Voltar</button>
                                <button class="button danger" data-action="cancel">✗ Cancelar</button>
                            </div>
                        </div>
                    </aside>
                </div>
            `;
        },

        renderResult(result) {
             appContainer.innerHTML = `
                <div class="resultado-container">
                    <h2>Seu Prompt Personalizado está Pronto!</h2>
                    <p>Copie o prompt abaixo e cole em sua ferramenta de IA preferida.</p>
                    <pre id="prompt-final-output">${result.prompt}</pre>
                    <div class="resultado-acoes">
                        <button class="button" data-action="copy-prompt">Copiar Prompt</button>
                        <button class="button secondary" data-action="restart">🏠 Iniciar Nova Jornada</button>
                    </div>
                </div>
             `;
        },
        
        renderError(message) {
            appContainer.innerHTML = '';
            const errorCard = createElementFromHTML(`
                <div class="card" style="text-align: center;">
                    <h2 style="color: var(--color-danger);">Ocorreu um Erro</h2>
                    <p>${message}</p>
                    <button class="button" data-action="restart">Voltar ao Início</button>
                </div>
            `);
            appContainer.appendChild(errorCard);
        },

        // --- Lógica da Jornada ---

        goNext(optionId) {
            const result = JourneyManager.next(optionId);
            if (result.isFinal) {
                this.renderResult(result);
            } else {
                this.renderQuestion(result);
            }
        },

        goBack() {
            const question = JourneyManager.back();
            if (question) {
                this.renderQuestion(question);
            } else {
                this.renderHomePage();
            }
        },
        
        // --- Lógica do Modal ---
        showModal(title, message, onConfirm) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modalConfirmCallback = onConfirm;
            modalContainer.style.display = 'flex';
        },
        
        hideModal() {
            modalContainer.style.display = 'none';
            modalConfirmCallback = null;
        }
    };

    App.init();
});
