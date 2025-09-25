class Chatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
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
        this.addMessage('¡Hola! Soy tu asistente de edición de video. ¿En qué puedo ayudarte?', 'bot');
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';
        
        setTimeout(() => {
            this.processMessage(message);
        }, 500);
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        this.messages.push({ text, sender, timestamp: Date.now() });
    }

    processMessage(message) {
        const lowerMessage = message.toLowerCase();
        let response = '';

        if (lowerMessage.includes('hola') || lowerMessage.includes('hi')) {
            response = '¡Hola! ¿En qué puedo ayudarte con tu video?';
        } else if (lowerMessage.includes('cortar') || lowerMessage.includes('recortar') || lowerMessage.includes('trim')) {
            response = 'Para recortar el video, haz clic en "Recortar Video" en el panel izquierdo. Esto te permitirá seleccionar la parte del video que quieres mantener.';
        } else if (lowerMessage.includes('filtro') || lowerMessage.includes('efecto') || lowerMessage.includes('filter')) {
            response = 'Puedes aplicar filtros desde el panel izquierdo en la sección "Filtros". Tengo filtros de brillo, contraste, saturación, desenfoque, sepia y escala de grises.';
        } else if (lowerMessage.includes('velocidad') || lowerMessage.includes('speed')) {
            response = 'Para cambiar la velocidad, usa el control deslizante de "Velocidad" en el panel derecho. Puedes hacer el video más rápido o más lento.';
        } else if (lowerMessage.includes('rotar') || lowerMessage.includes('rotate')) {
            response = 'Puedes rotar el video usando los botones "Rotar 90°" o "Rotar 180°" en la sección de Transformaciones del panel izquierdo.';
        } else if (lowerMessage.includes('voltear') || lowerMessage.includes('flip')) {
            response = 'Para voltear el video, usa los botones "Voltear H" (horizontal) o "Voltear V" (vertical) en la sección de Transformaciones.';
        } else if (lowerMessage.includes('audio') || lowerMessage.includes('sonido')) {
            response = 'Puedo ayudarte con el audio: silenciar, agregar pistas de audio, quitar audio o normalizar. Encuentra estas opciones en el panel derecho.';
        } else if (lowerMessage.includes('texto') || lowerMessage.includes('subtitulo')) {
            response = 'Puedes agregar texto, subtítulos o marcas de agua usando los botones en la sección "Texto" del panel derecho.';
        } else if (lowerMessage.includes('exportar') || lowerMessage.includes('descargar') || lowerMessage.includes('guardar')) {
            response = 'Para exportar tu video editado, selecciona el formato y resolución deseados en el panel derecho, luego haz clic en "Exportar Video".';
        } else if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
            response = 'Puedo ayudarte con: cargar videos, recortar, aplicar filtros, cambiar velocidad, rotar, voltear, editar audio, agregar texto y exportar. ¿Qué necesitas hacer?';
        } else {
            response = 'Interesante pregunta. ¿Podrías ser más específico sobre qué necesitas hacer con tu video? Puedo ayudarte con edición, filtros, audio, texto y exportación.';
        }

        this.addMessage(response, 'bot');
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