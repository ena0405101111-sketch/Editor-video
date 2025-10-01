class VideoEditor {
    constructor() {
        this.currentVideo = null;
        this.isPlaying = false;
        this.currentFilters = {};
        this.videoHistory = [];
        this.historyIndex = -1;
        this.maxHistorySize = 20;

        this.splitSegments = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupDragAndDrop();
        this.disableControls();
    }

    bindEvents() {
        // Upload events
        const fileInput = document.getElementById('videoInput');
        const selectBtn = document.getElementById('selectVideoBtn');
        
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        if (selectBtn) selectBtn.addEventListener('click', () => fileInput?.click());

        // Control events
        const controls = {
            'playBtn': () => this.playPause(),
            'stopBtn': () => this.stopVideo(),
            'seekBackBtn': () => this.seekVideo(-10),
            'seekForwardBtn': () => this.seekVideo(10),
            'downloadBtn': () => this.downloadVideo(),
            'clearFilters': () => this.clearFilters(),
            'randomFilters': () => this.applyRandomFilters(),
            'splitBtn': () => this.splitAtCurrentTime(),
            'undoBtn': () => this.undo(),
            'redoBtn': () => this.redo()
        };

        Object.entries(controls).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('click', handler);
        });

        // Filter events
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyFilter(e.target.dataset.filter);
            });
        });

        // Transform events
        document.querySelectorAll('[data-rotate]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.rotateVideo(parseInt(e.target.dataset.rotate));
            });
        });

        document.querySelectorAll('[data-flip]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.flipVideo(e.target.dataset.flip);
            });
        });

        // Slider events
        const volumeSlider = document.getElementById('volumeSlider');
        const speedSlider = document.getElementById('speedSlider');
        
        if (volumeSlider) volumeSlider.addEventListener('input', (e) => this.changeVolume(e.target.value));
        if (speedSlider) speedSlider.addEventListener('input', (e) => this.changeSpeed(e.target.value));
        
        // Progress bar events
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('input', (e) => this.seekToProgress(e.target.value));
        }
        
        // Filter modal controls
        const filterModalSlider = document.getElementById('filterModalSlider');
        const filterModalInput = document.getElementById('filterModalInput');
        const filterModalApply = document.getElementById('filterModalApply');
        const filterModalCancel = document.getElementById('filterModalCancel');
        const filterModalClose = document.getElementById('filterModalClose');
        
        if (filterModalSlider && filterModalInput) {
            filterModalSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                filterModalInput.value = value;
                if (this.currentFilterType) {
                    this.updateFilterPreview(this.currentFilterType, value);
                }
            });
            
            filterModalInput.addEventListener('input', (e) => {
                const value = e.target.value;
                filterModalSlider.value = value;
                if (this.currentFilterType) {
                    this.updateFilterPreview(this.currentFilterType, value);
                }
            });
        }
        
        if (filterModalApply) {
            filterModalApply.addEventListener('click', () => this.applyFilterFromModal());
        }
        
        if (filterModalCancel) {
            filterModalCancel.addEventListener('click', () => this.closeFilterModal(true));
        }
        
        if (filterModalClose) {
            filterModalClose.addEventListener('click', () => this.closeFilterModal(true));
        }
        

        
        // Make modal draggable
        this.makeDraggable(document.querySelector('.filter-modal-content'));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.loadVideo(files[0]);
            }
        });

        uploadArea.addEventListener('click', () => {
            document.getElementById('videoInput')?.click();
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.loadVideo(file);
        }
    }

    loadVideo(file) {
        if (!file.type.startsWith('video/')) {
            this.showStatus('Por favor selecciona un archivo de video válido.');
            return;
        }

        const url = URL.createObjectURL(file);
        const videoContainer = document.getElementById('videoContainer');
        const placeholder = document.getElementById('videoPlaceholder');
        
        // Remove existing video
        const existingVideo = videoContainer.querySelector('video');
        if (existingVideo) {
            existingVideo.remove();
        }

        // Create new video element
        const video = document.createElement('video');
        video.src = url;
        video.controls = false;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';

        // Hide placeholder and upload area
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.style.display = 'none';
        }

        videoContainer.appendChild(video);
        this.currentVideo = video;
        this.currentFile = file; // Guardar referencia al archivo

        // Event listeners
        video.addEventListener('loadedmetadata', () => {
            this.showStatus(`Video cargado: ${file.name} (${this.formatDuration(video.duration)})`);
            
            // Análisis automático
            setTimeout(() => {
                this.analyzeVideoAuto();
            }, 500);
            
            // Notificar al chatbot
            if (window.updateChatbotContext) {
                window.updateChatbotContext('hasVideo', true);
                window.updateChatbotContext('videoName', file.name);
            }
            if (window.notifyChatbot) {
                window.notifyChatbot('video_loaded', file.name);
            }
        });
        
        video.addEventListener('timeupdate', () => {
            this.updateProgressBar();
            
            // Actualizar histograma cada 2 segundos durante reproducción
            if (this.isPlaying && Object.keys(this.currentFilters).length > 0) {
                const now = Date.now();
                if (!this.lastHistogramUpdate || now - this.lastHistogramUpdate > 2000) {
                    this.generateColorHistogram();
                    this.lastHistogramUpdate = now;
                }
            }
        });
        


        // Enable controls
        this.enableControls();
        
        // Update button text
        this.updateSelectVideoButton();
        
        // Guardar estado inicial
        this.saveState();
    }

    enableControls() {
        const controlButtons = document.querySelectorAll('.btn, .control-btn');
        controlButtons.forEach(btn => {
            btn.disabled = false;
        });
    }

    disableControls() {
        const controlButtons = document.querySelectorAll('.btn, .control-btn');
        controlButtons.forEach(btn => {
            btn.disabled = true;
        });
    }

    updateSelectVideoButton() {
        const selectBtn = document.getElementById('selectVideoBtn');
        if (selectBtn) {
            selectBtn.textContent = this.currentVideo ? 'Reemplazar Video' : 'Seleccionar Video';
        }
    }



    playPause() {
        if (!this.currentVideo) return;
        
        const playBtn = document.getElementById('playBtn');
        
        if (this.isPlaying) {
            this.currentVideo.pause();
            playBtn.textContent = 'Play';
            this.isPlaying = false;
        } else {
            this.currentVideo.play();
            playBtn.textContent = 'Pause';
            this.isPlaying = true;
        }
    }

    stopVideo() {
        if (!this.currentVideo) return;
        
        this.currentVideo.pause();
        this.currentVideo.currentTime = 0;
        document.getElementById('playBtn').textContent = 'Play';
        this.isPlaying = false;
    }

    seekVideo(seconds) {
        if (!this.currentVideo) return;
        
        this.currentVideo.currentTime = Math.max(0, Math.min(this.currentVideo.duration, this.currentVideo.currentTime + seconds));
    }

    changeVolume(value) {
        if (!this.currentVideo) return;
        this.currentVideo.volume = value / 100;
        
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) {
            volumeValue.textContent = `${value}%`;
        }
        
        this.showStatus(`Volumen ajustado a ${value}%`);
    }

    changeSpeed(value) {
        if (!this.currentVideo) return;
        this.currentVideo.playbackRate = parseFloat(value);
        
        const speedValue = document.getElementById('speedValue');
        if (speedValue) {
            speedValue.textContent = `${value}x`;
        }
        
        this.showStatus(`Velocidad ajustada a ${value}x`);
    }

    rotateVideo(degrees) {
        if (!this.currentVideo) return;
        
        const currentTransform = this.currentVideo.style.transform || '';
        const rotationMatch = currentTransform.match(/rotate\(([^)]+)\)/);
        const currentRotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
        const newRotation = currentRotation + degrees;
        
        const otherTransforms = currentTransform.replace(/rotate\([^)]+\)/g, '').trim();
        this.currentVideo.style.transform = `rotate(${newRotation}deg) ${otherTransforms}`.trim();
        this.showStatus(`Video rotado ${degrees}°`);
        
        // Actualizar análisis dinámico
        this.updateDynamicAnalysis();
        this.saveState();
    }

    flipVideo(direction) {
        if (!this.currentVideo) return;
        
        const currentTransform = this.currentVideo.style.transform || '';
        const scaleToToggle = direction === 'horizontal' ? 'scaleX(-1)' : 'scaleY(-1)';
        const scaleToKeep = direction === 'horizontal' ? 'scaleY(-1)' : 'scaleX(-1)';
        
        // Remover el scale actual de la dirección que estamos cambiando
        let newTransform = currentTransform.replace(scaleToToggle, '').replace(/\s+/g, ' ').trim();
        
        // Si ya tenía el volteo, no lo agregamos (toggle off), si no lo tenía, lo agregamos (toggle on)
        if (!currentTransform.includes(scaleToToggle)) {
            newTransform = newTransform + ` ${scaleToToggle}`;
        }
        
        this.currentVideo.style.transform = newTransform.trim();
        this.showStatus(`Video volteado ${direction}mente`);
        
        // Actualizar análisis dinámico
        this.updateDynamicAnalysis();
        this.saveState();
    }

    applyFilter(filterType) {
        if (!this.currentVideo) return;
        
        const filterBtn = document.querySelector(`[data-filter="${filterType}"]`);
        
        if (this.currentFilters[filterType]) {
            delete this.currentFilters[filterType];
            filterBtn?.classList.remove('active');
            this.showStatus(`Filtro ${filterType} removido`);
            this.updateVideoFilters();
        } else {
            this.openFilterModal(filterType);
        }
    }
    
    openFilterModal(filterType) {
        const modal = document.getElementById('filterModal');
        const title = document.getElementById('filterModalTitle');
        const slider = document.getElementById('filterModalSlider');
        const input = document.getElementById('filterModalInput');
        const label = document.getElementById('filterLabel');
        
        const config = this.getFilterConfig(filterType);
        
        title.textContent = `Ajustar ${config.name}`;
        label.textContent = `${config.label}:`;
        slider.min = config.min;
        slider.max = config.max;
        slider.step = config.step;
        slider.value = config.default;
        input.min = config.min;
        input.max = config.max;
        input.step = config.step;
        input.value = config.default;
        
        modal.style.display = 'block';
        this.currentFilterType = filterType;
        this.originalFilterState = { ...this.currentFilters };
    }
    
    getFilterConfig(filterType) {
        const configs = {
            brightness: { name: 'Brillo', label: 'Intensidad', min: 0, max: 3, step: 0.1, default: 1.3 },
            contrast: { name: 'Contraste', label: 'Intensidad', min: 0, max: 3, step: 0.1, default: 1.3 },
            saturate: { name: 'Saturación', label: 'Intensidad', min: 0, max: 3, step: 0.1, default: 1.5 },
            blur: { name: 'Desenfoque', label: 'Píxeles', min: 0, max: 10, step: 0.5, default: 2 },
            sepia: { name: 'Sepia', label: 'Intensidad', min: 0, max: 1, step: 0.1, default: 1 },
            grayscale: { name: 'Escala de Grises', label: 'Intensidad', min: 0, max: 1, step: 0.1, default: 1 },
            invert: { name: 'Invertir', label: 'Intensidad', min: 0, max: 1, step: 0.1, default: 1 },
            'hue-rotate': { name: 'Matiz', label: 'Grados', min: 0, max: 360, step: 10, default: 90 }
        };
        return configs[filterType] || configs.brightness;
    }
    
    applyFilterFromModal() {
        const filterType = this.currentFilterType;
        
        const filterBtn = document.querySelector(`[data-filter="${filterType}"]`);
        filterBtn?.classList.add('active');
        
        this.closeFilterModal();
        this.showStatus(`Filtro ${filterType} aplicado`);
        
        // Notificar al chatbot
        if (window.notifyChatbot) {
            window.notifyChatbot('filter_applied', filterType);
        }
        
        this.saveState();
    }
    
    closeFilterModal(cancelled = false) {
        if (cancelled && this.originalFilterState) {
            this.currentFilters = { ...this.originalFilterState };
            this.updateVideoFilters();
            
            const filterBtn = document.querySelector(`[data-filter="${this.currentFilterType}"]`);
            if (filterBtn && !this.currentFilters[this.currentFilterType]) {
                filterBtn.classList.remove('active');
            }
        }
        
        document.getElementById('filterModal').style.display = 'none';
        this.currentFilterType = null;
        this.originalFilterState = null;
    }
    
    updateFilterPreview(filterType, value) {
        if (!this.currentVideo) return;
        
        this.currentFilters[filterType] = this.buildFilterValue(filterType, value);
        this.updateVideoFilters();
    }
    
    makeDraggable(element) {
        if (!element) return;
        
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector('.filter-modal-header');
        
        if (header) {
            header.onmousedown = dragMouseDown;
        } else {
            element.onmousedown = dragMouseDown;
        }
        
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            const newTop = element.offsetTop - pos2;
            const newLeft = element.offsetLeft - pos1;
            
            element.style.top = newTop + 'px';
            element.style.left = newLeft + 'px';
            element.style.transform = 'none';
        }
        
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
    
    buildFilterValue(filterType, value) {
        switch(filterType) {
            case 'blur':
                return `blur(${value}px)`;
            case 'hue-rotate':
                return `hue-rotate(${value}deg)`;
            default:
                return `${filterType}(${value})`;
        }
    }

    clearFilters() {
        if (!this.currentVideo) return;
        
        this.currentFilters = {};
        this.currentVideo.style.filter = '';
        
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.showStatus('Filtros eliminados');
        this.saveState();
    }

    updateVideoFilters() {
        if (!this.currentVideo) return;
        
        const filterString = Object.values(this.currentFilters).join(' ');
        this.currentVideo.style.filter = filterString;
        
        // Actualizar análisis dinámico
        this.updateDynamicAnalysis();
    }

    async downloadVideo() {
        if (!this.currentVideo) return;
        
        this.showStatus('Procesando video con ediciones...', true);
        
        // Notificar al chatbot
        if (window.notifyChatbot) {
            window.notifyChatbot('export_started');
        }
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const videoWidth = this.currentVideo.videoWidth || 640;
            const videoHeight = this.currentVideo.videoHeight || 480;
            
            const transform = this.currentVideo.style.transform || '';
            const rotationMatch = transform.match(/rotate\(([^)]+)\)/);
            const degrees = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
            const hasHorizontalFlip = transform.includes('scaleX(-1)');
            const hasVerticalFlip = transform.includes('scaleY(-1)');
            const isRotated90 = Math.abs(degrees % 180) === 90;
            
            if (isRotated90) {
                canvas.width = videoHeight;
                canvas.height = videoWidth;
            } else {
                canvas.width = videoWidth;
                canvas.height = videoHeight;
            }
            
            const stream = canvas.captureStream(30);
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks = [];
            
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'video-editado.webm';
                link.click();
                URL.revokeObjectURL(url);
                this.showStatus('Video descargado con ediciones aplicadas');
                
                // Notificar al chatbot
                if (window.notifyChatbot) {
                    window.notifyChatbot('export_complete');
                }
            };
            
            const originalTime = this.currentVideo.currentTime;
            this.currentVideo.currentTime = 0;
            
            mediaRecorder.start();
            
            const renderFrame = () => {
                if (this.currentVideo.ended) {
                    mediaRecorder.stop();
                    this.currentVideo.currentTime = originalTime;
                    return;
                }
                
                ctx.save();
                ctx.translate(canvas.width/2, canvas.height/2);
                
                // Aplicar rotación primero
                if (degrees !== 0) {
                    const radians = degrees * Math.PI / 180;
                    ctx.rotate(radians);
                }
                
                // Aplicar volteos después de la rotación
                let scaleX = 1;
                let scaleY = 1;
                
                if (hasHorizontalFlip) {
                    scaleX = -1;
                }
                
                if (hasVerticalFlip) {
                    scaleY = -1;
                }
                
                if (scaleX !== 1 || scaleY !== 1) {
                    ctx.scale(scaleX, scaleY);
                }
                
                // Aplicar filtros
                ctx.filter = this.currentVideo.style.filter || 'none';
                
                // Dibujar el video centrado
                const drawWidth = isRotated90 ? videoHeight : videoWidth;
                const drawHeight = isRotated90 ? videoWidth : videoHeight;
                
                ctx.drawImage(this.currentVideo, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
                
                requestAnimationFrame(renderFrame);
            };
            
            this.currentVideo.play();
            renderFrame();
            
        } catch (error) {
            console.error('Error al procesar video:', error);
            this.showStatus('Error al procesar el video. Descargando original...');
            
            const link = document.createElement('a');
            link.href = this.currentVideo.src;
            link.download = 'video.mp4';
            link.click();
        }
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateProgressBar() {
        if (!this.currentVideo) return;
        
        const progressBar = document.getElementById('progressBar');
        const currentTime = document.getElementById('currentTime');
        const totalTime = document.getElementById('totalTime');
        
        if (progressBar) {
            const progress = (this.currentVideo.currentTime / this.currentVideo.duration) * 100;
            progressBar.value = progress;
        }
        
        if (currentTime) {
            currentTime.textContent = this.formatDuration(this.currentVideo.currentTime);
        }
        
        if (totalTime) {
            totalTime.textContent = this.formatDuration(this.currentVideo.duration);
        }
    }
    
    seekToProgress(value) {
        if (!this.currentVideo) return;
        
        const time = (value / 100) * this.currentVideo.duration;
        this.currentVideo.currentTime = time;
    }

    splitAtCurrentTime() {
        if (!this.currentVideo) {
            this.showStatus('No hay video cargado');
            return;
        }
        
        const currentTime = this.currentVideo.currentTime;
        
        if (currentTime <= 0 || currentTime >= this.currentVideo.duration) {
            this.showStatus('No se puede dividir al inicio o final del video');
            return;
        }
        
        if (this.splitSegments.includes(currentTime)) {
            this.showStatus('Ya existe una división en este punto');
            return;
        }
        
        this.splitSegments.push(currentTime);
        this.splitSegments.sort((a, b) => a - b);
        
        this.showStatus(`Video dividido en ${this.formatDuration(currentTime)} (${this.splitSegments.length} divisiones)`);
    }
    
    // Métodos públicos para el chatbot
    applyFilterByName(filterName, value = null) {
        if (!this.currentVideo) {
            return { success: false, message: 'No hay video cargado' };
        }
        
        const filterMap = {
            'brillo': 'brightness',
            'brightness': 'brightness',
            'contraste': 'contrast', 
            'contrast': 'contrast',
            'saturacion': 'saturate',
            'saturate': 'saturate',
            'desenfoque': 'blur',
            'blur': 'blur',
            'sepia': 'sepia',
            'grises': 'grayscale',
            'grayscale': 'grayscale',
            'invertir': 'invert',
            'invert': 'invert',
            'matiz': 'hue-rotate',
            'hue-rotate': 'hue-rotate'
        };
        
        const filterType = filterMap[filterName.toLowerCase()];
        if (!filterType) {
            return { success: false, message: `Filtro "${filterName}" no encontrado` };
        }
        
        // Usar valor por defecto si no se especifica
        if (value === null) {
            const config = this.getFilterConfig(filterType);
            value = config.default;
        }
        
        // Aplicar filtro
        this.currentFilters[filterType] = this.buildFilterValue(filterType, value);
        this.updateVideoFilters();
        
        // Activar botón visual
        const filterBtn = document.querySelector(`[data-filter="${filterType}"]`);
        if (filterBtn) {
            filterBtn.classList.add('active');
        }
        
        return { 
            success: true, 
            message: `Filtro ${filterName} aplicado con valor ${value}`,
            filterType,
            value
        };
    }
    
    removeFilterByName(filterName) {
        if (!this.currentVideo) {
            return { success: false, message: 'No hay video cargado' };
        }
        
        const filterMap = {
            'brillo': 'brightness',
            'brightness': 'brightness',
            'contraste': 'contrast',
            'contrast': 'contrast', 
            'saturacion': 'saturate',
            'saturate': 'saturate',
            'desenfoque': 'blur',
            'blur': 'blur',
            'sepia': 'sepia',
            'grises': 'grayscale',
            'grayscale': 'grayscale',
            'invertir': 'invert',
            'invert': 'invert',
            'matiz': 'hue-rotate',
            'hue-rotate': 'hue-rotate'
        };
        
        const filterType = filterMap[filterName.toLowerCase()];
        if (!filterType) {
            return { success: false, message: `Filtro "${filterName}" no encontrado` };
        }
        
        if (!this.currentFilters[filterType]) {
            return { success: false, message: `El filtro ${filterName} no está aplicado` };
        }
        
        // Remover filtro
        delete this.currentFilters[filterType];
        this.updateVideoFilters();
        
        // Desactivar botón visual
        const filterBtn = document.querySelector(`[data-filter="${filterType}"]`);
        if (filterBtn) {
            filterBtn.classList.remove('active');
        }
        
        return { 
            success: true, 
            message: `Filtro ${filterName} removido`,
            filterType
        };
    }
    
    getAppliedFilters() {
        return Object.keys(this.currentFilters);
    }
    
    getAvailableFilters() {
        return {
            success: true,
            filters: [
                { name: 'Brillo', key: 'brightness', description: 'Ajusta el brillo del video' },
                { name: 'Contraste', key: 'contrast', description: 'Modifica el contraste' },
                { name: 'Saturación', key: 'saturate', description: 'Cambia la intensidad de los colores' },
                { name: 'Desenfoque', key: 'blur', description: 'Aplica efecto de desenfoque' },
                { name: 'Sepia', key: 'sepia', description: 'Efecto vintage sepia' },
                { name: 'Escala de Grises', key: 'grayscale', description: 'Convierte a blanco y negro' },
                { name: 'Invertir', key: 'invert', description: 'Invierte los colores' },
                { name: 'Matiz', key: 'hue-rotate', description: 'Rota los colores del espectro' }
            ]
        };
    }
    
    changeSpeed(speed) {
        if (!this.currentVideo) {
            return { success: false, message: 'No hay video cargado' };
        }
        
        const speedValue = parseFloat(speed);
        if (speedValue < 0.25 || speedValue > 3) {
            return { success: false, message: 'La velocidad debe estar entre 0.25x y 3x' };
        }
        
        // Redondear al step más cercano (0.25)
        const roundedSpeed = Math.round(speedValue / 0.25) * 0.25;
        
        this.currentVideo.playbackRate = roundedSpeed;
        const speedSlider = document.getElementById('speedSlider');
        const speedValueElement = document.getElementById('speedValue');
        if (speedSlider) {
            speedSlider.value = roundedSpeed;
        }
        if (speedValueElement) {
            speedValueElement.textContent = `${roundedSpeed}x`;
        }
        
        // Actualizar análisis dinámico
        this.updateDynamicAnalysis();
        
        return { 
            success: true, 
            message: `Velocidad cambiada a ${roundedSpeed}x`,
            speed: roundedSpeed
        };
    }
    
    changeVolume(volume) {
        if (!this.currentVideo) {
            return { success: false, message: 'No hay video cargado' };
        }
        
        const volumeValue = parseInt(volume);
        if (volumeValue < 0 || volumeValue > 100) {
            return { success: false, message: 'El volumen debe estar entre 0% y 100%' };
        }
        
        this.currentVideo.volume = volumeValue / 100;
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValueElement = document.getElementById('volumeValue');
        if (volumeSlider) {
            volumeSlider.value = volumeValue;
        }
        if (volumeValueElement) {
            volumeValueElement.textContent = `${volumeValue}%`;
        }
        
        return { 
            success: true, 
            message: `Volumen ajustado a ${volumeValue}%`,
            volume: volumeValue
        };
    }
    
    rotateVideoByDegrees(degrees) {
        if (!this.currentVideo) {
            return { success: false, message: 'No hay video cargado' };
        }
        
        if (![90, 180, 270, 360].includes(parseInt(degrees))) {
            return { success: false, message: 'Solo se permiten rotaciones de 90°, 180°, 270° o 360°' };
        }
        
        // Establecer rotación absoluta en lugar de sumar
        const currentTransform = this.currentVideo.style.transform || '';
        const otherTransforms = currentTransform.replace(/rotate\([^)]+\)/g, '').trim();
        this.currentVideo.style.transform = `rotate(${degrees}deg) ${otherTransforms}`.trim();
        this.showStatus(`Video rotado ${degrees}°`);
        
        // Actualizar análisis dinámico
        this.updateDynamicAnalysis();
        
        return { 
            success: true, 
            message: `Video rotado ${degrees}°`,
            degrees: parseInt(degrees)
        };
    }
    
    flipVideoDirection(direction) {
        if (!this.currentVideo) {
            return { success: false, message: 'No hay video cargado' };
        }
        
        const directionMap = {
            'horizontal': 'horizontal',
            'h': 'horizontal',
            'vertical': 'vertical',
            'v': 'vertical'
        };
        
        const flipDirection = directionMap[direction.toLowerCase()];
        if (!flipDirection) {
            return { success: false, message: 'Dirección debe ser "horizontal" o "vertical"' };
        }
        
        this.flipVideo(flipDirection);
        
        return { 
            success: true, 
            message: `Video volteado ${flipDirection}mente`,
            direction: flipDirection
        };
    }
    
    applyRandomFilters(count = null) {
        if (!this.currentVideo) {
            return { success: false, message: 'No hay video cargado' };
        }
        
        const availableFilters = ['brightness', 'contrast', 'saturate', 'blur', 'sepia', 'grayscale', 'invert', 'hue-rotate'];
        const filterCount = count || Math.floor(Math.random() * 3) + 1; // 1-3 filtros aleatorios
        
        // Limpiar filtros existentes
        this.clearFilters();
        
        const appliedFilters = [];
        const selectedFilters = [];
        
        // Seleccionar filtros aleatorios únicos
        for (let i = 0; i < Math.min(filterCount, availableFilters.length); i++) {
            let randomFilter;
            do {
                randomFilter = availableFilters[Math.floor(Math.random() * availableFilters.length)];
            } while (selectedFilters.includes(randomFilter));
            
            selectedFilters.push(randomFilter);
            
            // Generar valor aleatorio dentro del rango del filtro
            const config = this.getFilterConfig(randomFilter);
            const randomValue = this.generateRandomValue(randomFilter, config);
            
            // Aplicar filtro
            this.currentFilters[randomFilter] = this.buildFilterValue(randomFilter, randomValue);
            
            // Activar botón visual
            const filterBtn = document.querySelector(`[data-filter="${randomFilter}"]`);
            if (filterBtn) {
                filterBtn.classList.add('active');
            }
            
            appliedFilters.push(`${this.getFilterDisplayName(randomFilter)} (${randomValue})`);
        }
        
        this.updateVideoFilters();
        
        return {
            success: true,
            message: `Filtros aleatorios aplicados: ${appliedFilters.join(', ')}`,
            filters: selectedFilters,
            count: selectedFilters.length
        };
    }
    
    generateRandomValue(filterType, config) {
        const { min, max, step } = config;
        
        switch(filterType) {
            case 'brightness':
            case 'contrast':
                return Math.round((Math.random() * (2.5 - 0.8) + 0.8) / step) * step;
            case 'saturate':
                return Math.round((Math.random() * (2.0 - 0.5) + 0.5) / step) * step;
            case 'blur':
                return Math.round((Math.random() * (5 - 0.5) + 0.5) / step) * step;
            case 'sepia':
            case 'grayscale':
            case 'invert':
                return Math.round((Math.random() * (1 - 0.3) + 0.3) / step) * step;
            case 'hue-rotate':
                return Math.round((Math.random() * (360 - 0) + 0) / step) * step;
            default:
                return Math.round((Math.random() * (max - min) + min) / step) * step;
        }
    }
    
    getFilterDisplayName(filterType) {
        const names = {
            'brightness': 'Brillo',
            'contrast': 'Contraste',
            'saturate': 'Saturación',
            'blur': 'Desenfoque',
            'sepia': 'Sepia',
            'grayscale': 'Escala de Grises',
            'invert': 'Invertir',
            'hue-rotate': 'Matiz'
        };
        return names[filterType] || filterType;
    }
    
    applyFilterCombination(combinationName) {
        if (!this.currentVideo) {
            return { success: false, message: 'No hay video cargado' };
        }
        
        const combinations = {
            'vintage': [
                { filter: 'sepia', value: 0.8 },
                { filter: 'contrast', value: 1.2 },
                { filter: 'brightness', value: 1.1 }
            ],
            'cinematico': [
                { filter: 'contrast', value: 1.3 },
                { filter: 'saturate', value: 1.2 },
                { filter: 'brightness', value: 0.9 }
            ],
            'dramatico': [
                { filter: 'contrast', value: 1.5 },
                { filter: 'brightness', value: 0.8 },
                { filter: 'saturate', value: 1.4 }
            ],
            'suave': [
                { filter: 'brightness', value: 1.2 },
                { filter: 'blur', value: 1 },
                { filter: 'saturate', value: 0.8 }
            ],
            'vibrante': [
                { filter: 'saturate', value: 1.6 },
                { filter: 'contrast', value: 1.2 },
                { filter: 'hue-rotate', value: 15 }
            ]
        };
        
        const combination = combinations[combinationName.toLowerCase()];
        if (!combination) {
            return { success: false, message: `Combinación "${combinationName}" no encontrada` };
        }
        
        this.clearFilters();
        const appliedFilters = [];
        
        combination.forEach(({ filter, value }) => {
            this.currentFilters[filter] = this.buildFilterValue(filter, value);
            
            const filterBtn = document.querySelector(`[data-filter="${filter}"]`);
            if (filterBtn) {
                filterBtn.classList.add('active');
            }
            
            appliedFilters.push(`${this.getFilterDisplayName(filter)} (${value})`);
        });
        
        this.updateVideoFilters();
        
        return {
            success: true,
            message: `Combinación "${combinationName}" aplicada: ${appliedFilters.join(', ')}`,
            combination: combinationName,
            filters: appliedFilters
        };
    }
    
    applyRecommendedFilters() {
        if (!this.currentVideo) {
            return { success: false, message: 'No hay video cargado' };
        }
        
        const recommendations = ['cinematico', 'vibrante', 'dramatico', 'vintage', 'suave'];
        const randomRecommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
        
        return this.applyFilterCombination(randomRecommendation);
    }

    analyzeVideo() {
        if (!this.currentVideo) {
            this.showStatus('No hay video cargado para analizar');
            return;
        }
        
        this.showStatus('Analizando video...', true);
        this.analyzeVideoAuto();
    }
    
    analyzeVideoAuto() {
        if (!this.currentVideo) return;
        
        const videoInfo = this.extractVideoMetadata();
        const analysisPanel = document.getElementById('videoAnalysis');
        if (analysisPanel) {
            analysisPanel.style.display = 'block';
        }
        
        this.updateAnalysisDisplay(videoInfo);
        
        setTimeout(() => {
            this.generateColorHistogram();
        }, 300);
    }
    
    extractVideoMetadata() {
        const video = this.currentVideo;
        const file = this.currentFile;
        
        return {
            width: video.videoWidth || 0,
            height: video.videoHeight || 0,
            duration: video.duration || 0,
            framerate: this.estimateFramerate(),
            format: this.getVideoFormat(file ? file.name : video.src),
            filesize: file ? file.size : 0,
            bitrate: this.calculateBitrate(file ? file.size : 0, video.duration || 0)
        };
    }
    
    getFileFromSrc(src) {
        // Intentar obtener información del archivo desde el blob URL
        if (src.startsWith('blob:')) {
            // Para blob URLs, no podemos obtener el tamaño exacto
            return null;
        }
        return null;
    }
    
    estimateFramerate() {
        // Estimación básica de FPS (en un entorno real se usaría MediaInfo API)
        const duration = this.currentVideo.duration;
        if (duration > 0) {
            // Estimación común para videos web
            return duration > 60 ? '24-30' : '30';
        }
        return 'N/A';
    }
    
    getVideoFormat(src) {
        if (src.includes('.mp4')) return 'MP4';
        if (src.includes('.webm')) return 'WebM';
        if (src.includes('.avi')) return 'AVI';
        if (src.includes('.mov')) return 'MOV';
        return 'Desconocido';
    }
    
    calculateBitrate(filesize, duration) {
        if (filesize && duration > 0) {
            const bitrateKbps = (filesize * 8) / (duration * 1000);
            return `${Math.round(bitrateKbps)} kbps`;
        }
        return 'N/A';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return 'N/A';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    updateAnalysisDisplay(info) {
        const elements = {
            'resolution': `${info.width}x${info.height}`,
            'framerate': `${info.framerate} fps`,
            'duration': this.formatDuration(info.duration),
            'format': info.format,
            'filesize': this.formatFileSize(info.filesize),
            'bitrate': info.bitrate
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    generateColorHistogram() {
        const canvas = document.getElementById('colorHistogram');
        if (!canvas || !this.currentVideo) return;
        
        const ctx = canvas.getContext('2d');
        const video = this.currentVideo;
        
        // Crear canvas temporal para análisis
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Configurar dimensiones para análisis
        const analysisWidth = 160;
        const analysisHeight = 90;
        tempCanvas.width = analysisWidth;
        tempCanvas.height = analysisHeight;
        
        // Capturar frame actual del video
        tempCtx.drawImage(video, 0, 0, analysisWidth, analysisHeight);
        
        // Obtener datos de píxeles
        const imageData = tempCtx.getImageData(0, 0, analysisWidth, analysisHeight);
        const data = imageData.data;
        
        // Inicializar histogramas RGB
        const histR = new Array(256).fill(0);
        const histG = new Array(256).fill(0);
        const histB = new Array(256).fill(0);
        
        // Calcular histogramas
        for (let i = 0; i < data.length; i += 4) {
            histR[data[i]]++;
            histG[data[i + 1]]++;
            histB[data[i + 2]]++;
        }
        
        // Normalizar valores
        const maxR = Math.max(...histR);
        const maxG = Math.max(...histG);
        const maxB = Math.max(...histB);
        
        // Dibujar histograma
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = canvas.width / 256;
        const maxHeight = canvas.height - 20;
        
        // Dibujar histograma RGB
        for (let i = 0; i < 256; i++) {
            const x = i * barWidth;
            
            // Canal Rojo
            const heightR = (histR[i] / maxR) * maxHeight * 0.8;
            ctx.fillStyle = `rgba(255, 100, 100, 0.7)`;
            ctx.fillRect(x, canvas.height - heightR, barWidth, heightR);
            
            // Canal Verde
            const heightG = (histG[i] / maxG) * maxHeight * 0.8;
            ctx.fillStyle = `rgba(100, 255, 100, 0.7)`;
            ctx.fillRect(x, canvas.height - heightG, barWidth, heightG);
            
            // Canal Azul
            const heightB = (histB[i] / maxB) * maxHeight * 0.8;
            ctx.fillStyle = `rgba(100, 100, 255, 0.7)`;
            ctx.fillRect(x, canvas.height - heightB, barWidth, heightB);
        }
        
        // Agregar etiquetas compactas
        ctx.fillStyle = '#888888';
        ctx.font = '8px monospace';
        ctx.fillText('RGB', 5, 12);
        ctx.fillText('0', 5, canvas.height - 2);
        ctx.fillText('255', canvas.width - 15, canvas.height - 2);
    }
    
    updateDynamicAnalysis() {
        if (!this.currentVideo) return;
        
        // Actualizar FPS efectivo basado en velocidad
        const currentSpeed = this.currentVideo.playbackRate || 1;
        const baseFps = 30;
        const effectiveFps = Math.round(baseFps * currentSpeed);
        
        const fpsElement = document.getElementById('framerate');
        if (fpsElement) {
            fpsElement.textContent = `${effectiveFps} fps`;
            if (currentSpeed !== 1) {
                fpsElement.style.color = '#ffaa00'; // Naranja para indicar cambio
            } else {
                fpsElement.style.color = '#e0e0e0'; // Color normal
            }
        }
        
        // Actualizar peso estimado basado en filtros y transformaciones
        const originalSize = this.currentFile ? this.currentFile.size : 0;
        const filterCount = Object.keys(this.currentFilters).length;
        const hasTransforms = this.currentVideo.style.transform !== '';
        
        let sizeMultiplier = 1;
        if (filterCount > 0) sizeMultiplier += filterCount * 0.15; // +15% por filtro
        if (hasTransforms) sizeMultiplier += 0.1; // +10% por transformaciones
        if (currentSpeed !== 1) sizeMultiplier += Math.abs(currentSpeed - 1) * 0.2; // Cambio por velocidad
        
        const estimatedSize = Math.round(originalSize * sizeMultiplier);
        const sizeElement = document.getElementById('filesize');
        if (sizeElement) {
            sizeElement.textContent = this.formatFileSize(estimatedSize);
            if (sizeMultiplier > 1.1) {
                sizeElement.style.color = '#ff6666'; // Rojo para aumento significativo
            } else if (sizeMultiplier > 1.05) {
                sizeElement.style.color = '#ffaa00'; // Naranja para aumento moderado
            } else {
                sizeElement.style.color = '#e0e0e0'; // Color normal
            }
        }
        
        // Actualizar histograma de colores si hay filtros aplicados
        if (filterCount > 0) {
            setTimeout(() => {
                this.generateColorHistogram();
            }, 100);
        }
        
        // Actualizar bitrate estimado
        const duration = this.currentVideo.duration || 0;
        if (duration > 0) {
            const estimatedBitrate = Math.round((estimatedSize * 8) / (duration * 1000));
            const bitrateElement = document.getElementById('bitrate');
            if (bitrateElement) {
                bitrateElement.textContent = `${estimatedBitrate} kbps`;
                if (sizeMultiplier > 1.1) {
                    bitrateElement.style.color = '#ff6666';
                } else if (sizeMultiplier > 1.05) {
                    bitrateElement.style.color = '#ffaa00';
                } else {
                    bitrateElement.style.color = '#e0e0e0';
                }
            }
        }
    }
    
    showStatus(message, isLoading = false) {
        let statusDiv = document.getElementById('status-message');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'status-message';
            statusDiv.style.cssText = `
                position: fixed;
                top: 24px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(145deg, #404040 0%, #303030 100%);
                color: #e0e0e0;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 1000;
                font-size: 0.875rem;
                font-weight: 500;
                border: 1px solid #555555;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(statusDiv);
        }
        
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        
        if (!isLoading) {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Evitar atajos si se está escribiendo en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const key = e.key.toLowerCase();
        
        switch(key) {
            case 'o': // Pantalla completa
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case ' ': // Espacio - Play/Pause
                e.preventDefault();
                this.playPause();
                break;
            case 'arrowleft': // Flecha izquierda - Retroceder 10s
                e.preventDefault();
                this.seekVideo(-10);
                break;
            case 'arrowright': // Flecha derecha - Avanzar 10s
                e.preventDefault();
                this.seekVideo(10);
                break;
            case 'arrowup': // Flecha arriba - Subir volumen
                e.preventDefault();
                this.adjustVolume(10);
                break;
            case 'arrowdown': // Flecha abajo - Bajar volumen
                e.preventDefault();
                this.adjustVolume(-10);
                break;
            case 'r': // R - Filtros aleatorios
                e.preventDefault();
                this.applyRandomFilters();
                break;
            case 'c': // C - Limpiar filtros
                e.preventDefault();
                this.clearFilters();
                break;
            case 's': // S - Parar video
                e.preventDefault();
                this.stopVideo();
                break;
            case 'z': // Ctrl+Z - Deshacer
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.undo();
                }
                break;
            case 'y': // Ctrl+Y - Rehacer
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.redo();
                }
                break;
        }
    }
    
    toggleFullscreen() {
        if (!this.currentVideo) {
            this.showStatus('No hay video cargado');
            return;
        }
        
        const videoContainer = document.getElementById('videoContainer');
        
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().then(() => {
                this.showStatus('Pantalla completa activada (O para salir)');
            }).catch(() => {
                this.showStatus('Error al activar pantalla completa');
            });
        } else {
            document.exitFullscreen().then(() => {
                this.showStatus('Pantalla completa desactivada');
            });
        }
    }
    
    adjustVolume(change) {
        if (!this.currentVideo) return;
        
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            const currentVolume = parseInt(volumeSlider.value);
            const newVolume = Math.max(0, Math.min(100, currentVolume + change));
            volumeSlider.value = newVolume;
            this.changeVolume(newVolume);
        }
    }
    
    saveState() {
        if (!this.currentVideo) return;
        
        const state = {
            filters: { ...this.currentFilters },
            transform: this.currentVideo.style.transform || '',
            timestamp: Date.now()
        };
        
        // Eliminar estados futuros si estamos en el medio del historial
        if (this.historyIndex < this.videoHistory.length - 1) {
            this.videoHistory = this.videoHistory.slice(0, this.historyIndex + 1);
        }
        
        this.videoHistory.push(state);
        
        // Limitar el tamaño del historial
        if (this.videoHistory.length > this.maxHistorySize) {
            this.videoHistory.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (!this.currentVideo || this.historyIndex <= 0) return;
        
        this.historyIndex--;
        this.restoreState(this.videoHistory[this.historyIndex]);
        this.showStatus('Cambio deshecho');
    }
    
    redo() {
        if (!this.currentVideo || this.historyIndex >= this.videoHistory.length - 1) return;
        
        this.historyIndex++;
        this.restoreState(this.videoHistory[this.historyIndex]);
        this.showStatus('Cambio rehecho');
    }
    
    restoreState(state) {
        // Restaurar filtros
        this.currentFilters = { ...state.filters };
        this.updateVideoFilters();
        
        // Restaurar transformaciones
        this.currentVideo.style.transform = state.transform;
        
        // Actualizar botones de filtros
        document.querySelectorAll('[data-filter]').forEach(btn => {
            const filterType = btn.dataset.filter;
            if (this.currentFilters[filterType]) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.updateUndoRedoButtons();
        this.updateDynamicAnalysis();
    }
    
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
        }
        
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.videoHistory.length - 1;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.videoEditor = new VideoEditor();
    window.videoEditor.updateSelectVideoButton();
    
    // Hacer métodos accesibles globalmente para el chatbot
    window.applyFilter = (filterName, value) => {
        return window.videoEditor.applyFilterByName(filterName, value);
    };
    
    window.removeFilter = (filterName) => {
        return window.videoEditor.removeFilterByName(filterName);
    };
    
    window.changeVideoSpeed = (speed) => {
        return window.videoEditor.changeSpeed(speed);
    };
    
    window.changeVideoVolume = (volume) => {
        return window.videoEditor.changeVolume(volume);
    };
    
    window.rotateVideo = (degrees) => {
        return window.videoEditor.rotateVideoByDegrees(degrees);
    };
    
    window.flipVideo = (direction) => {
        return window.videoEditor.flipVideoDirection(direction);
    };
    
    window.clearAllFilters = () => {
        window.videoEditor.clearFilters();
        return { success: true, message: 'Todos los filtros eliminados' };
    };
    
    window.applyRandomFilters = (count) => {
        return window.videoEditor.applyRandomFilters(count);
    };
    
    window.splitVideo = () => {
        window.videoEditor.splitAtCurrentTime();
        return { success: true, message: 'Video dividido en el tiempo actual' };
    };
    
    window.getSplitInfo = () => {
        return {
            success: true,
            segments: window.videoEditor.splitSegments.length + 1,
            splitPoints: window.videoEditor.splitSegments.length
        };
    };
    
    window.getAvailableFilters = () => {
        return window.videoEditor.getAvailableFilters();
    };
    
    window.applyFilterCombination = (combinationName) => {
        return window.videoEditor.applyFilterCombination(combinationName);
    };
    
    window.applyRecommendedFilters = () => {
        return window.videoEditor.applyRecommendedFilters();
    };
    
    window.analyzeVideo = () => {
        if (!window.videoEditor.currentVideo) {
            return { success: false, message: 'No hay video cargado para analizar' };
        }
        
        window.videoEditor.analyzeVideo();
        return { success: true, message: 'Análisis técnico iniciado' };
    };
});