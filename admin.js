// Panel de administración completo
class AdminManager {
    constructor() {
        this.currentEditId = null;
        this.currentEditType = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Formulario de materias
        document.getElementById('subject-form')?.addEventListener('submit', (e) => 
            this.handleSubjectForm(e));
        
        // Formulario de recursos
        document.getElementById('resource-form')?.addEventListener('submit', (e) => 
            this.handleResourceForm(e));
        
        // Formulario de publicaciones
        document.getElementById('publication-form')?.addEventListener('submit', (e) => 
            this.handlePublicationForm(e));
        
        // Formulario de información del colegio
        document.getElementById('school-form')?.addEventListener('submit', (e) => 
            this.handleSchoolForm(e));
        
        // Formulario de temas
        document.getElementById('theme-form')?.addEventListener('submit', (e) => 
            this.handleThemeForm(e));
    }

    // ========== MATERIAS ==========
    async loadAdminSubjects() {
        try {
            const subjects = await dbManager.getSubjects();
            this.renderSubjectsTable(subjects);
            
            // Llenar select de materias en formulario de recursos
            this.fillSubjectSelect(subjects);
        } catch (error) {
            console.error("Error cargando materias admin:", error);
        }
    }

    renderSubjectsTable(subjects) {
        const container = document.getElementById('admin-subjects-list');
        if (!container) return;
        
        if (!subjects || subjects.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500 dark:text-gray-400">
                        No hay materias registradas
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = subjects.map(subject => `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="${subject.color || 'bg-blue-600'} w-8 h-8 rounded-lg flex items-center justify-center text-white mr-3">
                            ${subject.icon || '📚'}
                        </div>
                        <div>
                            <div class="font-medium text-gray-900 dark:text-white">${subject.name}</div>
                            ${subject.grade ? `<div class="text-sm text-gray-500 dark:text-gray-400">${subject.grade}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1">
                        ${(subject.tags || []).slice(0, 3).map(tag => `
                            <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                ${tag}
                            </span>
                        `).join('')}
                        ${(subject.tags || []).length > 3 ? `
                            <span class="text-xs text-gray-500">+${(subject.tags || []).length - 3}</span>
                        ` : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700 dark:text-gray-300">
                        ${subject.order || 0}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700 dark:text-gray-300">
                        ${this.formatDate(subject.createdAt?.toDate())}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end space-x-2">
                        <button onclick="adminManager.editSubject('${subject.id}')"
                                class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="adminManager.deleteSubject('${subject.id}')"
                                class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1">
                            <i data-lucide="trash" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        lucide.createIcons();
    }

    async handleSubjectForm(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const subjectData = {
            name: formData.get('name'),
            grade: formData.get('grade') || null,
            color: formData.get('color') || 'bg-blue-600',
            icon: formData.get('icon') || '📚',
            order: parseInt(formData.get('order')) || 0,
            description: formData.get('description') || null
        };
        
        // Procesar tags
        const tagsInput = formData.get('tags');
        if (tagsInput) {
            subjectData.tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        
        try {
            let result;
            if (this.currentEditId) {
                result = await dbManager.updateSubject(this.currentEditId, subjectData);
            } else {
                result = await dbManager.addSubject(subjectData);
            }
            
            if (result.success) {
                this.showSuccess(
                    this.currentEditId ? 
                    'Materia actualizada correctamente' : 
                    'Materia creada correctamente'
                );
                
                form.reset();
                this.currentEditId = null;
                document.getElementById('subject-form-title').textContent = 'Agregar Nueva Materia';
                
                // Recargar tabla
                await this.loadAdminSubjects();
                // Actualizar vista pública si está activa
                if (app.currentView === 'subjects') {
                    await app.loadSubjects();
                }
                
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Error guardando materia: ' + error.message);
        }
    }

    async editSubject(subjectId) {
        try {
            const subjects = await dbManager.getSubjects();
            const subject = subjects.find(s => s.id === subjectId);
            
            if (!subject) {
                this.showError('Materia no encontrada');
                return;
            }
            
            // Llenar formulario
            const form = document.getElementById('subject-form');
            form.querySelector('[name="name"]').value = subject.name;
            form.querySelector('[name="grade"]').value = subject.grade || '';
            form.querySelector('[name="color"]').value = subject.color || 'bg-blue-600';
            form.querySelector('[name="icon"]').value = subject.icon || '📚';
            form.querySelector('[name="order"]').value = subject.order || 0;
            form.querySelector('[name="description"]').value = subject.description || '';
            form.querySelector('[name="tags"]').value = (subject.tags || []).join(', ');
            
            // Actualizar título
            document.getElementById('subject-form-title').textContent = 'Editar Materia';
            
            // Guardar ID para actualización
            this.currentEditId = subjectId;
            
            // Mostrar formulario
            document.getElementById('subject-form-container')?.classList.remove('hidden');
            
            // Scroll al formulario
            form.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            this.showError('Error cargando materia: ' + error.message);
        }
    }

    async deleteSubject(subjectId) {
        if (!confirm('¿Estás seguro de eliminar esta materia? Esto no eliminará sus recursos asociados.')) {
            return;
        }
        
        try {
            const result = await dbManager.deleteSubject(subjectId);
            if (result.success) {
                this.showSuccess('Materia eliminada correctamente');
                await this.loadAdminSubjects();
                if (app.currentView === 'subjects') {
                    await app.loadSubjects();
                }
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Error eliminando materia: ' + error.message);
        }
    }

    // ========== RECURSOS ==========
    async loadAdminResources() {
        try {
            const resources = await dbManager.getResources();
            this.renderResourcesTable(resources);
        } catch (error) {
            console.error("Error cargando recursos admin:", error);
        }
    }

    renderResourcesTable(resources) {
        const container = document.getElementById('admin-resources-list');
        if (!container) return;
        
        if (!resources || resources.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8 text-gray-500 dark:text-gray-400">
                        No hay recursos registrados
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = resources.map(async (resource) => {
            const subject = await this.getSubjectName(resource.subjectId);
            
            return `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-900 dark:text-white">${resource.title}</div>
                    ${resource.description ? `<div class="text-sm text-gray-500 dark:text-gray-400">${resource.description}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700 dark:text-gray-300">${subject}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1">
                        ${(resource.tags || []).slice(0, 3).map(tag => `
                            <span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                ${tag}
                            </span>
                        `).join('')}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700 dark:text-gray-300">
                        ${resource.downloads || 0}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700 dark:text-gray-300">
                        ${this.formatDate(resource.createdAt?.toDate())}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end space-x-2">
                        <a href="${resource.url}" 
                           target="_blank"
                           class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1">
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                        </a>
                        <button onclick="adminManager.editResource('${resource.id}')"
                                class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="adminManager.deleteResource('${resource.id}')"
                                class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1">
                            <i data-lucide="trash" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
        
        lucide.createIcons();
    }

    async getSubjectName(subjectId) {
        try {
            const subjects = await dbManager.getSubjects();
            const subject = subjects.find(s => s.id === subjectId);
            return subject?.name || 'Sin materia';
        } catch (error) {
            return 'Error';
        }
    }

    async handleResourceForm(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const resourceData = {
            subjectId: formData.get('subject'),
            title: formData.get('title'),
            description: formData.get('description') || null,
            url: formData.get('url'),
            type: formData.get('type') || 'pdf'
        };
        
        // Procesar tags
        const tagsInput = formData.get('tags');
        if (tagsInput) {
            resourceData.tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        
        // Procesar tamaño si está presente
        const sizeInput = formData.get('size');
        if (sizeInput) {
            resourceData.size = this.parseFileSize(sizeInput);
        }
        
        try {
            let result;
            if (this.currentEditId && this.currentEditType === 'resource') {
                result = await dbManager.updateResource(this.currentEditId, resourceData);
            } else {
                result = await dbManager.addResource(resourceData);
            }
            
            if (result.success) {
                this.showSuccess(
                    this.currentEditId ? 
                    'Recurso actualizado correctamente' : 
                    'Recurso creado correctamente'
                );
                
                form.reset();
                this.currentEditId = null;
                this.currentEditType = null;
                document.getElementById('resource-form-title').textContent = 'Agregar Nuevo Recurso';
                
                // Recargar tabla
                await this.loadAdminResources();
                // Actualizar vista pública si está activa
                if (app.currentView === 'resources') {
                    await app.loadResources(app.activeSubject);
                }
                
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Error guardando recurso: ' + error.message);
        }
    }

    async editResource(resourceId) {
        try {
            const resources = await dbManager.getResources();
            const resource = resources.find(r => r.id === resourceId);
            
            if (!resource) {
                this.showError('Recurso no encontrado');
                return;
            }
            
            // Llenar formulario
            const form = document.getElementById('resource-form');
            form.querySelector('[name="title"]').value = resource.title;
            form.querySelector('[name="subject"]').value = resource.subjectId;
            form.querySelector('[name="description"]').value = resource.description || '';
            form.querySelector('[name="url"]').value = resource.url;
            form.querySelector('[name="type"]').value = resource.type || 'pdf';
            form.querySelector('[name="tags"]').value = (resource.tags || []).join(', ');
            
            // Actualizar título
            document.getElementById('resource-form-title').textContent = 'Editar Recurso';
            
            // Guardar ID para actualización
            this.currentEditId = resourceId;
            this.currentEditType = 'resource';
            
            // Mostrar formulario
            document.getElementById('resource-form-container')?.classList.remove('hidden');
            
            // Scroll al formulario
            form.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            this.showError('Error cargando recurso: ' + error.message);
        }
    }

    // ========== PUBLICACIONES ==========
    async loadAdminPublications() {
        try {
            const publications = await dbManager.getPublications();
            this.renderPublicationsTable(publications);
        } catch (error) {
            console.error("Error cargando publicaciones admin:", error);
        }
    }

    renderPublicationsTable(publications) {
        const container = document.getElementById('admin-publications-list');
        if (!container) return;
        
        if (!publications || publications.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500 dark:text-gray-400">
                        No hay publicaciones registradas
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = publications.map(pub => `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-900 dark:text-white">${pub.title}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">${pub.content.substring(0, 100)}${pub.content.length > 100 ? '...' : ''}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700 dark:text-gray-300">${pub.author || 'Colegio'}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700 dark:text-gray-300">${pub.likes || 0}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700 dark:text-gray-300">
                        ${this.formatDate(pub.createdAt?.toDate())}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end space-x-2">
                        <button onclick="adminManager.editPublication('${pub.id}')"
                                class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="adminManager.deletePublication('${pub.id}')"
                                class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1">
                            <i data-lucide="trash" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        lucide.createIcons();
    }

    async handlePublicationForm(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const imageFile = formData.get('image');
        
        try {
            let imageUrl = null;
            
            // Subir imagen si hay una
            if (imageFile && imageFile.size > 0) {
                const uploadResult = await storageManager.uploadImage(imageFile, 'publications');
                imageUrl = uploadResult.url;
            } else if (this.currentEditId && this.currentEditType === 'publication') {
                // Mantener imagen existente si estamos editando
                const publications = await dbManager.getPublications();
                const existingPub = publications.find(p => p.id === this.currentEditId);
                imageUrl = existingPub?.imageUrl;
            }
            
            const publicationData = {
                title: formData.get('title'),
                content: formData.get('content'),
                author: formData.get('author') || 'Colegio Ildefonso Vázquez',
                imageUrl: imageUrl
            };
            
            let result;
            if (this.currentEditId && this.currentEditType === 'publication') {
                result = await dbManager.updatePublication(this.currentEditId, publicationData);
            } else {
                result = await dbManager.addPublication(publicationData);
            }
            
            if (result.success) {
                this.showSuccess(
                    this.currentEditId ? 
                    'Publicación actualizada correctamente' : 
                    'Publicación creada correctamente'
                );
                
                form.reset();
                document.getElementById('image-preview')?.classList.add('hidden');
                this.currentEditId = null;
                this.currentEditType = null;
                document.getElementById('publication-form-title').textContent = 'Crear Nueva Publicación';
                
                // Recargar tabla
                await this.loadAdminPublications();
                // Actualizar vista pública si está activa
                if (app.currentView === 'publications') {
                    await app.loadAllPublications();
                }
                if (app.currentView === 'home') {
                    await app.loadPublicationsPreview();
                }
                
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Error guardando publicación: ' + error.message);
        }
    }

    async editPublication(publicationId) {
        try {
            const publications = await dbManager.getPublications();
            const publication = publications.find(p => p.id === publicationId);
            
            if (!publication) {
                this.showError('Publicación no encontrada');
                return;
            }
            
            // Llenar formulario
            const form = document.getElementById('publication-form');
            form.querySelector('[name="title"]').value = publication.title;
            form.querySelector('[name="content"]').value = publication.content;
            form.querySelector('[name="author"]').value = publication.author || '';
            
            // Mostrar preview de imagen si existe
            if (publication.imageUrl) {
                const preview = document.getElementById('image-preview');
                const img = preview.querySelector('img');
                img.src = publication.imageUrl;
                preview.classList.remove('hidden');
            }
            
            // Actualizar título
            document.getElementById('publication-form-title').textContent = 'Editar Publicación';
            
            // Guardar ID para actualización
            this.currentEditId = publicationId;
            this.currentEditType = 'publication';
            
            // Mostrar formulario
            document.getElementById('publication-form-container')?.classList.remove('hidden');
            
            // Scroll al formulario
            form.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            this.showError('Error cargando publicación: ' + error.message);
        }
    }

    // ========== INFORMACIÓN DEL COLEGIO ==========
    async loadAdminSchoolInfo() {
        try {
            const schoolInfo = await dbManager.getSchoolInfo();
            this.fillSchoolForm(schoolInfo);
        } catch (error) {
            console.error("Error cargando info del colegio:", error);
        }
    }

    fillSchoolForm(schoolInfo) {
        const form = document.getElementById('school-form');
        if (!form) return;
        
        // Llenar todos los campos del formulario
        Object.keys(schoolInfo).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'textarea') {
                    input.value = schoolInfo[key] || '';
                } else {
                    input.value = schoolInfo[key] || '';
                }
            }
        });
    }

    async handleSchoolForm(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const schoolData = {};
        for (let [key, value] of formData.entries()) {
            if (value) schoolData[key] = value;
        }
        
        try {
            const result = await dbManager.updateSchoolInfo(schoolData);
            if (result.success) {
                this.showSuccess('Información del colegio actualizada correctamente');
                
                // Actualizar vista pública si está activa
                if (app.currentView === 'about') {
                    await app.updateSchoolInfo(schoolData);
                }
                
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Error actualizando información: ' + error.message);
        }
    }

    // ========== TEMAS ==========
    async loadAdminThemes() {
        try {
            const themeConfig = await this.getThemeConfig();
            this.fillThemeForm(themeConfig);
        } catch (error) {
            console.error("Error cargando temas:", error);
        }
    }

    async getThemeConfig() {
        try {
            const doc = await db.collection('config').doc('themes').get();
            return doc.exists ? doc.data() : this.getDefaultThemeConfig();
        } catch (error) {
            return this.getDefaultThemeConfig();
        }
    }

    getDefaultThemeConfig() {
        return {
            currentTheme: 'default',
            themes: {
                default: {
                    name: 'Tema Normal',
                    colors: {
                        primary: '#1e40af',
                        secondary: '#dc2626',
                        background: '#f9fafb',
                        text: '#1f2937'
                    }
                },
                navidad: {
                    name: 'Modo Navideño',
                    colors: {
                        primary: '#dc2626',
                        secondary: '#16a34a',
                        background: '#fef2f2',
                        text: '#1f2937'
                    },
                    enabled: false
                },
                aniversario: {
                    name: 'Modo Aniversario',
                    colors: {
                        primary: '#f97316',
                        secondary: '#fbbf24',
                        background: '#fff7ed',
                        text: '#1f2937'
                    },
                    enabled: false
                }
            }
        };
    }

    fillThemeForm(themeConfig) {
        const form = document.getElementById('theme-form');
        if (!form) return;
        
        // Llenar tema actual
        form.querySelector('[name="currentTheme"]').value = themeConfig.currentTheme;
        
        // Llenar colores del tema actual
        const currentTheme = themeConfig.themes[themeConfig.currentTheme];
        if (currentTheme && currentTheme.colors) {
            Object.keys(currentTheme.colors).forEach(colorKey => {
                const input = form.querySelector(`[name="color-${colorKey}"]`);
                if (input) {
                    input.value = currentTheme.colors[colorKey];
                }
            });
        }
        
        // Llenar estado de temas especiales
        ['navidad', 'aniversario'].forEach(themeName => {
            const checkbox = form.querySelector(`[name="enable-${themeName}"]`);
            if (checkbox) {
                checkbox.checked = themeConfig.themes[themeName]?.enabled || false;
            }
        });
    }

    async handleThemeForm(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        try {
            const currentTheme = formData.get('currentTheme');
            
            // Obtener configuración actual
            const currentConfig = await this.getThemeConfig();
            
            // Actualizar colores del tema actual
            const updatedTheme = {
                ...currentConfig.themes[currentTheme],
                colors: {
                    primary: formData.get('color-primary'),
                    secondary: formData.get('color-secondary'),
                    background: formData.get('color-background'),
                    text: formData.get('color-text')
                }
            };
            
            // Actualizar estados de temas especiales
            ['navidad', 'aniversario'].forEach(themeName => {
                if (currentConfig.themes[themeName]) {
                    currentConfig.themes[themeName].enabled = formData.get(`enable-${themeName}`) === 'on';
                }
            });
            
            // Guardar configuración
            currentConfig.currentTheme = currentTheme;
            currentConfig.themes[currentTheme] = updatedTheme;
            
            await db.collection('config').doc('themes').set(currentConfig);
            
            this.showSuccess('Configuración de temas guardada correctamente');
            
            // Aplicar tema inmediatamente
            this.applyTheme(currentTheme, updatedTheme.colors);
            
        } catch (error) {
            this.showError('Error guardando temas: ' + error.message);
        }
    }

    applyTheme(themeName, colors) {
        // Guardar en localStorage
        localStorage.setItem('theme', themeName);
        localStorage.setItem('theme-colors', JSON.stringify(colors));
        
        // Aplicar colores CSS
        if (colors) {
            Object.keys(colors).forEach(colorKey => {
                document.documentElement.style.setProperty(`--${colorKey}`, colors[colorKey]);
            });
        }
        
        // Si es un tema especial, aplicar clases adicionales
        document.body.classList.remove('navidad-mode', 'aniversario-mode');
        if (themeName === 'navidad' || themeName === 'aniversario') {
            document.body.classList.add(`${themeName}-mode`);
        }
    }

    // ========== AJUSTES ==========
    async loadAdminSettings() {
        // Cargar configuración actual
        try {
            const doc = await db.collection('config').doc('admin').get();
            const config = doc.exists ? doc.data() : {};
            
            // Llenar formulario
            const form = document.getElementById('settings-form');
            if (form) {
                form.querySelector('[name="registrationCode"]').value = config.registrationCode || '';
            }
        } catch (error) {
            console.error("Error cargando ajustes:", error);
        }
    }

    async handleSettingsForm(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        try {
            const settings = {
                registrationCode: formData.get('registrationCode'),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('config').doc('admin').set(settings, { merge: true });
            
            this.showSuccess('Ajustes guardados correctamente');
            
        } catch (error) {
            this.showError('Error guardando ajustes: ' + error.message);
        }
    }

    async exportData() {
        try {
            const [subjects, resources, publications, schoolInfo, themeConfig] = await Promise.all([
                dbManager.getSubjects(),
                dbManager.getResources(),
                dbManager.getPublications(),
                dbManager.getSchoolInfo(),
                this.getThemeConfig()
            ]);
            
            const exportData = {
                version: '2.0',
                exportedAt: new Date().toISOString(),
                subjects,
                resources,
                publications,
                schoolInfo,
                themeConfig
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', `colegio_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showSuccess('Datos exportados correctamente');
            
        } catch (error) {
            this.showError('Error exportando datos: ' + error.message);
        }
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!confirm('¿Importar datos? Esto sobrescribirá la información actual.')) {
                return;
            }
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Validar formato
                if (!data.version || !data.subjects || !data.resources || !data.publications) {
                    throw new Error('Formato de archivo inválido');
                }
                
                // Importar datos
                await this.importDataToFirebase(data);
                
                this.showSuccess('Datos importados correctamente. Recarga la página para ver los cambios.');
                
            } catch (error) {
                this.showError('Error importando datos: ' + error.message);
            }
        };
        
        input.click();
    }

    async importDataToFirebase(data) {
        // Importar materias
        for (const subject of data.subjects) {
            await db.collection('subjects').doc(subject.id).set(subject);
        }
        
        // Importar recursos
        for (const resource of data.resources) {
            await db.collection('resources').doc(resource.id).set(resource);
        }
        
        // Importar publicaciones
        for (const publication of data.publications) {
            await db.collection('publications').doc(publication.id).set(publication);
        }
        
        // Importar configuración
        if (data.schoolInfo) {
            await db.collection('config').doc('school').set(data.schoolInfo);
        }
        
        if (data.themeConfig) {
            await db.collection('config').doc('themes').set(data.themeConfig);
        }
    }

    // ========== UTILIDADES ==========
    fillSubjectSelect(subjects) {
        const select = document.getElementById('resource-subject-select');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccionar materia</option>' +
            subjects.map(subject => `
                <option value="${subject.id}">${subject.name} ${subject.grade ? `(${subject.grade})` : ''}</option>
            `).join('');
    }

    parseFileSize(sizeString) {
        if (!sizeString) return null;
        
        const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)?$/i);
        if (!match) return null;
        
        const value = parseFloat(match[1]);
        const unit = (match[2] || 'KB').toUpperCase();
        
        const units = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
        return Math.round(value * (units[unit] || 1024));
    }

    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-ES');
    }

    showSuccess(message) {
        // Implementar notificación bonita
        alert(message); // Temporal
    }

    showError(message) {
        // Implementar notificación de error bonita
        alert('Error: ' + message); // Temporal
    }

    showForm(formId) {
        document.getElementById(`${formId}-container`)?.classList.remove('hidden');
    }

    hideForm(formId) {
        document.getElementById(`${formId}-container`)?.classList.add('hidden');
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            this.currentEditId = null;
            this.currentEditType = null;
            
            // Restaurar títulos
            const titleEl = document.getElementById(`${formId}-title`);
            if (titleEl) {
                titleEl.textContent = titleEl.textContent.replace('Editar', 'Agregar');
            }
            
            // Limpiar previews
            const preview = document.getElementById('image-preview');
            if (preview) {
                preview.classList.add('hidden');
            }
        }
    }
}

// Inicializar
window.adminManager = new AdminManager();