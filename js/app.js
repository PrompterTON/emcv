document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const navJourneysList = document.getElementById('nav-journeys-list');
    let allJourneys = [];

    const App = {
        async init() {
            try {
                const manifest = await Utils.fetchJSON('journeys.manifest.json');
                allJourneys = manifest.journeys;
                this.renderNav();
                this.renderHomePage();
            } catch (error) {
                this.renderError('Não foi possível carregar as jornadas. Tente novamente mais tarde.');
            }
        },
        
        renderNav() {
            navJourneysList.innerHTML = '';
            allJourneys.forEach(journey => {
                const li = Utils.createElement('li');
                const a = Utils.createElement('a', { href: '#', 'data-journey-id': journey.id }, journey.title);
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.startJourney(journey.id);
                });
                li.appendChild(a);
                navJourneysList.appendChild(li);
            });
        },
        
        renderHomePage() {
            appContainer.innerHTML = '';

            const hero = Utils.createElement('section', { class: 'hero-section' }, [
                Utils.createElement('h1', {}, 'Crie Prompts Poderosos para sua Carreira'),
                Utils.createElement('p', { class: 'text-lg' }, 'Use nossas jornadas guiadas para gerar prompts personalizados e otimizar seu perfil profissional.'),
            ]);

            const gridContainer = Utils.createElement('div', { class: 'journeys-grid' });
            allJourneys.forEach(journey => {
                const card = Utils.createElement('div', { class: 'card journey-card' }, [
                    Utils.createElement('h3', {}, journey.title),
                    Utils.createElement('p', {}, journey.description),
                    Utils.createElement('button', { class: 'button', 'data-journey-id': journey.id }, ['Iniciar Jornada →'])
                ]);
                card.querySelector('button').addEventListener('click', () => this.startJourney(journey.id));
                gridContainer.appendChild(card);
            });
            
            appContainer.appendChild(hero);
            appContainer.appendChild(gridContainer);
        },

        async startJourney(journeyId) {
            try {
                const journeyInfo = allJourneys.find(j => j.id === journeyId);
                if (!journeyInfo) throw new Error('Jornada não encontrada.');
                
                const journeyConfig = await Utils.fetchJSON(journeyInfo.path);
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
            appContainer.innerHTML = '';

            const journeyConfig = JourneyManager.getCurrentQuestion()?.config;
            const journeyTitle = allJourneys.find(j => j.id === JourneyManager.state.jornadaId)?.title || "Jornada";

            const breadcrumb = Utils.createElement('div', { class: 'breadcrumb' }, JourneyManager.getBreadcrumb());
            const questionText = Utils.createElement('p', { class: 'pergunta-texto', id: 'question-text' }, question.texto);
            
            const form = Utils.createElement('form', { id: 'question-form' });
            const optionsList = Utils.createElement('ul', { class: 'opcoes-lista', role: 'radiogroup', 'aria-labelledby': 'question-text' });
            
            question.opcoes.forEach((opt, index) => {
                const li = Utils.createElement('li');
                const input = Utils.createElement('input', { type: 'radio', name: 'option', value: opt.id, id: `opt-${opt.id}`, required: question.obrigatoria });
                const label = Utils.createElement('label', { for: `opt-${opt.id}` }, [input, ` ${opt.texto}`]);
                if (index === 0) input.setAttribute('autofocus', 'true');
                li.appendChild(label);
                optionsList.appendChild(li);
            });
            form.appendChild(optionsList);

            const navButtons = Utils.createElement('div', { class: 'jornada-nav-botoes' });
            const backButton = Utils.createElement('button', { class: 'button secondary', id: 'back-btn' }, ['← Anterior']);
            backButton.disabled = !JourneyManager.hasHistory();
            backButton.addEventListener('click', () => this.goBack());

            const nextButton = Utils.createElement('button', { class: 'button', id: 'next-btn' }, ['Próxima →']);
            nextButton.disabled = question.obrigatoria; // Desabilita se for obrigatória até uma seleção

            navButtons.append(backButton, nextButton);

            form.addEventListener('change', () => {
                if (question.obrigatoria) nextButton.disabled = false;
            });

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const selectedOption = form.querySelector('input[name="option"]:checked');
                if (selectedOption) {
                    this.goNext(selectedOption.value);
                }
            });
            
            const mainContent = Utils.createElement('div', { class: 'jornada-main-content' });
            mainContent.append(breadcrumb, questionText, form, navButtons);

            // Sidebar
            const sidebar = this.renderSidebar();

            const journeyContainer = Utils.createElement('div', { id: 'jornada-ativa-container' });
            journeyContainer.append(mainContent, sidebar);
            
            appContainer.appendChild(journeyContainer);
        },

        renderSidebar() {
            const sidebar = Utils.createElement('aside', { class: 'jornada-sidebar' });
            const previewCard = Utils.createElement('div', { class: 'card prompt-preview-card' }, [
                Utils.createElement('h3', {}, 'Prévia do Prompt'),
                Utils.createElement('div', { class: 'prompt-preview-content' }, JourneyManager.getPromptPreview() || 'Seu prompt será construído aqui...')
            ]);
            const actionsCard = Utils.createElement('div', { class: 'card' }, [
                 Utils.createElement('button', { class: 'button secondary', style: 'width: 100%' }, ['✗ Cancelar Jornada'])
            ]);
            actionsCard.querySelector('button').addEventListener('click', () => {
                if(confirm('Tem certeza que deseja cancelar a jornada? Todo o progresso será perdido.')) {
                    JourneyManager.cancel();
                    this.renderHomePage();
                }
            });

            sidebar.append(previewCard, actionsCard);
            return sidebar;
        },

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
                 this.renderHomePage(); // Voltou do primeiro passo
            }
        },

        renderResult(result) {
            appContainer.innerHTML = '';
            
            const container = Utils.createElement('div', { class: 'resultado-container' });
            
            container.appendChild(Utils.createElement('h2', {}, 'Seu Prompt Personalizado está Pronto!'));
            container.appendChild(Utils.createElement('p', {}, 'Copie o prompt abaixo e cole em sua ferramenta de IA preferida.'));

            const promptOutput = Utils.createElement('pre', { id: 'prompt-final-output' }, result.prompt);
            
            const copyButton = Utils.createElement('button', { class: 'button' }, ['⧉ Copiar Prompt']);
            const feedback = Utils.createElement('span', { class: 'copy-feedback', style: 'display: none; margin-left: 1rem;' }, '✓ Copiado!');
            
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(result.prompt).then(() => {
                    feedback.style.display = 'inline';
                    setTimeout(() => { feedback.style.display = 'none'; }, 2000);
                });
            });

            const newJourneyButton = Utils.createElement('button', { class: 'button secondary' }, ['🏠 Iniciar Nova Jornada']);
            newJourneyButton.addEventListener('click', () => this.renderHomePage());

            const actions = Utils.createElement('div', { class: 'resultado-acoes' }, [copyButton, newJourneyButton, feedback]);

            container.append(promptOutput, actions);
            appContainer.appendChild(container);
        },

        renderError(message) {
            appContainer.innerHTML = '';
            const errorCard = Utils.createElement('div', { class: 'card' }, [
                Utils.createElement('h2', { style: `color: ${getComputedStyle(document.documentElement).getPropertyValue('--color-danger')};` }, 'Ocorreu um Erro'),
                Utils.createElement('p', {}, message),
                Utils.createElement('button', { class: 'button' }, 'Voltar ao Início')
            ]);
            errorCard.querySelector('button').addEventListener('click', () => this.renderHomePage());
            appContainer.appendChild(errorCard);
        }
    };

    App.init();
});