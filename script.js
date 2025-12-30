// Datos iniciales del sistema
let appData = {
    isLoggedIn: false,
    currentView: 'home',
    activeSubject: null,
    theme: 'default'
};

// Variables globales
let subjects = [];
let resources = [];
let publications = [];

// Inicialización
function loadInitialData() {
    // Cargar datos desde localStorage
    const savedSubjects = localStorage.getItem('colegio_subjects');
    const savedResources = localStorage.getItem('colegio_resources');
    const savedPublications = localStorage.getItem('colegio_publications');
    const savedTheme = localStorage.getItem('colegio_theme');
    
    // Cargar materias
    if (savedSubjects) {
        subjects = JSON.parse(savedSubjects);
    } else {
        // Datos por defecto
        subjects = [
            { id: 1, name: 'Matemáticas', grade: 'Primaria', color: 'bg-blue-600', icon: '🔢' },
            { id: 2, name: 'Ciencias Naturales', grade: 'Primaria', color: 'bg-green-600', icon: '🌿' },
            { id: 3, name: 'Lenguaje', grade: 'Primaria', color: 'bg-purple-600', icon: '📚' },
            { id: 4, name: 'Historia', grade: 'Secundaria', color: 'bg-red-600', icon: '🏛️' },
            { id: 5, name: 'Geografía', grade: 'Secundaria', color: 'bg-yellow-600', icon: '🌍' },
            { id: 6, name: 'Inglés', grade: 'Secundaria', color: 'bg-indigo-600', icon: '🇬🇧' },
            { id: 7, name: 'Física', grade: 'Bachillerato', color: 'bg-cyan-600', icon: '⚛️' },
            { id: 8, name: 'Química', grade: 'Bachillerato', color: 'bg-pink-600', icon: '🧪' },
            { id: 9, name: 'Biología', grade: 'Bachillerato', color: 'bg-emerald-600', icon: '🧬' }
        ];
    }
    
    // Cargar recursos
    if (savedResources) {
        resources = JSON.parse(savedResources);
    } else {
        resources = [
            { 
                id: 1, 
                subjectId: 1, 
                title: 'Guía de Multiplicación', 
                description: 'Ejercicios básicos de multiplicación para primaria', 
                url: 'https://drive.google.com/file/d/1abc123/view', 
                date: '2025-03-15',
                downloads: 45,
                likes: 12
            },
            { 
                id: 2, 
                subjectId: 1, 
                title: 'Problemas de Álgebra', 
                description: 'Introducción al álgebra con ejercicios prácticos', 
                url: 'https://drive.google.com/file/d/2def456/view', 
                date: '2025-03-20',
                downloads: 32,
                likes: 8
            }
        ];
    }
    
    // Cargar publicaciones
    if (savedPublications) {
        publications = JSON.parse(savedPublications);
    } else {
        publications = [
            {
                id: 1,
                title: 'Bienvenida al nuevo curso escolar',
                content: 'Queridos estudiantes y familias, damos la bienvenida a un nuevo año escolar lleno de oportunidades para aprender y crecer. Este año contamos con nuevas instalaciones y recursos educativos para mejorar su experiencia.',
                author: 'Dirección',
                date: '2025-04-10',
                time: '08:30',
                image: null,
                likes: 24,
                comments: 5
            },
            {
                id: 2,
                title: 'Feria de Ciencias 2025',
                content: 'Los invitamos a participar en nuestra tradicional Feria de Ciencias que se realizará el próximo 15 de mayo. Los estudiantes podrán presentar proyectos innovadores y competir por premios especiales.',
                author: 'Departamento de Ciencias',
                date: '2025-04-05',
                time: '14:15',
                image: 'https://placehold.co/600x400/4ade80/ffffff?text=Feria+de+Ciencias',
                likes: 18,
                comments: 3
            }
        ];
    }
    
    // Cargar tema
    if (savedTheme) {
        appData.theme = savedTheme;
        setTheme(savedTheme);
    }
    
    // Verificar si hay sesión activa
    const savedLogin = localStorage.getItem('colegio_loggedIn');
    if (savedLogin === 'true') {
        appData.isLoggedIn = true;
        updateLoginUI();
    }
    
    // Actualizar estadísticas
    updateStats();
}

// Configurar event listeners
function setupEventListeners() {
    // Menú móvil
    document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);
    
    // Cerrar menú móvil al hacer clic fuera
    document.addEventListener('click', function(event) {
        const mobileMenu = document.getElementById('mobile-menu');
        const menuBtn = document.getElementById('mobile-menu-btn');
        
        if (!mobileMenu.contains(event.target) && !menuBtn.contains(event.target)) {
            mobileMenu.classList.add('hidden');
        }
    });
    
    // Imagen de publicación
    const imageInput = document.getElementById('publication-image');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }
}

// Navegación entre vistas
function showView(viewName) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });
    
    // Desactivar todos los enlaces de navegación
    document.querySelectorAll('.nav-link, .nav-link-mobile').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostrar la vista solicitada
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('active');
        
        // Activar enlace correspondiente
        document.querySelectorAll(`[data-view="${viewName}"]`).forEach(link => {
            link.classList.add('active');
        });
        
        // Actualizar vista específica
        updateViewContent(viewName);
        
        // Cerrar menú móvil si está abierto
        document.getElementById('mobile-menu').classList.add('hidden');
    }
    
    // Guardar vista actual
    appData.currentView = viewName;
}

// Actualizar contenido según la vista
function updateViewContent(viewName) {
    switch(viewName) {
        case 'home':
            updateHomeView();
            break;
        case 'publications':
            updatePublicationsView();
            break;
        case 'subjects':
            updateSubjectsView();
            break;
        case 'resources':
            updateResourcesView();
            break;
        case 'about':
            updateAboutView();
            break;
        case 'admin':
            updateAdminView();
            break;
    }
}

// Vista: INICIO
function updateHomeView() {
    // Actualizar estadísticas
    updateStats();
    
    // Mostrar vista previa de publicaciones
    renderPreviewPublications();
}

function updateStats() {
    document.getElementById('total-subjects').textContent = subjects.length;
    document.getElementById('total-resources').textContent = resources.length;
    document.getElementById('total-publications').textContent = publications.length;
    
    // Actualizar también en admin si está visible
    if (appData.isLoggedIn) {
        document.getElementById('admin-total-subjects').textContent = subjects.length;
        document.getElementById('admin-total-resources').textContent = resources.length;
        document.getElementById('admin-total-publications').textContent = publications.length;
        
        // Calcular total de descargas
        const totalDownloads = resources.reduce((sum, resource) => sum + (resource.downloads || 0), 0);
        document.getElementById('admin-total-downloads').textContent = totalDownloads;
    }
}

function renderPreviewPublications() {
    const container = document.getElementById('preview-publications');
    if (!container) return;
    
    // Mostrar solo las 3 más recientes
    const recentPublications = publications.slice(0, 3);
    
    container.innerHTML = recentPublications.map(pub => `
        <div class="bg-white rounded-xl shadow border p-6 hover:shadow-md transition-shadow cursor-pointer" 
             onclick="showView('publications')">
            <div class="flex items-start justify-between mb-3">
                <h4 class="font-bold text-gray-800 line-clamp-2">${pub.title}</h4>
                <span class="text-xs text-gray-500 whitespace-nowrap ml-2">${pub.date}</span>
            </div>
            <p class="text-gray-600 text-sm line-clamp-3 mb-4">${pub.content}</p>
            <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500">${pub.author}</span>
                <div class="flex items-center space-x-3">
                    <span class="flex items-center">
                        <i data-lucide="heart" class="w-3 h-3 mr-1 text-red-500"></i>
                        ${pub.likes || 0}
                    </span>
                    <span class="flex items-center">
                        <i data-lucide="message-circle" class="w-3 h-3 mr-1 text-blue-500"></i>
                        ${pub.comments || 0}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// Vista: PUBLICACIONES
function updatePublicationsView() {
    renderPublicationsList();
}

function renderPublicationsList() {
    const container = document.getElementById('publications-list');
    if (!container) return;
    
    if (publications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-gray-50 rounded-xl">
                <i data-lucide="newspaper" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h3 class="text-xl font-bold text-gray-700 mb-2">No hay publicaciones</h3>
                <p class="text-gray-600 mb-6">Aún no se han publicado novedades.</p>
                ${appData.isLoggedIn ? `
                <button onclick="showPublicationForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                    Crear primera publicación
                </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    container.innerHTML = publications.map(pub => `
        <div class="bg-white rounded-xl shadow border overflow-hidden hover:shadow-md transition-shadow">
            ${pub.image ? `
            <div class="border-b">
                <img src="${pub.image}" alt="${pub.title}" class="w-full h-48 object-cover">
            </div>
            ` : ''}
            
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${pub.title}</h3>
                    <div class="flex items-center text-sm text-gray-500">
                        <i data-lucide="calendar" class="w-4 h-4 mr-1"></i>
                        ${pub.date} · ${pub.time}
                    </div>
                </div>
                
                <div class="flex items-center space-x-4 mb-4 text-sm">
                    <div class="flex items-center">
                        <i data-lucide="user" class="w-4 h-4 mr-1 text-gray-400"></i>
                        <span class="text-gray-600">${pub.author}</span>
                    </div>
                    <div class="flex items-center">
                        <i data-lucide="map-pin" class="w-4 h-4 mr-1 text-gray-400"></i>
                        <span class="text-gray-600">Colegio Ildefonso Vázquez</span>
                    </div>
                </div>
                
                <p class="text-gray-700 mb-6 whitespace-pre-line">${pub.content}</p>
                
                <!-- Interacciones -->
                <div class="flex items-center justify-between pt-4 border-t">
                    <div class="flex items-center space-x-4">
                        <button onclick="likePublication(${pub.id})" class="flex items-center space-x-1 text-gray-600 hover:text-red-600">
                            <i data-lucide="heart" class="w-5 h-5"></i>
                            <span>${pub.likes || 0}</span>
                        </button>
                        <button onclick="commentOnPublication(${pub.id})" class="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                            <i data-lucide="message-circle" class="w-5 h-5"></i>
                            <span>Comentar</span>
                        </button>
                        <button onclick="sharePublication(${pub.id})" class="flex items-center space-x-1 text-gray-600 hover:text-green-600">
                            <i data-lucide="share-2" class="w-5 h-5"></i>
                            <span>Compartir</span>
                        </button>
                    </div>
                    
                    ${appData.isLoggedIn ? `
                    <div class="flex space-x-2">
                        <button onclick="editPublication(${pub.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deletePublication(${pub.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <i data-lucide="trash" class="w-4 h-4"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Comentarios (se podrían cargar aquí) -->
                <div id="comments-${pub.id}" class="mt-4 hidden">
                    <!-- Los comentarios se cargarían aquí -->
                </div>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// Vista: MATERIAS
function updateSubjectsView() {
    renderSubjectsGrid();
}

function renderSubjectsGrid() {
    const container = document.getElementById('subjects-grid');
    if (!container) return;
    
    // Filtrar materias si hay filtros activos
    let filteredSubjects = [...subjects];
    const gradeFilter = document.getElementById('filter-grade')?.value;
    const searchTerm = document.getElementById('search-subject')?.value.toLowerCase();
    
    if (gradeFilter && gradeFilter !== 'all') {
        filteredSubjects = filteredSubjects.filter(s => s.grade === gradeFilter);
    }
    
    if (searchTerm) {
        filteredSubjects = filteredSubjects.filter(s => 
            s.name.toLowerCase().includes(searchTerm) || 
            s.grade.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filteredSubjects.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 bg-gray-50 rounded-xl">
                <i data-lucide="search-x" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h3 class="text-xl font-bold text-gray-700 mb-2">No se encontraron materias</h3>
                <p class="text-gray-600">Intenta con otros términos de búsqueda.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredSubjects.map(subject => {
        const subjectResources = resources.filter(r => r.subjectId === subject.id);
        
        return `
        <div class="bg-white rounded-xl shadow border p-6 hover:shadow-lg transition-shadow cursor-pointer" 
             onclick="showSubjectResources(${subject.id})">
            <div class="${subject.color} w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-4">
                ${subject.icon}
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${subject.name}</h3>
            <p class="text-gray-600 mb-4">${subject.grade}</p>
            <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">
                    ${subjectResources.length} recurso${subjectResources.length !== 1 ? 's' : ''}
                </span>
                <span class="text-blue-600 font-medium">Ver recursos →</span>
            </div>
        </div>
        `;
    }).join('');
}

function filterSubjects() {
    renderSubjectsGrid();
}

function showSubjectResources(subjectId) {
    appData.activeSubject = subjectId;
    const subject = subjects.find(s => s.id === subjectId);
    
    if (subject) {
        document.getElementById('resources-title').textContent = `Recursos de ${subject.name}`;
        document.getElementById('resources-subtitle').textContent = `${subject.grade} - ${subject.name}`;
    }
    
    showView('resources');
}

// Vista: RECURSOS
function updateResourcesView() {
    renderResourcesList();
}

function renderResourcesList() {
    const container = document.getElementById('resources-list');
    if (!container) return;
    
    if (!appData.activeSubject) {
        container.innerHTML = `
            <div class="text-center py-12 bg-gray-50 rounded-xl">
                <i data-lucide="folder-open" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h3 class="text-xl font-bold text-gray-700 mb-2">Selecciona una materia</h3>
                <p class="text-gray-600 mb-6">Elige una materia de la sección anterior para ver sus recursos disponibles.</p>
                <button onclick="showView('subjects')" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                    Ver materias
                </button>
            </div>
        `;
        return;
    }
    
    const subjectResources = resources.filter(r => r.subjectId === appData.activeSubject);
    const subject = subjects.find(s => s.id === appData.activeSubject);
    
    if (subjectResources.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-gray-50 rounded-xl">
                <i data-lucide="file-x" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h3 class="text-xl font-bold text-gray-700 mb-2">No hay recursos disponibles</h3>
                <p class="text-gray-600 mb-6">Aún no se han subido recursos para ${subject?.name}.</p>
                ${appData.isLoggedIn ? `
                <button onclick="showResourceForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                    Subir primer recurso
                </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    container.innerHTML = subjectResources.map(resource => `
        <div class="bg-white rounded-xl shadow border p-6 hover:shadow-md transition-shadow">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-start justify-between mb-2">
                        <h4 class="text-xl font-bold text-gray-800">${resource.title}</h4>
                        <span class="text-sm text-gray-500 whitespace-nowrap ml-2">${resource.date}</span>
                    </div>
                    
                    <p class="text-gray-600 mb-4">${resource.description || 'Sin descripción'}</p>
                    
                    <div class="flex items-center space-x-4 text-sm">
                        <span class="flex items-center text-gray-500">
                            <i data-lucide="download" class="w-4 h-4 mr-1"></i>
                            ${resource.downloads || 0} descargas
                        </span>
                        <span class="flex items-center text-gray-500">
                            <i data-lucide="heart" class="w-4 h-4 mr-1"></i>
                            ${resource.likes || 0} likes
                        </span>
                    </div>
                </div>
                
                <div class="flex flex-col sm:flex-row md:flex-col gap-2">
                    <a href="${resource.url}" target="_blank" 
                       onclick="trackDownload(${resource.id})"
                       class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center whitespace-nowrap">
                        <i data-lucide="download" class="w-4 h-4 mr-2"></i>
                        Descargar PDF
                    </a>
                    
                    ${appData.isLoggedIn ? `
                    <div class="flex gap-2">
                        <button onclick="editResource(${resource.id})" class="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-lg flex items-center justify-center">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteResource(${resource.id})" class="flex-1 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-lg flex items-center justify-center">
                            <i data-lucide="trash" class="w-4 h-4"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// Vista: ACERCA
function updateAboutView() {
    // Esta vista es estática, no necesita actualización dinámica
}

// Menú móvil
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
}

// Interacciones
function likePublication(publicationId) {
    const publication = publications.find(p => p.id === publicationId);
    if (publication) {
        publication.likes = (publication.likes || 0) + 1;
        savePublications();
        renderPublicationsList();
    }
}

function commentOnPublication(publicationId) {
    const comment = prompt('Escribe tu comentario:');
    if (comment && comment.trim()) {
        // En una implementación real, guardaríamos el comentario
        alert('¡Gracias por tu comentario!');
    }
}

function sharePublication(publicationId) {
    const publication = publications.find(p => p.id === publicationId);
    if (publication && navigator.share) {
        navigator.share({
            title: publication.title,
            text: publication.content.substring(0, 100) + '...',
            url: window.location.href
        });
    } else {
        // Fallback: copiar al portapapeles
        navigator.clipboard.writeText(window.location.href);
        alert('¡Enlace copiado al portapapeles!');
    }
}

function trackDownload(resourceId) {
    const resource = resources.find(r => r.id === resourceId);
    if (resource) {
        resource.downloads = (resource.downloads || 0) + 1;
        saveResources();
        
        // Actualizar estadísticas en tiempo real
        updateStats();
    }
}

// Funciones auxiliares
function saveSubjects() {
    localStorage.setItem('colegio_subjects', JSON.stringify(subjects));
}

function saveResources() {
    localStorage.setItem('colegio_resources', JSON.stringify(resources));
}

function savePublications() {
    localStorage.setItem('colegio_publications', JSON.stringify(publications));
}

// Inicializar cuando se carga la página
window.addEventListener('load', function() {
    loadInitialData();
    setupEventListeners();
});