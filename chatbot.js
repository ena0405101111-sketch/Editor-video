class Chatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.context = {
            hasVideo: false,
            videoName: '',
            lastAction: '',
            currentTool: 'select',
            appliedFilters: [],
            cuts: 0
        };
        this.conversationFlow = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.addWelcomeMessage();
    }

    bindEvents() {
        const toggle = document.getElementById('chatbotToggle');
        const close = document.getElementById('chatbotClose');
        const input = document.getElementById('chatInput');
        const send = document.getElementById('chatSendBtn');

        if (toggle) toggle.addEventListener('click', () => this.togglePanel());
        if (close) close.addEventListener('click', () => this.closePanel());
        if (send) send.addEventListener('click', () => this.sendMessage());
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
    }

    togglePanel() {
        const panel = document.getElementById('chatbotPanel');
        if (!panel) return;
        
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            panel.classList.add('open');
        } else {
            panel.classList.remove('open');
        }
    }

    closePanel() {
        const panel = document.getElementById('chatbotPanel');
        if (!panel) return;
        
        panel.classList.remove('open');
        this.isOpen = false;
    }

    addWelcomeMessage() {
        this.addMessage('¡Hola! Soy tu asistente de EasyVideo1.1 🎬 ¿En qué puedo ayudarte?', 'bot');
        this.createWelcomeOptions();
    }
    
    createWelcomeOptions() {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'welcome-options-container';
        optionsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 10px 0;
            padding: 10px;
        `;
        
        const options = [
            { text: '❓ Ayuda', action: 'help' },
            { text: '⌨️ Atajos', action: 'shortcuts' },
            { text: '📋 ¿Qué puedes hacer?', action: 'commands' }
        ];
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'welcome-option-btn';
            button.textContent = option.text;
            button.style.cssText = `
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
                text-align: left;
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.background = '#5a67d8';
                button.style.transform = 'translateY(-1px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = '#667eea';
                button.style.transform = 'translateY(0)';
            });
            
            button.addEventListener('click', () => {
                this.handleWelcomeOption(option.action, option.text);
                optionsContainer.remove();
            });
            
            optionsContainer.appendChild(button);
        });
        
        messagesContainer.appendChild(optionsContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    handleWelcomeOption(action, buttonText) {
        // Mostrar mensaje del usuario
        this.addMessage(buttonText, 'user');
        
        // Mostrar indicador de escritura
        this.showTypingIndicator();
        
        setTimeout(() => {
            this.hideTypingIndicator();
            
            switch(action) {
                case 'help':
                    this.getHelpResponse();
                    break;
                case 'shortcuts':
                    this.addMessage(this.getShortcutsResponse(), 'bot');
                    this.createWelcomeOptions();
                    break;
                case 'commands':
                    this.getCommandsResponse();
                    break;
            }
        }, 800);
    }
    
    getShortcutsResponse() {
        return '⌨️ **ATAJOS:** Espacio=Play/Pause • S=Stop • ←→=Navegar • ↑↓=Volumen • O=Pantalla completa • R=Filtros random • C=Limpiar. No funcionan mientras escribes.';
    }
    
    createCategoryOptions() {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'category-options-container';
        optionsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 10px 0;
            padding: 10px;
        `;
        
        const options = [
            { text: '⚙️ Configuraciones', action: 'config' },
            { text: '✂️ Edición', action: 'editing' },
            { text: '🎨 Filtros', action: 'filters' }
        ];
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'category-option-btn';
            button.textContent = option.text;
            button.style.cssText = `
                background: #4a90e2;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.3s ease;
                text-align: left;
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.background = '#357abd';
                button.style.transform = 'translateY(-1px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = '#4a90e2';
                button.style.transform = 'translateY(0)';
            });
            
            button.addEventListener('click', () => {
                this.handleCategoryOption(option.action, option.text);
                optionsContainer.remove();
            });
            
            optionsContainer.appendChild(button);
        });
        
        messagesContainer.appendChild(optionsContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    handleCategoryOption(action, buttonText) {
        this.addMessage(buttonText, 'user');
        this.showTypingIndicator();
        
        setTimeout(() => {
            this.hideTypingIndicator();
            
            switch(action) {
                case 'config':
                    this.addMessage('⚙️ **CONFIGURACIONES:** "cambiar velocidad 2x" • "cambiar volumen 80" • "rotar 90/180" • "voltear horizontal/vertical"', 'bot');
                    this.createWelcomeOptions();
                    break;
                case 'editing':
                    this.addMessage('✂️ **EDICIÓN:** "quitar [filtro]" • "eliminar todos los filtros" • "descargar video"', 'bot');
                    this.createWelcomeOptions();
                    break;
                case 'filters':
                    this.addMessage('🎨 **FILTROS:** "aplicar brillo/contraste/saturación/desenfoque/sepia/grises/invertir/matiz" • "filtros aleatorios"', 'bot');
                    this.createFilterButtons();
                    this.createWelcomeOptions();
                    break;
            }
        }, 800);
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';
        
        // Mostrar indicador de escritura
        this.showTypingIndicator();
        
        setTimeout(() => {
            this.hideTypingIndicator();
            this.processMessage(message);
        }, 800 + Math.random() * 1000); // Delay más natural
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        // Soporte para emojis y formato
        if (text.includes('\n')) {
            const lines = text.split('\n');
            lines.forEach(line => {
                const lineDiv = document.createElement('div');
                lineDiv.textContent = line;
                messageDiv.appendChild(lineDiv);
            });
        } else {
            messageDiv.textContent = text;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        this.messages.push({ text, sender, timestamp: Date.now() });
    }
    
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    updateContext(key, value) {
        this.context[key] = value;
    }
    
    processMessage(message) {
        const lowerMessage = message.toLowerCase();
        this.updateContext('lastAction', message);
        
        // Detectar y ejecutar comandos directos primero
        const commandResult = this.detectAndExecuteCommands(lowerMessage);
        if (commandResult.executed) {
            commandResult.responses.forEach((response, index) => {
                setTimeout(() => {
                    this.addMessage(response, 'bot');
                }, index * 1200);
            });
            return;
        }
        
        // Detectar emociones y intenciones
        const intent = this.detectIntent(lowerMessage);
        const emotion = this.detectEmotion(lowerMessage);
        
        let responses = this.generateContextualResponse(intent, emotion, lowerMessage);
        
        // Enviar respuestas con delay natural
        responses.forEach((response, index) => {
            setTimeout(() => {
                this.addMessage(response, 'bot');
            }, index * 1200);
        });
    }
    
    detectAndExecuteCommands(message) {
        const commands = {
            // Filtros individuales
            'brillo': () => this.executeFilterCommand('brillo'),
            'brightness': () => this.executeFilterCommand('brillo'),
            'contraste': () => this.executeFilterCommand('contraste'),
            'contrast': () => this.executeFilterCommand('contraste'),
            'saturacion': () => this.executeFilterCommand('saturacion'),
            'saturate': () => this.executeFilterCommand('saturacion'),
            'desenfoque': () => this.executeFilterCommand('desenfoque'),
            'blur': () => this.executeFilterCommand('desenfoque'),
            'sepia': () => this.executeFilterCommand('sepia'),
            'grises': () => this.executeFilterCommand('grises'),
            'grayscale': () => this.executeFilterCommand('grises'),
            'invertir': () => this.executeFilterCommand('invertir'),
            'invert': () => this.executeFilterCommand('invertir'),
            'matiz': () => this.executeFilterCommand('matiz'),
            'hue-rotate': () => this.executeFilterCommand('matiz'),
            
            // Combinaciones predefinidas
            'vintage': () => this.executeFilterCombination('vintage'),
            'cinematico': () => this.executeFilterCombination('cinematico'),
            'dramatico': () => this.executeFilterCombination('dramatico'),
            'suave': () => this.executeFilterCombination('suave'),
            'vibrante': () => this.executeFilterCombination('vibrante'),
            
            // Comandos de velocidad
            'camara lenta': () => this.executeSpeedCommand(0.5),
            'slow motion': () => this.executeSpeedCommand(0.5),
            'rapido': () => this.executeSpeedCommand(2),
            'fast': () => this.executeSpeedCommand(2),
            'normal': () => this.executeSpeedCommand(1),
            
            // Comandos de rotación
            'rotar': () => this.executeRotateCommand(90),
            'rotate': () => this.executeRotateCommand(90),
            'voltear': () => this.executeFlipCommand('horizontal'),
            'flip': () => this.executeFlipCommand('horizontal'),
            
            // Comandos especiales
            'limpiar': () => this.executeClearCommand(),
            'clear': () => this.executeClearCommand(),
            'random': () => this.executeRandomCommand(),
            'aleatorio': () => this.executeRandomCommand()
        };
        
        // Detectar comandos de velocidad con números primero
        const speedMatch = message.match(/(?:velocidad|speed|pon velocidad|cambiar velocidad)\s*(\d+(?:\.\d+)?)x?/i);
        if (speedMatch) {
            const speed = parseFloat(speedMatch[1]);
            if (window.changeVideoSpeed) {
                const result = window.changeVideoSpeed(speed);
                if (result.success) {
                    return {
                        executed: true,
                        responses: [`⚡ ${result.message}. ¡Perfecto para efectos especiales!`]
                    };
                } else {
                    return {
                        executed: true,
                        responses: [result.message]
                    };
                }
            }
        }
        
        // Buscar comando exacto o parcial
        for (const [command, action] of Object.entries(commands)) {
            if (message.includes(command)) {
                return {
                    executed: true,
                    responses: action()
                };
            }
        }
        
        return { executed: false };
    }
    
    executeFilterCommand(filterName) {
        if (!window.applyFilter) {
            return ['Error: Editor no disponible'];
        }
        
        const result = window.applyFilter(filterName);
        
        if (result.success) {
            return [
                `✨ ${result.message}`,
                '¿Te gusta el resultado? Puedo ajustarlo o aplicar otro filtro.'
            ];
        } else {
            return [result.message];
        }
    }
    
    executeFilterCombination(combinationName) {
        if (!window.applyFilterCombination) {
            return ['Error: Editor no disponible'];
        }
        
        const result = window.applyFilterCombination(combinationName);
        
        if (result.success) {
            return [
                `🎨 Combinación "${combinationName}" aplicada`,
                `Filtros: ${result.message.split(': ')[1]}`,
                '¡Perfecto para darle un toque profesional!'
            ];
        } else {
            return [result.message];
        }
    }
    
    executeSpeedCommand(speed) {
        if (!window.changeVideoSpeed) {
            return ['Error: Editor no disponible'];
        }
        
        const result = window.changeVideoSpeed(speed);
        
        if (result.success) {
            return [`⚡ ${result.message}. ¡Efecto aplicado!`];
        } else {
            return [result.message];
        }
    }
    
    executeRotateCommand(degrees) {
        if (!window.rotateVideo) {
            return ['Error: Editor no disponible'];
        }
        
        const result = window.rotateVideo(degrees);
        
        if (result.success) {
            return [`🔄 ${result.message}. ¡Nueva perspectiva!`];
        } else {
            return [result.message];
        }
    }
    
    executeFlipCommand(direction) {
        if (!window.flipVideo) {
            return ['Error: Editor no disponible'];
        }
        
        const result = window.flipVideo(direction);
        
        if (result.success) {
            return [`🔄 ${result.message}. ¡Como un espejo!`];
        } else {
            return [result.message];
        }
    }
    
    executeClearCommand() {
        if (!window.clearAllFilters) {
            return ['Error: Editor no disponible'];
        }
        
        const result = window.clearAllFilters();
        return ['✅ Todos los filtros eliminados. Video restaurado al original.'];
    }
    
    executeRandomCommand() {
        if (!window.applyRandomFilters) {
            return ['Error: Editor no disponible'];
        }
        
        const result = window.applyRandomFilters();
        
        if (result.success) {
            return [
                `🎨 ¡Magia aleatoria aplicada! ${result.count} filtros sorpresa`,
                `Filtros: ${result.message.split(': ')[1]}`,
                '¿Te gusta la combinación? ¡Puedo hacer otra si quieres!'
            ];
        } else {
            return [result.message];
        }
    }
    
    detectIntent(message) {
        const intents = {
            greeting: ['hola', 'hi', 'hello', 'buenas', 'saludos'],
            help: ['ayuda', 'help', 'como', 'qué hago', 'no sé'],
            commands: ['qué puedes hacer', 'que puedes hacer', 'comandos', 'opciones', 'funciones', 'qué sabes hacer', 'que sabes hacer', 'lista de comandos', 'manual'],
            filters: ['filtro', 'efecto', 'filter', 'brillo', 'contraste'],
            speed: ['velocidad', 'speed', 'rápido', 'lento', 'acelerar'],
            transform: ['rotar', 'voltear', 'rotate', 'flip', 'girar'],
            export: ['exportar', 'descargar', 'guardar', 'download'],
            problem: ['error', 'problema', 'no funciona', 'bug'],
            compliment: ['gracias', 'genial', 'perfecto', 'excelente'],
            upload: ['cargar', 'subir', 'video', 'archivo'],
            apply_filter: ['aplicar', 'aplicame', 'pon', 'agrega', 'añade'],
            remove_filter: ['quitar', 'remover', 'eliminar', 'sacar'],
            change_setting: ['cambiar', 'ajustar', 'modificar', 'poner'],
            random_filters: ['random', 'aleatorio', 'sorprendeme', 'sorpréndeme', 'casuales']
        };
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return intent;
            }
        }
        return 'general';
    }
    
    detectEmotion(message) {
        if (message.includes('!') || message.includes('genial') || message.includes('perfecto')) {
            return 'excited';
        }
        if (message.includes('problema') || message.includes('error') || message.includes('no funciona')) {
            return 'frustrated';
        }
        if (message.includes('gracias') || message.includes('excelente')) {
            return 'grateful';
        }
        if (message.includes('?') || message.includes('como') || message.includes('ayuda')) {
            return 'curious';
        }
        return 'neutral';
    }
    
    generateContextualResponse(intent, emotion, message) {
        const responses = [];
        
        // Respuesta emocional
        if (emotion === 'excited') {
            responses.push('¡Me encanta tu energía! 🚀');
        } else if (emotion === 'frustrated') {
            responses.push('Entiendo tu frustración. Vamos a solucionarlo juntos 💪');
        } else if (emotion === 'grateful') {
            responses.push('¡De nada! Me alegra poder ayudarte 😊');
        }
        
        // Respuesta contextual basada en el estado
        const contextualIntro = this.getContextualIntro();
        if (contextualIntro) {
            responses.push(contextualIntro);
        }
        
        // Respuesta específica por intención
        switch (intent) {
            case 'greeting':
                responses.push(this.getGreetingResponse());
                break;
            case 'help':
                responses.push(...this.getHelpResponse());
                break;
            case 'commands':
                responses.push(...this.getCommandsResponse());
                break;
            case 'filters':
                responses.push(...this.getFiltersResponse());
                break;
            case 'speed':
                responses.push(this.getSpeedResponse());
                break;
            case 'transform':
                responses.push(this.getTransformResponse());
                break;
            case 'export':
                responses.push(...this.getExportResponse());
                break;
            case 'problem':
                responses.push(...this.getProblemResponse());
                break;
            case 'upload':
                responses.push(this.getUploadResponse());
                break;
            case 'apply_filter':
                responses.push(...this.handleApplyFilter(message));
                break;
            case 'remove_filter':
                responses.push(...this.handleRemoveFilter(message));
                break;
            case 'change_setting':
                responses.push(...this.handleChangeSetting(message));
                break;
            case 'random_filters':
                responses.push(...this.handleRandomFilters(message));
                break;
            default:
                responses.push(this.getGeneralResponse(message));
        }
        
        return responses.filter(r => r); // Remove empty responses
    }
    
    getContextualIntro() {
        if (!this.context.hasVideo) {
            return 'Veo que aún no has cargado ningún video.';
        }
        // Solo mostrar el nombre del archivo en saludos o preguntas generales, no en acciones
        return null;
    }
    
    getGreetingResponse() {
        const greetings = [
            '¡Hola! ¿Listo para crear algo increíble? 🎬',
            '¡Hola! Soy tu editor de video personal. ¿Qué vamos a crear hoy?',
            '¡Saludos! ¿En qué proyecto de video trabajamos?'
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    getHelpResponse() {
        if (!this.context.hasVideo) {
            this.addMessage('Carga tu video con "Seleccionar Video" y luego podrás editarlo. ¿Tienes un video listo?', 'bot');
        } else {
            this.addMessage('🎨 Aplica filtros • ⚡ Cambia velocidad/transformaciones • 💾 Exporta. ¿Qué hacemos?', 'bot');
        }
        this.createWelcomeOptions();
        return [];
    }
    
    getCommandsResponse() {
        this.createCategoryOptions();
        return [];
    }
    

    
    getFiltersResponse() {
        this.createFilterButtons();
        return ['Filtros disponibles - haz clic para aplicar:'];
    }
    
    createFilterButtons() {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const filtersData = [
            { name: 'Brillo', key: 'brillo', icon: '☀️' },
            { name: 'Contraste', key: 'contraste', icon: '🌅' },
            { name: 'Saturación', key: 'saturacion', icon: '🌈' },
            { name: 'Desenfoque', key: 'desenfoque', icon: '🌫️' },
            { name: 'Sepia', key: 'sepia', icon: '📜' },
            { name: 'Escala de Grises', key: 'grises', icon: '⚫' },
            { name: 'Invertir', key: 'invertir', icon: '🔄' },
            { name: 'Matiz', key: 'matiz', icon: '🎨' }
        ];
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'filter-buttons-container';
        buttonContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin: 10px 0;
            padding: 10px;
            background: #2a2a2a;
            border-radius: 8px;
            border: 1px solid #404040;
        `;
        
        filtersData.forEach(filter => {
            const button = document.createElement('button');
            button.className = 'filter-option-btn';
            button.innerHTML = `${filter.icon} ${filter.name}`;
            button.style.cssText = `
                background: #333;
                color: white;
                border: 1px solid #555;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.background = '#667eea';
                button.style.borderColor = '#667eea';
                button.style.transform = 'translateY(-1px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = '#333';
                button.style.borderColor = '#555';
                button.style.transform = 'translateY(0)';
            });
            
            button.addEventListener('click', () => {
                this.handleFilterSelection(filter.key, filter.name);
                buttonContainer.remove();
            });
            
            buttonContainer.appendChild(button);
        });
        
        messagesContainer.appendChild(buttonContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    handleFilterSelection(filterKey, filterName) {
        // Mostrar mensaje del usuario
        this.addMessage(`Aplicar ${filterName}`, 'user');
        
        // Mostrar indicador de escritura
        this.showTypingIndicator();
        
        setTimeout(() => {
            this.hideTypingIndicator();
            
            if (!window.applyFilter) {
                this.addMessage('Error: Editor no disponible', 'bot');
                return;
            }
            
            const result = window.applyFilter(filterKey);
            
            if (result.success) {
                this.addMessage(`✨ ${result.message}`, 'bot');
                this.addMessage('¿Te gusta cómo se ve? Puedes ajustarlo o probar otro filtro.', 'bot');
            } else {
                this.addMessage(result.message, 'bot');
            }
        }, 800);
    }
    
    getSpeedResponse() {
        return 'Velocidad: 0.25x a 3x en panel derecho. Ideal para cámara lenta/time-lapse.';
    }
    
    getTransformResponse() {
        return 'Transformaciones: Rotar 90°/180°, Voltear H/V. ¡Nuevo ángulo a tu video!';
    }
    

    
    getExportResponse() {
        if (!this.context.hasVideo) {
            return ['Carga un video primero para exportarlo.'];
        }
        return ['Clic en "Descargar MP4" → se procesa con ediciones → descarga automática. ¡Listo!'];
    }
    
    getProblemResponse() {
        return ['🔄 Recarga la página • 📹 Verifica formato (MP4/WebM/AVI) • 💻 Checa memoria. ¿Qué pasa exactamente?'];
    }
    
    getUploadResponse() {
        return 'Arrastra video o clic "Seleccionar Video". Formatos: MP4, WebM, AVI.';
    }
    
    handleApplyFilter(message) {
        const filterNames = {
            'brillo': 'brillo',
            'brightness': 'brillo',
            'contraste': 'contraste', 
            'contrast': 'contraste',
            'saturacion': 'saturacion',
            'saturate': 'saturacion',
            'desenfoque': 'desenfoque',
            'blur': 'desenfoque',
            'sepia': 'sepia',
            'grises': 'grises',
            'grayscale': 'grises',
            'invertir': 'invertir',
            'invert': 'invertir',
            'matiz': 'matiz',
            'hue-rotate': 'matiz'
        };
        
        // Verificar si pide filtros aleatorios
        if (message.toLowerCase().includes('random') || 
            message.toLowerCase().includes('aleatorio') || 
            message.toLowerCase().includes('sorpresa')) {
            return this.handleRandomFilters(message);
        }
        
        // Buscar qué filtro quiere aplicar
        let filterToApply = null;
        let customValue = null;
        
        for (const [key, value] of Object.entries(filterNames)) {
            if (message.toLowerCase().includes(key)) {
                filterToApply = value;
                break;
            }
        }
        
        // Buscar valor numérico en el mensaje
        const numberMatch = message.match(/\d+(\.\d+)?/);
        if (numberMatch) {
            customValue = parseFloat(numberMatch[0]);
        }
        
        if (!filterToApply) {
            return [
                'No especificaste qué filtro aplicar.',
                'Filtros disponibles: brillo, contraste, saturación, desenfoque, sepia, grises, invertir, matiz',
                'Ejemplo: "aplicar brillo" o "pon contraste 1.5"'
            ];
        }
        
        if (!window.applyFilter) {
            return ['Error: Editor no disponible. Asegúrate de que la página esté completamente cargada.'];
        }
        
        const result = window.applyFilter(filterToApply, customValue);
        
        if (result.success) {
            return [
                `¡Listo! ${result.message} ✨`,
                '¿Te gusta cómo se ve? Puedes ajustarlo o probar otro filtro.'
            ];
        } else {
            return [result.message];
        }
    }
    
    handleRemoveFilter(message) {
        const filterNames = {
            'brillo': 'brillo',
            'brightness': 'brillo',
            'contraste': 'contraste',
            'contrast': 'contraste',
            'saturacion': 'saturacion', 
            'saturate': 'saturacion',
            'desenfoque': 'desenfoque',
            'blur': 'desenfoque',
            'sepia': 'sepia',
            'grises': 'grises',
            'grayscale': 'grises',
            'invertir': 'invertir',
            'invert': 'invertir',
            'matiz': 'matiz',
            'hue-rotate': 'matiz'
        };
        
        let filterToRemove = null;
        
        for (const [key, value] of Object.entries(filterNames)) {
            if (message.toLowerCase().includes(key)) {
                filterToRemove = value;
                break;
            }
        }
        
        if (!filterToRemove) {
            if (message.toLowerCase().includes('todos') || message.toLowerCase().includes('all')) {
                if (window.clearAllFilters) {
                    const result = window.clearAllFilters();
                    return ['¡Todos los filtros eliminados! Video restaurado al original.'];
                }
            }
            return [
                'No especificaste qué filtro quitar.',
                'Ejemplo: "quitar brillo" o "eliminar todos los filtros"'
            ];
        }
        
        if (!window.removeFilter) {
            return ['Error: Editor no disponible. Asegúrate de que la página esté completamente cargada.'];
        }
        
        const result = window.removeFilter(filterToRemove);
        
        if (result.success) {
            return [
                `✅ ${result.message}`,
                '¿Quieres aplicar otro filtro o estás conforme así?'
            ];
        } else {
            return [result.message];
        }
    }
    
    handleChangeSetting(message) {
        const lowerMessage = message.toLowerCase();
        
        // Detectar qué configuración cambiar
        if (lowerMessage.includes('velocidad') || lowerMessage.includes('speed')) {
            const speedMatch = message.match(/(\d+(?:\.\d+)?)x?/);
            if (speedMatch) {
                const speed = parseFloat(speedMatch[1]);
                if (window.changeVideoSpeed) {
                    const result = window.changeVideoSpeed(speed);
                    if (result.success) {
                        return [`⚡ ${result.message}. ¡Perfecto para efectos especiales!`];
                    } else {
                        return [result.message];
                    }
                }
            }
            return ['Especifica la velocidad. Ejemplo: "cambiar velocidad 2x" o "velocidad 0.5"'];
        }
        
        if (lowerMessage.includes('volumen') || lowerMessage.includes('volume')) {
            const volumeMatch = message.match(/(\d+)%?/);
            if (volumeMatch) {
                const volume = parseInt(volumeMatch[1]);
                if (window.changeVideoVolume) {
                    const result = window.changeVideoVolume(volume);
                    if (result.success) {
                        return [`🔊 ${result.message}`];
                    } else {
                        return [result.message];
                    }
                }
            }
            return ['Especifica el volumen. Ejemplo: "cambiar volumen 80" o "volumen 50%"'];
        }
        
        if (lowerMessage.includes('rotar') || lowerMessage.includes('rotate')) {
            const degreeMatch = message.match(/(\d+)°?/);
            if (degreeMatch) {
                const degrees = parseInt(degreeMatch[1]);
                if (window.rotateVideo) {
                    const result = window.rotateVideo(degrees);
                    if (result.success) {
                        return [`🔄 ${result.message}. ¡Nuevo ángulo, nueva perspectiva!`];
                    } else {
                        return [result.message];
                    }
                }
            }
            return ['Especifica los grados. Ejemplo: "rotar 90" o "girar 180 grados"'];
        }
        
        if (lowerMessage.includes('voltear') || lowerMessage.includes('flip')) {
            let direction = null;
            if (lowerMessage.includes('horizontal') || lowerMessage.includes('h')) {
                direction = 'horizontal';
            } else if (lowerMessage.includes('vertical') || lowerMessage.includes('v')) {
                direction = 'vertical';
            }
            
            if (direction && window.flipVideo) {
                const result = window.flipVideo(direction);
                if (result.success) {
                    return [`🔄 ${result.message}. ¡Como un espejo!`];
                } else {
                    return [result.message];
                }
            }
            return ['Especifica la dirección. Ejemplo: "voltear horizontal" o "flip vertical"'];
        }
        
        return ['No entendí qué configuración cambiar. Puedo ajustar: velocidad, volumen, rotación, volteo.'];
    }
    
    handleRandomFilters(message) {
        if (!window.applyRandomFilters) {
            return ['Error: Editor no disponible. Asegúrate de que la página esté completamente cargada.'];
        }
        
        // Detectar si especifica cantidad de filtros
        let filterCount = null;
        const numberMatch = message.match(/(\d+)/);
        if (numberMatch) {
            filterCount = parseInt(numberMatch[1]);
            if (filterCount > 5) {
                return ['Máximo 5 filtros aleatorios. ¿Quieres que aplique 5?'];
            }
        }
        
        const result = window.applyRandomFilters(filterCount);
        
        if (result.success) {
            const responses = [
                `🎨 ¡Magia aleatoria aplicada! ${result.count} filtros sorpresa`,
                `Filtros aplicados: ${result.message.split(': ')[1]}`,
                '¿Te gusta la combinación? ¡Puedo hacer otra si quieres!'
            ];
            return responses;
        } else {
            return [result.message];
        }
    }
    
    getGeneralResponse(message) {
        const responses = [
            'Interesante... ¿Podrías ser más específico sobre tu proyecto de video?',
            'Cuéntame más detalles. ¿Qué tipo de edición necesitas?',
            'No estoy seguro de entender. ¿Te refieres a alguna función específica de edición?',
            'Hmm, ¿podrías reformular tu pregunta? Quiero ayudarte de la mejor manera.'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Inicializar chatbot cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new Chatbot();
});

// Funciones globales para compatibilidad
window.addChatMessage = function(sender, message) {
    if (window.chatbot) {
        window.chatbot.addMessage(message, sender);
    }
};

// Integración con el editor de video
window.updateChatbotContext = function(key, value) {
    if (window.chatbot) {
        window.chatbot.updateContext(key, value);
    }
};

// Notificaciones automáticas del chatbot
window.notifyChatbot = function(action, details) {
    if (window.chatbot && window.chatbot.isOpen) {
        const messages = {
            'video_loaded': `¡Perfecto! Video cargado: ${details}. ¿Qué editamos primero?`,
            'filter_applied': `Filtro ${details} aplicado. ¿Te gusta el resultado?`,
            'cut_created': `Corte creado en ${details}. ¿Necesitas más cortes?`,
            'tool_changed': `Herramienta ${details} activada. ¡Listo para trabajar!`,
            'export_started': '¡Exportando tu video! Esto tomará unos segundos...',
            'export_complete': '¡Video exportado exitosamente! 🎉'
        };
        
        if (messages[action]) {
            setTimeout(() => {
                window.chatbot.addMessage(messages[action], 'bot');
            }, 1000);
        }
    }
};