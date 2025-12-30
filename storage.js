// Clase para manejar la subida de imágenes
class StorageManager {
    constructor() {
        this.storage = storage;
    }

    async uploadImage(file, folder = 'publications') {
        try {
            // Validar archivo
            if (!file.type.startsWith('image/')) {
                throw new Error('Solo se permiten archivos de imagen');
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB máximo
                throw new Error('La imagen no debe superar los 10MB');
            }
            
            // Crear nombre único
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileName = `${folder}/${timestamp}_${randomString}_${file.name}`;
            
            // Referencia en Storage
            const storageRef = this.storage.ref(fileName);
            
            // Subir archivo
            const uploadTask = storageRef.put(file);
            
            // Retornar promesa
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        // Mostrar progreso si es necesario
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Subiendo: ${progress}%`);
                    },
                    (error) => {
                        reject(error);
                    },
                    async () => {
                        // Obtener URL de descarga
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        resolve({
                            url: downloadURL,
                            path: fileName,
                            name: file.name,
                            size: file.size,
                            type: file.type
                        });
                    }
                );
            });
            
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            throw error;
        }
    }

    async deleteImage(imageUrl) {
        try {
            // Extraer path de la URL
            const path = this.extractPathFromUrl(imageUrl);
            if (!path) return;
            
            const storageRef = this.storage.ref(path);
            await storageRef.delete();
            return { success: true };
        } catch (error) {
            console.error("Error eliminando imagen:", error);
            return { success: false, error: error.message };
        }
    }

    extractPathFromUrl(url) {
        try {
            const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
            const startIndex = url.indexOf(baseUrl) + baseUrl.length;
            const endIndex = url.indexOf('?');
            
            if (startIndex === -1 || endIndex === -1) return null;
            
            const pathWithBucket = url.substring(startIndex, endIndex);
            const slashIndex = pathWithBucket.indexOf('/');
            
            if (slashIndex === -1) return null;
            
            return decodeURIComponent(pathWithBucket.substring(slashIndex + 1));
        } catch (error) {
            return null;
        }
    }

    // Generar URL optimizada (con parámetros de tamaño)
    getOptimizedImageUrl(originalUrl, width = 800, height = 600) {
        // Firebase Storage no tiene transformaciones nativas
        // En producción usarías Cloud Functions o un CDN
        return originalUrl;
    }

    // Previsualización local
    createLocalPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }
}

// Inicializar
window.storageManager = new StorageManager();