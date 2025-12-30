// Aplicación principal optimizada
class ColegioApp {
    constructor() {
        this.currentView = 'home';
        this.activeSubject = null;
        this.currentFilters = {};
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        // Cargar iconos
        this.loadIcons();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Inicializar temas
        this.initThemes();
        
        // Verificar autenticación
        this.checkAuth();
        
        // Cargar datos iniciales
        this.loadInitialData();
        
        // Suscribirse a actualizaciones en tiempo real
        this.setupRealtimeUpdates();
    }

    loadIcons() {
        if (window.lucide && window.lucide.createIcons) {
            lucide.createIcons();
        }
    }

    setupEventListeners() {
        // Menú móvil
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => 
            this.toggleMobileMenu()
        );
        
        // Cerrar menús al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#mobile-menu') && !e.target.closest('#mobile-menu-btn')) {
                document.getElementById('mobile-menu')?.classList.add('hidden');
            }
        });
        
        // Prevenir envío de formularios por defecto
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                e.preventDefault();
            }
        });
    }

    initThemes() {
        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        // Botón de tema claro/oscuro (público)
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const current = document.body.classList.contains('dark') ? 'dark' : 'light';
            const newTheme = current === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    setTheme(theme) {
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
        
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.setAttribute('data-lucide', theme === 'dark' ? 'moon' : 'sun');
            this.loadIcons();
        }
    }

    async checkAuth() {
        // La autenticación se maneja en auth.js
        // Solo verificar si hay sesión para mostrar elementos de admin
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.classList.toggle('hidden', !isAdmin);
        });
    }

    async loadInitialData() {
        this.showLoading();
        
        try {
            // Cargar datos en paralelo
            const [subjects, publications, schoolInfo] = await Promise.all([
                dbManager.getSubjects(),
                dbManager.getPublications(3),
                dbManager.getSchoolInfo()
            ]);
            
            // Actualizar UI
            this.updateStats();
            this.renderPreviewPublications(publications);
            this.renderSubjectsGrid(subjects);
            this.updateSchoolInfo(schoolInfo);
            
        } catch (error) {
            console.error("Error cargando datos iniciales:", error);
            this.showError("Error cargando datos. Intenta recargar la página.");
        } finally {
            this.hideLoading();
        }
    }

    setupRealtimeUpdates() {
        // Suscribirse a cambios en tiempo real
        this.unsubscribe = dbManager.subscribeToUpdates((collection) => {
            console.log(`Cambios en ${collection}, actualizando...`);
            
            switch(collection) {
                case 'subjects':
                    this.loadSubjects();
                    break;
                case 'publications':
                    if (this.currentView === 'home') {
                        this.loadPublicationsPreview();
                    }
                    break;
                case 'resources':
                    if (this.currentView === 'resources') {
                        this.loadResources();
                    }
                    break;
            }
            
            // Actualizar estadísticas
            this.updateStats();
        });
    }

    // ========== NAVEGACIÓN ==========
    async showView(viewName, params = {}) {
        // Guardar vista anterior
        const previousView = this.currentView;
        this.currentView = viewName;
        
        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Actualizar navegación
        this.updateNavigation(viewName);
        
        // Cerrar menú móvil
        document.getElementById('mobile-menu')?.classList.add('hidden');
        
        // Cargar vista específica
        await this.loadView(viewName, params);
    }

    updateNavigation(activeView) {
        // Actualizar enlaces de navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === activeView) {
                link.classList.add('active');
            }
        });
        
        document.querySelectorAll('.nav-link-mobile').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === activeView) {
                link.classList.add('active');
            }
        });
    }

    async loadView(viewName, params) {
        this.showLoading();
        
        try {
            switch(viewName) {
                case 'home':
                    await this.loadHomeView();
                    break;
                case 'subjects':
                    await this.loadSubjectsView();
                    break;
                case 'resources':
                    await this.loadResourcesView(params.subjectId);
                    break;
                case 'publications':
                    await this.loadPublicationsView();
                    break;
                case 'about':
                    await this.loadAboutView();
                    break;
                case 'admin':
                    await this.loadAdminView();
                    break;
            }
        } catch (error) {
            console.error(`Error cargando vista ${viewName}:`, error);
            this.showError(`Error cargando ${viewName}`);
        } finally {
            this.hideLoading();
        }
    }

    // ========== VISTA: INICIO ==========
    async loadHomeView() {
        const view = document.getElementById('home-view');
        if (!view) return;
        
        view.classList.remove('hidden');
        
        // Cargar datos específicos
        await Promise.all([
            this.loadStats(),
            this.loadPublicationsPreview(),
            this.loadSubjectsPreview()
        ]);
    }

    async loadStats() {
        try {
            const stats = await dbManager.getStats();
            
            document.getElementById('total-subjects').textContent = stats.totalSubjects;
            document.getElementById('total-resources').textContent = stats.totalResources;
            document.getElementById('total-publications').textContent = stats.totalPublications;
            
        } catch (error) {
            console.error("Error cargando estadísticas:", error);
        }
    }

    async loadPublicationsPreview() {
        try {
            const publications = await dbManager.getPublications(3);
            this.renderPreviewPublications(publications);
        } catch (error) {
            console.error("Error cargando preview de publicaciones:", error);
        }
    }

    renderPreviewPublications(publications) {
        const container = document.getElementById('preview-publications');
        if (!container) return;
        
        if (!publications || publications.length === 0) {
            container.innerHTML = `
                <div class="col-span-3 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <i data-lucide="newspaper" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                    <p class="text-gray-600 dark:text-gray-400">No hay publicaciones recientes</p>
                </div>
            `;
            this.loadIcons();
            return;
        }
        
        container.innerHTML = publications.map(pub => `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                 onclick="app.showView('publications')">
                <div class="flex items-start justify-between mb-3">
                    <h4 class="font-bold text-gray-800 dark:text-white line-clamp-2 flex-1">${pub.title}</h4>
                    <span class="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">${this.formatDate(pub.createdAt?.toDate())}</span>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">${pub.content}</p>
                <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-500 dark:text-gray-400">${pub.author || 'Colegio'}</span>
                    <div class="flex items-center space-x-3">
                        <span class="flex items-center text-gray-500 dark:text-gray-400">
                            <i data-lucide="heart" class="w-3 h-3 mr-1 text-red-500"></i>
                            ${pub.likes || 0}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.loadIcons();
    }

    async loadSubjectsPreview() {
        try {
            const subjects = await dbManager.getSubjects();
            this.renderSubjectsGrid(subjects.slice(0, 4));
        } catch (error) {
            console.error("Error cargando preview de materias:", error);
        }
    }

    // ========== VISTA: MATERIAS ==========
    async loadSubjectsView() {
        const view = document.getElementById('subjects-view');
        if (!view) return;
        
        view.classList.remove('hidden');
        await this.loadSubjects();
    }

    async loadSubjects() {
        try {
            const subjects = await dbManager.getSubjects();
            this.renderSubjectsGrid(subjects);
        } catch (error) {
            console.error("Error cargando materias:", error);
            this.showError("Error cargando materias");
        }
    }

    renderSubjectsGrid(subjects) {
        const container = document.getElementById('subjects-grid');
        if (!container) return;
        
        if (!subjects || subjects.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <i data-lucide="book-open" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-700 dark:text-white mb-2">No hay materias</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">Aún no se han agregado materias.</p>
                    ${localStorage.getItem('isAdmin') === 'true' ? `
                    <button onclick="app.showAdminTab('subjects')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                        Agregar primera materia
                    </button>
                    ` : ''}
                </div>
            `;
            this.loadIcons();
            return;
        }
        
        container.innerHTML = subjects.map(subject => {
            const colorClass = subject.color || 'bg-blue-600';
            const icon = subject.icon || '📚';
            
            return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                 onclick="app.showSubjectResources('${subject.id}')">
                <div class="${colorClass} w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-4">
                    ${icon}
                </div>
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">${subject.name}</h3>
                ${subject.grade ? `<p class="text-gray-600 dark:text-gray-300 mb-4">${subject.grade}</p>` : ''}
                ${subject.tags && subject.tags.length > 0 ? `
                <div class="flex flex-wrap gap-1 mb-4">
                    ${subject.tags.slice(0, 3).map(tag => `
                        <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                            ${tag}
                        </span>
                    `).join('')}
                </div>
                ` : ''}
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-500 dark:text-gray-400">
                        Ver recursos →
                    </span>
                </div>
            </div>
            `;
        }).join('');
    }

    async showSubjectResources(subjectId) {
        this.activeSubject = subjectId;
        await this.showView('resources', { subjectId });
    }

    // ========== VISTA: RECURSOS ==========
    async loadResourcesView(subjectId = null) {
        const view = document.getElementById('resources-view');
        if (!view) return;
        
        view.classList.remove('hidden');
        
        // Si no hay subjectId, usar el activo
        subjectId = subjectId || this.activeSubject;
        
        if (!subjectId) {
            this.showNoSubjectSelected();
            return;
        }
        
        await this.loadResources(subjectId);
    }

    async loadResources(subjectId) {
        try {
            const [subject, resources] = await Promise.all([
                this.getSubjectById(subjectId),
                dbManager.getResourcesBySubject(subjectId)
            ]);
            
            // Actualizar título
            const titleEl = document.getElementById('resources-title');
            const subtitleEl = document.getElementById('resources-subtitle');
            
            if (titleEl && subject) {
                titleEl.textContent = `Recursos de ${subject.name}`;
            }
            
            if (subtitleEl && subject) {
                subtitleEl.textContent = subject.grade ? `${subject.grade} - ${subject.name}` : subject.name;
            }
            
            // Renderizar recursos
            this.renderResourcesList(resources, subject);
            
        } catch (error) {
            console.error("Error cargando recursos:", error);
            this.showError("Error cargando recursos");
        }
    }

    async getSubjectById(subjectId) {
        try {
            const subjects = await dbManager.getSubjects();
            return subjects.find(s => s.id === subjectId);
        } catch (error) {
            return null;
        }
    }

    renderResourcesList(resources, subject) {
        const container = document.getElementById('resources-list');
        if (!container) return;
        
        if (!resources || resources.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <i data-lucide="file-x" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-700 dark:text-white mb-2">No hay recursos disponibles</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        ${subject ? `Aún no se han subido recursos para ${subject.name}.` : 'Selecciona una materia.'}
                    </p>
                    ${localStorage.getItem('isAdmin') === 'true' ? `
                    <button onclick="app.showAdminTab('resources')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                        Agregar primer recurso
                    </button>
                    ` : ''}
                </div>
            `;
            this.loadIcons();
            return;
        }
        
        container.innerHTML = resources.map(resource => `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-start justify-between mb-2">
                            <h4 class="text-xl font-bold text-gray-800 dark:text-white">${resource.title}</h4>
                            <span class="text-sm text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                                ${this.formatDate(resource.createdAt?.toDate())}
                            </span>
                        </div>
                        
                        ${resource.description ? `
                        <p class="text-gray-600 dark:text-gray-300 mb-4">${resource.description}</p>
                        ` : ''}
                        
                        ${resource.tags && resource.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${resource.tags.map(tag => `
                                <span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                    ${tag}
                                </span>
                            `).join('')}
                        </div>
                        ` : ''}
                        
                        <div class="flex items-center space-x-4 text-sm">
                            <span class="text-gray-500 dark:text-gray-400">
                                ${resource.type || 'PDF'} • ${this.formatFileSize(resource.size)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row md:flex-col gap-2">
                        <a href="${resource.url}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           onclick="app.trackDownload('${resource.id}')"
                           class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center whitespace-nowrap">
                            <i data-lucide="download" class="w-4 h-4 mr-2"></i>
                            Descargar
                        </a>
                        
                        ${localStorage.getItem('isAdmin') === 'true' ? `
                        <div class="flex gap-2">
                            <button onclick="app.editResource('${resource.id}')" 
                                    class="flex-1 bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-lg flex items-center justify-center">
                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                            </button>
                            <button onclick="app.deleteResource('${resource.id}')" 
                                    class="flex-1 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg flex items-center justify-center">
                                <i data-lucide="trash" class="w-4 h-4"></i>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        this.loadIcons();
    }

    showNoSubjectSelected() {
        const container = document.getElementById('resources-list');
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <i data-lucide="folder-open" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                <h3 class="text-xl font-bold text-gray-700 dark:text-white mb-2">Selecciona una materia</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                    Elige una materia para ver sus recursos disponibles.
                </p>
                <button onclick="app.showView('subjects')" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                    Ver materias
                </button>
            </div>
        `;
        this.loadIcons();
    }

    // ========== VISTA: PUBLICACIONES ==========
    async loadPublicationsView() {
        const view = document.getElementById('publications-view');
        if (!view) return;
        
        view.classList.remove('hidden');
        await this.loadAllPublications();
    }

    async loadAllPublications() {
        try {
            const publications = await dbManager.getPublications();
            this.renderPublicationsList(publications);
        } catch (error) {
            console.error("Error cargando publicaciones:", error);
            this.showError("Error cargando publicaciones");
        }
    }

    renderPublicationsList(publications) {
        const container = document.getElementById('publications-list');
        if (!container) return;
        
        if (!publications || publications.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <i data-lucide="newspaper" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-700 dark:text-white mb-2">No hay publicaciones</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        Aún no se han publicado noticias o anuncios.
                    </p>
                    ${localStorage.getItem('isAdmin') === 'true' ? `
                    <button onclick="app.showAdminTab('publications')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                        Crear primera publicación
                    </button>
                    ` : ''}
                </div>
            `;
            this.loadIcons();
            return;
        }
        
        container.innerHTML = publications.map(pub => `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                ${pub.imageUrl ? `
                <div class="border-b dark:border-gray-700">
                    <img src="${pub.imageUrl}" 
                         alt="${pub.title}" 
                         class="w-full h-64 object-cover"
                         loading="lazy">
                </div>
                ` : ''}
                
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold text-gray-800 dark:text-white">${pub.title}</h3>
                        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <i data-lucide="calendar" class="w-4 h-4 mr-1"></i>
                            ${this.formatDate(pub.createdAt?.toDate())}
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4 mb-4 text-sm">
                        <div class="flex items-center">
                            <i data-lucide="user" class="w-4 h-4 mr-1 text-gray-400"></i>
                            <span class="text-gray-600 dark:text-gray-300">${pub.author || 'Colegio'}</span>
                        </div>
                    </div>
                    
                    <p class="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-line">${pub.content}</p>
                    
                    <!-- Interacciones -->
                    <div class="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                        <div class="flex items-center space-x-4">
                            <button onclick="app.likePublication('${pub.id}')" 
                                    class="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-red-600">
                                <i data-lucide="heart" class="w-5 h-5"></i>
                                <span>${pub.likes || 0}</span>
                            </button>
                        </div>
                        
                        ${localStorage.getItem('isAdmin') === 'true' ? `
                        <div class="flex space-x-2">
                            <button onclick="app.editPublication('${pub.id}')" 
                                    class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg">
                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                            </button>
                            <button onclick="app.deletePublication('${pub.id}')" 
                                    class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg">
                                <i data-lucide="trash" class="w-4 h-4"></i>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        this.loadIcons();
    }

    // ========== VISTA: ACERCA ==========
    async loadAboutView() {
        const view = document.getElementById('about-view');
        if (!view) return;
        
        view.classList.remove('hidden');
        await this.updateSchoolInfo();
    }

    async updateSchoolInfo(info = null) {
        try {
            const schoolInfo = info || await dbManager.getSchoolInfo();
            
            // Actualizar todos los campos
            Object.keys(schoolInfo).forEach(key => {
                const element = document.getElementById(`school-${key}`);
                if (element) {
                    element.textContent = schoolInfo[key];
                }
            });
            
        } catch (error) {
            console.error("Error actualizando info del colegio:", error);
        }
    }

    // ========== VISTA: ADMIN ==========
    async loadAdminView() {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            this.showView('home');
            this.showError("Acceso denegado");
            return;
        }
        
        const view = document.getElementById('admin-view');
        if (!view) return;
        
        view.classList.remove('hidden');
        await this.showAdminTab('dashboard');
    }

    async showAdminTab(tabName) {
        // Ocultar todos los contenidos
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Actualizar pestañas activas
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent.toLowerCase().includes(tabName)) {
                tab.classList.add('active');
            }
        });
        
        // Mostrar contenido seleccionado
        const contentId = `admin-${tabName}`;
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.remove('hidden');
            
            // Cargar datos específicos del tab
            switch(tabName) {
                case 'dashboard':
                    await this.loadAdminDashboard();
                    break;
                case 'subjects':
                    await this.loadAdminSubjects();
                    break;
                case 'resources':
                    await this.loadAdminResources();
                    break;
                case 'publications':
                    await this.loadAdminPublications();
                    break;
                case 'school':
                    await this.loadAdminSchoolInfo();
                    break;
                case 'themes':
                    await this.loadAdminThemes();
                    break;
                case 'settings':
                    await this.loadAdminSettings();
                    break;
            }
        }
    }

    async loadAdminDashboard() {
        try {
            const stats = await dbManager.getStats();
            
            // Actualizar estadísticas
            document.getElementById('admin-total-subjects').textContent = stats.totalSubjects;
            document.getElementById('admin-total-resources').textContent = stats.totalResources;
            document.getElementById('admin-total-publications').textContent = stats.totalPublications;
            document.getElementById('admin-total-downloads').textContent = stats.totalDownloads;
            
            // Cargar datos recientes
            await Promise.all([
                this.loadAdminRecentPublications(),
                this.loadAdminRecentResources()
            ]);
            
        } catch (error) {
            console.error("Error cargando dashboard admin:", error);
        }
    }

    async loadAdminRecentPublications() {
        try {
            const publications = await dbManager.getPublications(5);
            const container = document.getElementById('admin-recent-publications');
            
            if (!container) return;
            
            container.innerHTML = publications.map(pub => `
                <div class="border-b dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                    <div class="flex justify-between items-start">
                        <h4 class="font-semibold line-clamp-1 dark:text-white">${pub.title}</h4>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${this.formatDate(pub.createdAt?.toDate())}</span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">${pub.content}</p>
                    <div class="flex items-center justify-between mt-2 text-xs">
                        <span class="text-gray-500 dark:text-gray-400">${pub.author || 'Colegio'}</span>
                        <div class="flex items-center space-x-2">
                            <button onclick="app.editPublication('${pub.id}')" 
                                    class="text-blue-600 dark:text-blue-400 hover:text-blue-800">
                                Editar
                            </button>
                            <button onclick="app.deletePublication('${pub.id}')" 
                                    class="text-red-600 dark:text-red-400 hover:text-red-800">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error("Error cargando publicaciones recientes:", error);
        }
    }

    async loadAdminRecentResources() {
        try {
            const resources = await dbManager.getResources({ limit: 5 });
            const container = document.getElementById('admin-recent-resources');
            
            if (!container) return;
            
            container.innerHTML = resources.map(res => {
                return `
                <div class="border-b dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                    <div class="flex justify-between items-start">
                        <h4 class="font-semibold line-clamp-1 dark:text-white">${res.title}</h4>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${this.formatDate(res.createdAt?.toDate())}</span>
                    </div>
                    <div class="flex items-center justify-between mt-2 text-xs">
                        <span class="text-gray-500 dark:text-gray-400">${res.downloads || 0} descargas</span>
                        <div class="flex items-center space-x-2">
                            <button onclick="app.editResource('${res.id}')" 
                                    class="text-blue-600 dark:text-blue-400 hover:text-blue-800">
                                Editar
                            </button>
                            <button onclick="app.deleteResource('${res.id}')" 
                                    class="text-red-600 dark:text-red-400 hover:text-red-800">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error("Error cargando recursos recientes:", error);
        }
    }

    // ========== FUNCIONES DE ADMIN ==========
    async addSubject() {
        // Implementar en admin.js
        console.log("Agregar materia");
    }

    async editResource(resourceId) {
        // Implementar en admin.js
        console.log("Editar recurso:", resourceId);
    }

    async deleteResource(resourceId) {
        if (!confirm("¿Estás seguro de eliminar este recurso?")) return;
        
        try {
            const result = await dbManager.deleteResource(resourceId);
            if (result.success) {
                this.showSuccess("Recurso eliminado");
                // Recargar vista actual
                if (this.currentView === 'resources') {
                    await this.loadResources(this.activeSubject);
                }
                if (this.currentView === 'admin') {
                    await this.loadAdminDashboard();
                }
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError("Error eliminando recurso");
        }
    }

    async editPublication(publicationId) {
        // Implementar en admin.js
        console.log("Editar publicación:", publicationId);
    }

    async deletePublication(publicationId) {
        if (!confirm("¿Estás seguro de eliminar esta publicación?")) return;
        
        try {
            const result = await dbManager.deletePublication(publicationId);
            if (result.success) {
                this.showSuccess("Publicación eliminada");
                // Recargar vista actual
                if (this.currentView === 'publications') {
                    await this.loadAllPublications();
                }
                if (this.currentView === 'home') {
                    await this.loadPublicationsPreview();
                }
                if (this.currentView === 'admin') {
                    await this.loadAdminDashboard();
                }
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError("Error eliminando publicación");
        }
    }

    async likePublication(publicationId) {
        try {
            // Implementar sistema de likes
            console.log("Like a publicación:", publicationId);
        } catch (error) {
            console.error("Error dando like:", error);
        }
    }

    async trackDownload(resourceId) {
        try {
            await dbManager.incrementDownloads(resourceId);
        } catch (error) {
            console.error("Error registrando descarga:", error);
        }
    }

    // ========== UTILIDADES ==========
    formatDate(date) {
        if (!date) return 'Fecha no disponible';
        
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatFileSize(bytes) {
        if (!bytes) return 'Tamaño desconocido';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    showLoading() {
        this.isLoading = true;
        // Podrías mostrar un spinner aquí
    }

    hideLoading() {
        this.isLoading = false;
        // Ocultar spinner
    }

    showError(message) {
        // Implementar notificación de error
        console.error("Error:", message);
        alert(message); // Temporal
    }

    showSuccess(message) {
        // Implementar notificación de éxito
        console.log("Éxito:", message);
        alert(message); // Temporal
    }

    toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
    }

    updateStats() {
        // Actualizar contadores en tiempo real
        dbManager.getStats().then(stats => {
            const elements = {
                'total-subjects': stats.totalSubjects,
                'total-resources': stats.totalResources,
                'total-publications': stats.totalPublications
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });
        });
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ColegioApp();
});