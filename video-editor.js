class VideoEditor {
    constructor() {
        this.currentVideo = null;
        this.isPlaying = false;
        this.currentFilters = {};
        this.videoHistory = [];
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
            'clearFilters': () => this.clearFilters()
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
        
        // Filter modal controls
        const filterModalSlider = document.getElementById('filterModalSlider');
        const filterModalInput = document.getElementById('filterModalInput');
        const filterModalApply = document.getElementById('filterModalApply');
        const filterModalCancel = document.getElementById('filterModalCancel');
        const filterModalClose = document.getElementById('filterModalClose');
        const filterModal = document.getElementById('filterModal');
        
        if (filterModalSlider && filterModalInput) {
            filterModalSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                filterModalInput.value = value;
                // Update filter in real time
                if (this.currentFilterType) {
                    this.updateFilterPreview(this.currentFilterType, value);
                }
            });
            
            filterModalInput.addEventListener('input', (e) => {
                const value = e.target.value;
                filterModalSlider.value = value;
                // Update filter in real time
                if (this.currentFilterType) {
                    this.updateFilterPreview(this.currentFilterType, value);
                }
            });
        }
        
        if (filterModalApply) {
            filterModalApply.addEventListener('click', () => this.applyFilterFromModal());
        }
        
        if (filterModalCancel) {
            filterModalCancel.addEventListener('click', () => this.closeFilterModal());
        }
        
        if (filterModalClose) {
            filterModalClose.addEventListener('click', () => this.closeFilterModal());
        }
        
        // Make modal draggable
        this.makeDraggable(document.querySelector('.filter-modal-content'));
        
        // Timeline tools
        this.currentTool = 'select';
        this.splitPoints = [];
        this.videoSegments = [];
        this.currentSegment = 0;
        
        document.getElementById('selectTool')?.addEventListener('click', () => this.setTimelineTool('select'));
        document.getElementById('splitTool')?.addEventListener('click', () => this.setTimelineTool('split'));
        document.getElementById('trimTool')?.addEventListener('click', () => this.trimSelection());
        document.getElementById('deleteTool')?.addEventListener('click', () => this.deleteSelection());
        document.getElementById('prevSegment')?.addEventListener('click', () => this.previousSegment());
        document.getElementById('nextSegment')?.addEventListener('click', () => this.nextSegment());
        document.getElementById('resetTool')?.addEventListener('click', () => this.resetEdits());
        
        // Set default tool
        document.getElementById('selectTool')?.classList.add('active');
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

        // Event listeners
        video.addEventListener('loadedmetadata', () => {
            this.showStatus(`Video cargado: ${file.name} (${this.formatDuration(video.duration)})`);
        });
        
        video.addEventListener('loadeddata', () => {
            // Generar timeline cuando el video esté listo para reproducir
            setTimeout(() => this.updateTimeline(), 100);
        });

        video.addEventListener('timeupdate', () => this.updateProgress());

        // Enable controls
        this.enableControls();
        
        // Update button text
        this.updateSelectVideoButton();
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

    updateTimeline() {
        if (!this.currentVideo) return;
        
        this.createTimelineRuler();
        this.generateThumbnails();
        this.updateTimeDisplay();
        this.setupTimelineInteraction();
    }
    
    async generateThumbnails() {
        if (!this.currentVideo) return;
        
        const thumbnailsContainer = document.getElementById('timelineThumbnails');
        if (!thumbnailsContainer) return;
        
        thumbnailsContainer.innerHTML = '';
        
        const duration = this.currentVideo.duration;
        const containerWidth = thumbnailsContainer.offsetWidth;
        const thumbnailInterval = 1; // 1 segundo por thumbnail
        const thumbnailCount = Math.ceil(duration / thumbnailInterval);
        const thumbnailWidth = containerWidth / thumbnailCount;
        
        // Canvas para capturar frames
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 160; // Ancho fijo para thumbnails
        canvas.height = 90;  // Alto fijo (16:9 ratio)
        
        for (let i = 0; i < thumbnailCount; i++) {
            const time = i * thumbnailInterval;
            const thumbnail = await this.captureThumbnail(canvas, ctx, time);
            
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'timeline-thumbnail';
            thumbnailDiv.style.width = thumbnailWidth + 'px';
            thumbnailDiv.style.backgroundImage = `url(${thumbnail})`;
            
            thumbnailsContainer.appendChild(thumbnailDiv);
        }
    }
    
    captureThumbnail(canvas, ctx, time) {
        return new Promise((resolve) => {
            const video = this.currentVideo;
            const originalTime = video.currentTime;
            
            const onSeeked = () => {
                // Aplicar filtros y transformaciones al canvas
                ctx.save();
                
                // Aplicar filtros
                ctx.filter = video.style.filter || 'none';
                
                // Dibujar el frame
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                ctx.restore();
                
                // Convertir a data URL
                const dataURL = canvas.toDataURL('image/jpeg', 0.7);
                
                video.removeEventListener('seeked', onSeeked);
                video.currentTime = originalTime;
                
                resolve(dataURL);
            };
            
            video.addEventListener('seeked', onSeeked);
            video.currentTime = time;
        });
    }
    
    async generateSegmentThumbnails(container, segment) {
        if (!this.currentVideo) return;
        
        const segmentDuration = segment.end - segment.start;
        const thumbnailInterval = Math.max(0.5, segmentDuration / 5); // Máximo 5 thumbnails por segmento
        const thumbnailCount = Math.min(5, Math.ceil(segmentDuration / thumbnailInterval));
        
        // Canvas para capturar frames
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 80;
        canvas.height = 45;
        
        for (let i = 0; i < thumbnailCount; i++) {
            const time = segment.start + (i * thumbnailInterval);
            if (time >= segment.end) break;
            
            const thumbnail = await this.captureThumbnail(canvas, ctx, time);
            
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'timeline-thumbnail';
            thumbnailDiv.style.flex = '1';
            thumbnailDiv.style.backgroundImage = `url(${thumbnail})`;
            thumbnailDiv.style.backgroundSize = 'cover';
            thumbnailDiv.style.backgroundPosition = 'center';
            thumbnailDiv.style.borderRight = i < thumbnailCount - 1 ? '1px solid #404040' : 'none';
            
            container.appendChild(thumbnailDiv);
        }
    }
    
    createTimelineRuler() {
        const ruler = document.getElementById('timelineRuler');
        const markers = document.getElementById('timelineMarkers');
        if (!ruler || !markers || !this.currentVideo) return;
        
        ruler.innerHTML = '';
        markers.innerHTML = '';
        
        const duration = this.currentVideo.duration;
        const rulerWidth = ruler.offsetWidth;
        const interval = duration > 60 ? 10 : 5; // seconds
        
        for (let time = 0; time <= duration; time += interval) {
            const position = (time / duration) * rulerWidth;
            
            // Ruler marks
            const mark = document.createElement('div');
            mark.className = 'timeline-ruler-mark';
            mark.style.left = position + 'px';
            ruler.appendChild(mark);
            
            // Time labels
            const label = document.createElement('div');
            label.className = 'timeline-ruler-label';
            label.style.left = (position + 2) + 'px';
            label.textContent = this.formatTime(time);
            ruler.appendChild(label);
            
            // Timeline markers
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            marker.style.left = position + 'px';
            markers.appendChild(marker);
        }
    }
    
    setupTimelineInteraction() {
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        
        let isSelecting = false;
        let selectionStart = 0;
        
        track.addEventListener('mousedown', (e) => {
            const rect = track.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const time = percentage * this.currentVideo.duration;
            
            if (this.currentTool === 'select') {
                isSelecting = true;
                selectionStart = percentage;
                this.startFragmentSelection(percentage);
            } else if (this.currentTool === 'split') {
                this.addSplitPoint(time);
            } else {
                this.currentVideo.currentTime = time;
            }
        });
        
        track.addEventListener('mousemove', (e) => {
            if (isSelecting && this.currentTool === 'select') {
                const rect = track.getBoundingClientRect();
                const currentX = e.clientX - rect.left;
                const percentage = currentX / rect.width;
                this.updateFragmentSelection(selectionStart, percentage);
            }
        });
        
        track.addEventListener('mouseup', () => {
            if (isSelecting && this.currentTool === 'select') {
                this.finalizeFragmentSelection();
            }
            isSelecting = false;
        });
    }
    
    startFragmentSelection(start) {
        this.fragmentSelectionStart = start;
        this.fragmentSelectionEnd = start;
        this.showStatus('Arrastra para seleccionar fragmento');
    }
    
    updateFragmentSelection(start, end) {
        this.fragmentSelectionStart = Math.min(start, end);
        this.fragmentSelectionEnd = Math.max(start, end);
        
        const startTime = this.fragmentSelectionStart * this.currentVideo.duration;
        const endTime = this.fragmentSelectionEnd * this.currentVideo.duration;
        
        this.showStatus(`Seleccionando: ${this.formatTime(startTime)} - ${this.formatTime(endTime)}`);
    }
    
    finalizeFragmentSelection() {
        if (!this.fragmentSelectionStart || !this.fragmentSelectionEnd) return;
        
        const startTime = this.fragmentSelectionStart * this.currentVideo.duration;
        const endTime = this.fragmentSelectionEnd * this.currentVideo.duration;
        
        this.selectedFragment = {
            start: this.fragmentSelectionStart,
            end: this.fragmentSelectionEnd,
            startTime: startTime,
            endTime: endTime
        };
        
        this.showSelectedFragment();
        this.showStatus(`Fragmento seleccionado: ${this.formatTime(startTime)} - ${this.formatTime(endTime)}`);
    }
    
    showSelectedFragment() {
        const selection = document.getElementById('timelineSelection');
        if (!selection || !this.selectedFragment) return;
        
        selection.style.display = 'block';
        selection.style.left = (this.selectedFragment.start * 100) + '%';
        selection.style.width = ((this.selectedFragment.end - this.selectedFragment.start) * 100) + '%';
        selection.style.backgroundColor = 'rgba(102, 126, 234, 0.3)';
        selection.style.border = '2px solid #667eea';
    }
    
    updateTimeDisplay() {
        if (!this.currentVideo) return;
        
        const currentTime = document.getElementById('currentTime');
        const totalTime = document.getElementById('totalTime');
        
        if (currentTime) currentTime.textContent = this.formatTime(this.currentVideo.currentTime);
        if (totalTime) totalTime.textContent = this.formatTime(this.currentVideo.duration);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    trimSelection() {
        if (!this.selectedFragment || !this.currentVideo) {
            this.showStatus('Selecciona un fragmento primero');
            return;
        }
        
        this.trimStart = this.selectedFragment.startTime;
        this.trimEnd = this.selectedFragment.endTime;
        
        this.currentVideo.currentTime = this.selectedFragment.startTime;
        this.setupTrimmedPlayback();
        
        this.showStatus(`Video recortado: ${this.formatTime(this.selectedFragment.startTime)} - ${this.formatTime(this.selectedFragment.endTime)}`);
    }
    
    deleteSelection() {
        if (!this.selectedFragment || !this.currentVideo) {
            this.showStatus('Selecciona un fragmento primero');
            return;
        }
        
        this.deletedSegments = this.deletedSegments || [];
        this.deletedSegments.push({ 
            start: this.selectedFragment.startTime, 
            end: this.selectedFragment.endTime 
        });
        
        const selection = document.getElementById('timelineSelection');
        if (selection) selection.style.display = 'none';
        
        const deletedTime = `${this.formatTime(this.selectedFragment.startTime)} - ${this.formatTime(this.selectedFragment.endTime)}`;
        this.selectedFragment = null;
        
        this.setupSegmentedPlayback();
        this.showStatus(`Fragmento eliminado: ${deletedTime}`);
    }
    
    setupTrimmedPlayback() {
        if (!this.currentVideo || !this.trimStart || !this.trimEnd) return;
        
        const video = this.currentVideo;
        
        // Remove existing listener
        video.removeEventListener('timeupdate', this.trimmedPlaybackHandler);
        
        // Create new handler
        this.trimmedPlaybackHandler = () => {
            if (video.currentTime < this.trimStart) {
                video.currentTime = this.trimStart;
            } else if (video.currentTime >= this.trimEnd) {
                video.pause();
                video.currentTime = this.trimStart;
                this.isPlaying = false;
                document.getElementById('playBtn').textContent = 'Play';
            }
        };
        
        video.addEventListener('timeupdate', this.trimmedPlaybackHandler);
    }
    
    setupSegmentedPlayback() {
        if (!this.currentVideo || !this.deletedSegments?.length) return;
        
        const video = this.currentVideo;
        
        // Remove existing listener
        video.removeEventListener('timeupdate', this.segmentedPlaybackHandler);
        
        // Create new handler
        this.segmentedPlaybackHandler = () => {
            const currentTime = video.currentTime;
            
            // Check if current time is in a deleted segment
            for (const segment of this.deletedSegments) {
                if (currentTime >= segment.start && currentTime < segment.end) {
                    // Skip to end of deleted segment
                    video.currentTime = segment.end;
                    break;
                }
            }
        };
        
        video.addEventListener('timeupdate', this.segmentedPlaybackHandler);
    }
    
    resetEdits() {
        if (!this.currentVideo) return;
        
        // Clear trim points
        this.trimStart = null;
        this.trimEnd = null;
        
        // Clear deleted segments
        this.deletedSegments = [];
        
        // Clear split points and segments
        this.splitPoints = [];
        this.videoSegments = [];
        this.currentSegment = 0;
        
        // Remove event listeners
        if (this.trimmedPlaybackHandler) {
            this.currentVideo.removeEventListener('timeupdate', this.trimmedPlaybackHandler);
        }
        if (this.segmentedPlaybackHandler) {
            this.currentVideo.removeEventListener('timeupdate', this.segmentedPlaybackHandler);
        }
        if (this.segmentPlaybackHandler) {
            this.currentVideo.removeEventListener('timeupdate', this.segmentPlaybackHandler);
        }
        
        // Hide selection and remove split markers
        const selection = document.getElementById('timelineSelection');
        if (selection) selection.style.display = 'none';
        
        const track = document.getElementById('timelineTrack');
        if (track) {
            track.querySelectorAll('.timeline-split').forEach(marker => marker.remove());
        }
        
        this.showStatus('Ediciones de timeline restablecidas');
    }

    updateProgress() {
        if (!this.currentVideo) return;
        
        const progress = (this.currentVideo.currentTime / this.currentVideo.duration) * 100;
        const progressFill = document.getElementById('progressFill');
        const timelineCursor = document.getElementById('timelineCursor');
        
        if (progressFill) progressFill.style.width = progress + '%';
        if (timelineCursor) timelineCursor.style.left = progress + '%';
        
        this.updateTimeDisplay();
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
        this.showStatus(`Volumen ajustado a ${value}%`);
    }

    changeSpeed(value) {
        if (!this.currentVideo) return;
        this.currentVideo.playbackRate = parseFloat(value);
        this.showStatus(`Velocidad ajustada a ${value}x`);
    }



    rotateVideo(degrees) {
        if (!this.currentVideo) return;
        
        const currentRotation = this.currentVideo.style.transform.match(/rotate\((\d+)deg\)/);
        const rotation = currentRotation ? parseInt(currentRotation[1]) + degrees : degrees;
        
        this.currentVideo.style.transform = `rotate(${rotation}deg)`;
        this.showStatus(`Video rotado ${degrees}°`);
    }

    flipVideo(direction) {
        if (!this.currentVideo) return;
        
        const transform = direction === 'horizontal' ? 'scaleX(-1)' : 'scaleY(-1)';
        this.currentVideo.style.transform += ` ${transform}`;
        this.showStatus(`Video volteado ${direction}mente`);
    }

    applyFilter(filterType) {
        if (!this.currentVideo) return;
        
        const filterBtn = document.querySelector(`[data-filter="${filterType}"]`);
        
        if (this.currentFilters[filterType]) {
            // Remove filter if already applied
            delete this.currentFilters[filterType];
            filterBtn?.classList.remove('active');
            this.showStatus(`Filtro ${filterType} removido`);
            this.updateVideoFilters();
        } else {
            // Open modal to configure filter
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
    }
    
    closeFilterModal() {
        document.getElementById('filterModal').style.display = 'none';
        this.currentFilterType = null;
    }
    
    setTimelineTool(tool) {
        this.currentTool = tool;
        
        // Update button states
        document.querySelectorAll('.timeline-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const toolButtons = {
            'select': 'selectTool',
            'split': 'splitTool'
        };
        
        if (toolButtons[tool]) {
            document.getElementById(toolButtons[tool])?.classList.add('active');
        }
    }
    
    addSplitPoint(time) {
        if (!this.currentVideo) return;
        
        // Evitar duplicados
        if (this.splitPoints.includes(time)) return;
        
        this.splitPoints.push(time);
        this.splitPoints.sort((a, b) => a - b);
        
        // Crear segmentos basados en los puntos de división
        this.createVideoSegments();
        this.renderSplitPoints();
        this.showStatus(`Video dividido en ${this.formatTime(time)}`);
    }
    
    createVideoSegments() {
        if (!this.currentVideo || this.splitPoints.length === 0) {
            this.videoSegments = [{ start: 0, end: this.currentVideo?.duration || 0 }];
            return;
        }
        
        this.videoSegments = [];
        const duration = this.currentVideo.duration;
        
        // Primer segmento (desde 0 hasta primer punto)
        this.videoSegments.push({ start: 0, end: this.splitPoints[0] });
        
        // Segmentos intermedios
        for (let i = 0; i < this.splitPoints.length - 1; i++) {
            this.videoSegments.push({
                start: this.splitPoints[i],
                end: this.splitPoints[i + 1]
            });
        }
        
        // Último segmento (desde último punto hasta el final)
        this.videoSegments.push({
            start: this.splitPoints[this.splitPoints.length - 1],
            end: duration
        });
        
        this.currentSegment = 0;
        this.setupSegmentedPlayback();
    }
    
    setupSegmentedPlayback() {
        if (!this.currentVideo || !this.videoSegments) return;
        
        const video = this.currentVideo;
        
        // Remover listener anterior
        if (this.segmentPlaybackHandler) {
            video.removeEventListener('timeupdate', this.segmentPlaybackHandler);
        }
        
        this.segmentPlaybackHandler = () => {
            const currentTime = video.currentTime;
            const segment = this.videoSegments[this.currentSegment];
            
            if (!segment) return;
            
            // Si el tiempo actual está fuera del segmento actual
            if (currentTime < segment.start || currentTime >= segment.end) {
                // Buscar el segmento correcto
                const newSegment = this.videoSegments.findIndex(seg => 
                    currentTime >= seg.start && currentTime < seg.end
                );
                
                if (newSegment !== -1) {
                    this.currentSegment = newSegment;
                } else {
                    // Si llegamos al final del segmento, pausar
                    video.pause();
                    this.isPlaying = false;
                    document.getElementById('playBtn').textContent = 'Play';
                }
            }
        };
        
        video.addEventListener('timeupdate', this.segmentPlaybackHandler);
    }
    
    nextSegment() {
        if (!this.videoSegments || this.currentSegment >= this.videoSegments.length - 1) return;
        
        this.currentSegment++;
        const segment = this.videoSegments[this.currentSegment];
        this.currentVideo.currentTime = segment.start;
        this.renderSplitPoints(); // Actualizar visualización
        this.showStatus(`Segmento ${this.currentSegment + 1} de ${this.videoSegments.length}`);
    }
    
    previousSegment() {
        if (!this.videoSegments || this.currentSegment <= 0) return;
        
        this.currentSegment--;
        const segment = this.videoSegments[this.currentSegment];
        this.currentVideo.currentTime = segment.start;
        this.renderSplitPoints(); // Actualizar visualización
        this.showStatus(`Segmento ${this.currentSegment + 1} de ${this.videoSegments.length}`);
    }
    
    renderSplitPoints() {
        const track = document.getElementById('timelineTrack');
        const thumbnailsContainer = document.getElementById('timelineThumbnails');
        if (!track || !this.currentVideo) return;
        
        // Remover segmentos y marcadores existentes
        track.querySelectorAll('.timeline-split, .timeline-segment').forEach(el => el.remove());
        
        if (this.videoSegments && this.videoSegments.length > 1) {
            // Ocultar thumbnails originales
            if (thumbnailsContainer) thumbnailsContainer.style.display = 'none';
            
            // Crear segmentos visuales con thumbnails
            this.videoSegments.forEach(async (segment, index) => {
                const startPercentage = (segment.start / this.currentVideo.duration) * 100;
                const endPercentage = (segment.end / this.currentVideo.duration) * 100;
                const width = endPercentage - startPercentage;
                
                const segmentDiv = document.createElement('div');
                segmentDiv.className = 'timeline-segment';
                segmentDiv.style.left = startPercentage + '%';
                segmentDiv.style.width = width + '%';
                segmentDiv.title = `Segmento ${index + 1}: ${this.formatTime(segment.start)} - ${this.formatTime(segment.end)}`;
                
                // Crear contenedor de thumbnails para este segmento
                const segmentThumbnails = document.createElement('div');
                segmentThumbnails.className = 'timeline-segment-thumbnails';
                
                // Generar thumbnails para este segmento
                await this.generateSegmentThumbnails(segmentThumbnails, segment);
                
                segmentDiv.appendChild(segmentThumbnails);
                
                // Marcar segmento activo
                if (index === this.currentSegment) {
                    segmentDiv.classList.add('active');
                }
                
                // Click para seleccionar segmento
                segmentDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectSegment(index);
                });
                
                track.appendChild(segmentDiv);
            });
            
            // Agregar marcadores de división
            this.splitPoints.forEach(time => {
                const percentage = (time / this.currentVideo.duration) * 100;
                
                const marker = document.createElement('div');
                marker.className = 'timeline-split';
                marker.style.left = percentage + '%';
                marker.title = `División en ${this.formatTime(time)} - Click para remover`;
                
                marker.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeSplitPoint(time);
                });
                
                track.appendChild(marker);
            });
        } else {
            // Mostrar thumbnails originales si no hay divisiones
            if (thumbnailsContainer) thumbnailsContainer.style.display = 'flex';
        }
    }
    
    selectSegment(index) {
        if (!this.videoSegments || index >= this.videoSegments.length) return;
        
        this.currentSegment = index;
        const segment = this.videoSegments[index];
        this.currentVideo.currentTime = segment.start;
        
        // Actualizar visualización
        this.renderSplitPoints();
        this.showStatus(`Segmento ${index + 1} seleccionado: ${this.formatTime(segment.start)} - ${this.formatTime(segment.end)}`);
    }
    
    removeSplitPoint(time) {
        this.splitPoints = this.splitPoints.filter(t => Math.abs(t - time) > 0.1);
        this.createVideoSegments(); // Recrear segmentos
        this.renderSplitPoints();
        this.showStatus(`Punto de división removido`);
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
    
    getDefaultFilterValue(filterType) {
        const defaults = {
            brightness: 1.3,
            contrast: 1.3,
            saturate: 1.5,
            blur: 2,
            sepia: 1,
            grayscale: 1,
            invert: 1,
            'hue-rotate': 90
        };
        return defaults[filterType] || 1;
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
    
    updateFilterIntensity(filterType, value) {
        if (!this.currentVideo) return;
        
        // Only update if filter is active
        const filterBtn = document.querySelector(`[data-filter="${filterType}"]`);
        if (!filterBtn?.classList.contains('active')) return;
        
        this.currentFilters[filterType] = this.buildFilterValue(filterType, value);
        this.updateVideoFilters();
    }

    clearFilters() {
        if (!this.currentVideo) return;
        
        this.currentFilters = {};
        this.currentVideo.style.filter = '';
        
        // Remove active class from all filter buttons
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.showStatus('Filtros eliminados');
    }

    updateVideoFilters() {
        if (!this.currentVideo) return;
        
        const filterString = Object.values(this.currentFilters).join(' ');
        this.currentVideo.style.filter = filterString;
    }









    async downloadVideo() {
        if (!this.currentVideo) return;
        
        this.showStatus('Procesando video con ediciones...', true);
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const videoWidth = this.currentVideo.videoWidth || 640;
            const videoHeight = this.currentVideo.videoHeight || 480;
            
            // Check if video is rotated 90 or 270 degrees
            const transform = this.currentVideo.style.transform;
            const rotation = transform.match(/rotate\(([^)]+)\)/)?.[1] || '0deg';
            const degrees = parseFloat(rotation);
            const isRotated90 = degrees % 180 !== 0;
            
            // Adjust canvas dimensions for rotation
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
                
                // Apply transformations
                if (transform.includes('rotate')) {
                    const radians = degrees * Math.PI / 180;
                    ctx.translate(canvas.width/2, canvas.height/2);
                    ctx.rotate(radians);
                    ctx.translate(-videoWidth/2, -videoHeight/2);
                }
                
                if (transform.includes('scaleX(-1)')) {
                    ctx.scale(-1, 1);
                    ctx.translate(-videoWidth, 0);
                }
                
                if (transform.includes('scaleY(-1)')) {
                    ctx.scale(1, -1);
                    ctx.translate(0, -videoHeight);
                }
                
                // Apply filters
                ctx.filter = this.currentVideo.style.filter || 'none';
                
                ctx.drawImage(this.currentVideo, 0, 0, videoWidth, videoHeight);
                ctx.restore();
                
                requestAnimationFrame(renderFrame);
            };
            
            this.currentVideo.play();
            renderFrame();
            
        } catch (error) {
            console.error('Error al procesar video:', error);
            this.showStatus('Error al procesar el video. Descargando original...');
            
            // Fallback to original download
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

    showStatus(message, isLoading = false) {
        // Create or update status message
        let statusDiv = document.getElementById('status-message');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'status-message';
            statusDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: white;
                padding: 10px 20px;
                border-radius: 6px;
                z-index: 1000;
                font-size: 0.9rem;
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
}

// Inicializar editor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.videoEditor = new VideoEditor();
    window.videoEditor.updateSelectVideoButton();
});