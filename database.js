// Clase para manejar todas las operaciones de base de datos
class DatabaseManager {
    constructor() {
        this.cache = {
            subjects: null,
            resources: null,
            publications: null,
            schoolInfo: null
        };
        this.listeners = [];
    }

    // ========== MATERIAS ==========
    async getSubjects() {
        if (this.cache.subjects) return this.cache.subjects;
        
        try {
            const snapshot = await db.collection('subjects')
                .orderBy('order', 'asc')
                .get();
            
            this.cache.subjects = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return this.cache.subjects;
        } catch (error) {
            console.error("Error obteniendo materias:", error);
            return [];
        }
    }

    async addSubject(subject) {
        try {
            const docRef = await db.collection('subjects').add({
                ...subject,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.cache.subjects = null; // Invalidar cache
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateSubject(id, data) {
        try {
            await db.collection('subjects').doc(id).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.cache.subjects = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteSubject(id) {
        try {
            // Primero verificar si tiene recursos
            const resources = await this.getResourcesBySubject(id);
            if (resources.length > 0) {
                return { 
                    success: false, 
                    error: "No se puede eliminar, tiene recursos asociados" 
                };
            }
            
            await db.collection('subjects').doc(id).delete();
            this.cache.subjects = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ========== RECURSOS ==========
    async getResources(filters = {}) {
        try {
            let query = db.collection('resources')
                .orderBy('createdAt', 'desc');
            
            // Aplicar filtros
            if (filters.subjectId) {
                query = query.where('subjectId', '==', filters.subjectId);
            }
            
            if (filters.tags && filters.tags.length > 0) {
                query = query.where('tags', 'array-contains-any', filters.tags);
            }
            
            if (filters.search) {
                // Búsqueda por título o descripción
                // Nota: Firestore no soporta búsqueda de texto completo fácilmente
                // En producción usarías Algolia o similar
            }
            
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error obteniendo recursos:", error);
            return [];
        }
    }

    async getResourcesBySubject(subjectId) {
        return this.getResources({ subjectId });
    }

    async addResource(resource) {
        try {
            const docRef = await db.collection('resources').add({
                ...resource,
                downloads: 0,
                likes: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateResource(id, data) {
        try {
            await db.collection('resources').doc(id).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteResource(id) {
        try {
            await db.collection('resources').doc(id).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async incrementDownloads(resourceId) {
        try {
            await db.collection('resources').doc(resourceId).update({
                downloads: firebase.firestore.FieldValue.increment(1),
                lastDownload: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ========== PUBLICACIONES ==========
    async getPublications(limit = null) {
        try {
            let query = db.collection('publications')
                .orderBy('createdAt', 'desc');
            
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            
            this.cache.publications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return this.cache.publications;
        } catch (error) {
            console.error("Error obteniendo publicaciones:", error);
            return [];
        }
    }

    async addPublication(publication) {
        try {
            const docRef = await db.collection('publications').add({
                ...publication,
                likes: 0,
                comments: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.cache.publications = null;
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updatePublication(id, data) {
        try {
            await db.collection('publications').doc(id).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.cache.publications = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deletePublication(id) {
        try {
            await db.collection('publications').doc(id).delete();
            this.cache.publications = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ========== INFORMACIÓN DEL COLEGIO ==========
    async getSchoolInfo() {
        if (this.cache.schoolInfo) return this.cache.schoolInfo;
        
        try {
            const doc = await db.collection('config').doc('school').get();
            this.cache.schoolInfo = doc.exists ? doc.data() : this.getDefaultSchoolInfo();
            return this.cache.schoolInfo;
        } catch (error) {
            console.error("Error obteniendo info del colegio:", error);
            return this.getDefaultSchoolInfo();
        }
    }

    async updateSchoolInfo(data) {
        try {
            await db.collection('config').doc('school').set({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            this.cache.schoolInfo = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getDefaultSchoolInfo() {
        return {
            name: "Colegio Ildefonso Vázquez",
            motto: "Con fe hacia lo alto",
            history: "Fundado en 1985, el Colegio Ildefonso Vázquez ha sido un pilar en la educación de nuestra comunidad...",
            mission: "Formar personas íntegras, críticas y creativas...",
            vision: "Ser reconocidos como una institución educativa líder...",
            address: "Calle Principal #123, Ciudad",
            phone: "(555) 123-4567",
            email: "info@colegioildefonsovazquez.edu",
            schedule: "Lunes a Viernes: 7:00 AM - 4:00 PM",
            developedBy: "Equipo de Desarrollo"
        };
    }

    // ========== ESTADÍSTICAS ==========
    async getStats() {
        try {
            const [subjects, resources, publications] = await Promise.all([
                this.getSubjects(),
                this.getResources(),
                this.getPublications()
            ]);
            
            // Calcular descargas totales
            const totalDownloads = resources.reduce((sum, res) => sum + (res.downloads || 0), 0);
            
            return {
                totalSubjects: subjects.length,
                totalResources: resources.length,
                totalPublications: publications.length,
                totalDownloads: totalDownloads
            };
        } catch (error) {
            console.error("Error obteniendo estadísticas:", error);
            return {
                totalSubjects: 0,
                totalResources: 0,
                totalPublications: 0,
                totalDownloads: 0
            };
        }
    }

    // ========== SUSCRIPCIONES EN TIEMPO REAL ==========
    subscribeToUpdates(callback) {
        const unsubscribeFunctions = [];
        
        // Suscribirse a cambios en materias
        const subjectsUnsub = db.collection('subjects')
            .onSnapshot(() => {
                this.cache.subjects = null;
                callback('subjects');
            });
        
        // Suscribirse a cambios en recursos
        const resourcesUnsub = db.collection('resources')
            .onSnapshot(() => {
                callback('resources');
            });
        
        // Suscribirse a cambios en publicaciones
        const publicationsUnsub = db.collection('publications')
            .onSnapshot(() => {
                this.cache.publications = null;
                callback('publications');
            });
        
        unsubscribeFunctions.push(subjectsUnsub, resourcesUnsub, publicationsUnsub);
        
        // Devolver función para desuscribirse
        return () => unsubscribeFunctions.forEach(unsub => unsub());
    }
}

// Inicializar
window.dbManager = new DatabaseManager();