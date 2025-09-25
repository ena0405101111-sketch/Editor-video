// Configuración del Editor de Video
const CONFIG = {
    // Formatos de video soportados
    SUPPORTED_VIDEO_FORMATS: [
        'video/mp4',
        'video/webm',
        'video/avi',
        'video/mov',
        'video/mkv',
        'video/wmv'
    ],

    // Formatos de exportación
    EXPORT_FORMATS: {
        mp4: 'video/mp4',
        webm: 'video/webm',
        avi: 'video/avi',
        mov: 'video/mov'
    },

    // Resoluciones disponibles
    RESOLUTIONS: {
        original: 'Original',
        '1920x1080': '1920x1080 (Full HD)',
        '1280x720': '1280x720 (HD)',
        '854x480': '854x480 (SD)',
        '640x360': '640x360 (nHD)'
    },

    // Filtros disponibles
    FILTERS: {
        brightness: {
            name: 'Brillo',
            cssFunction: 'brightness',
            defaultValue: 1.2,
            unit: ''
        },
        contrast: {
            name: 'Contraste',
            cssFunction: 'contrast',
            defaultValue: 1.2,
            unit: ''
        },
        saturation: {
            name: 'Saturación',
            cssFunction: 'saturate',
            defaultValue: 1.5,
            unit: ''
        },
        blur: {
            name: 'Desenfoque',
            cssFunction: 'blur',
            defaultValue: 2,
            unit: 'px'
        },
        sepia: {
            name: 'Sepia',
            cssFunction: 'sepia',
            defaultValue: 1,
            unit: ''
        },
        grayscale: {
            name: 'Escala de Grises',
            cssFunction: 'grayscale',
            defaultValue: 1,
            unit: ''
        }
    },

    // Configuración del chatbot
    CHATBOT: {
        responses: {
            greeting: ['¡Hola! ¿En qué puedo ayudarte con tu video?'],
            help: ['Puedo ayudarte con: cargar videos, recortar, aplicar filtros, cambiar velocidad, rotar, voltear, editar audio, agregar texto y exportar.'],
            filters: ['Tengo filtros de brillo, contraste, saturación, desenfoque, sepia y escala de grises disponibles en el panel izquierdo.'],
            export: ['Para exportar, selecciona el formato y resolución deseados en el panel derecho, luego haz clic en "Exportar Video".'],
            audio: ['Puedo ayudarte a ajustar volumen, silenciar, agregar pistas de audio o normalizar desde el panel derecho.'],
            text: ['Puedes agregar texto, subtítulos o marcas de agua usando los botones en la sección "Texto" del panel derecho.'],
            default: ['Interesante pregunta. ¿Podrías ser más específico sobre qué necesitas hacer con tu video?']
        }
    },

    // Límites y configuraciones
    LIMITS: {
        maxFileSize: 500 * 1024 * 1024, // 500MB
        maxDuration: 3600, // 1 hora en segundos
        minDuration: 1 // 1 segundo
    },

    // Configuración de la interfaz
    UI: {
        animationDuration: 300,
        statusMessageDuration: 3000,
        exportSimulationTime: 3000
    }
};

// Hacer la configuración disponible globalmente
window.CONFIG = CONFIG;