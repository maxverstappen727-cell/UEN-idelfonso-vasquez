// Gestión de temas
function toggleDarkMode() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        icon.setAttribute('data-lucide', 'sun');
    } else {
        body.classList.add('dark-mode');
        icon.setAttribute('data-lucide', 'moon');
    }
    
    lucide.createIcons();
}

function setTheme(themeName) {
    const body = document.body;
    
    // Remover todas las clases de tema
    body.classList.remove('dark-mode', 'navidad-mode', 'aniversario-mode');
    
    // Ocultar todas las decoraciones
    document.getElementById('christmas-decorations').classList.add('hidden');
    
    // Ocultar todos los checks de tema
    document.querySelectorAll('[id$="-check"]').forEach(check => {
        check.classList.add('hidden');
    });
    
    // Aplicar nuevo tema
    switch(themeName) {
        case 'navidad':
            body.classList.add('navidad-mode');
            document.getElementById('theme-navidad-check').classList.remove('hidden');
            showChristmasDecorations();
            break;
            
        case 'aniversario':
            body.classList.add('aniversario-mode');
            document.getElementById('theme-aniversario-check').classList.remove('hidden');
            break;
            
        case 'dark':
            body.classList.add('dark-mode');
            document.getElementById('theme-dark-check')?.classList.remove('hidden');
            break;
            
        default:
            document.getElementById('theme-default-check').classList.remove('hidden');
            break;
    }
    
    // Guardar preferencia
    appData.theme = themeName;
    localStorage.setItem('colegio_theme', themeName);
}

function showChristmasDecorations() {
    const container = document.getElementById('christmas-decorations');
    container.classList.remove('hidden');
    
    // Crear copos de nieve
    const snowflakes = container.querySelectorAll('.snowflake');
    snowflakes.forEach((flake, index) => {
        const size = Math.random() * 20 + 10;
        const left = Math.random() * 100;
        const duration = Math.random() * 10 + 5;
        const delay = Math.random() * 5;
        
        flake.style.left = `${left}%`;
        flake.style.fontSize = `${size}px`;
        flake.style.animationDuration = `${duration}s`;
        flake.style.animationDelay = `${delay}s`;
    });
}

function applyCustomColors() {
    const primary = document.getElementById('primary-color').value;
    const secondary = document.getElementById('secondary-color').value;
    
    // Actualizar variables CSS
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--secondary', secondary);
    
    alert('Colores aplicados. Recarga la página para ver los cambios completos.');
}