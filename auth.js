// Sistema de autenticación SEGURO con Firebase
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Escuchar cambios en autenticación
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.checkAdminStatus(user.uid);
                this.updateUI(true);
            } else {
                this.currentUser = null;
                this.updateUI(false);
            }
        });
    }

    async checkAdminStatus(uid) {
        try {
            const doc = await db.collection('admin').doc('users').get();
            const adminUsers = doc.data()?.users || {};
            
            if (adminUsers[uid]) {
                localStorage.setItem('isAdmin', 'true');
                return true;
            }
        } catch (error) {
            console.error("Error verificando admin:", error);
        }
        return false;
    }

    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error("Error en login:", error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    async registerAdmin(email, password, adminCode) {
        // Solo el primer admin puede registrar otros admins
        try {
            // Verificar código de administrador
            const configDoc = await db.collection('config').doc('admin').get();
            const config = configDoc.data();
            
            if (adminCode !== config?.registrationCode) {
                return { success: false, error: "Código de administrador inválido" };
            }

            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Agregar a lista de admins
            await db.collection('admin').doc('users').set({
                users: {
                    [userCredential.user.uid]: {
                        email: email,
                        name: "Administrador",
                        created: firebase.firestore.FieldValue.serverTimestamp()
                    }
                }
            }, { merge: true });

            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async logout() {
        try {
            await auth.signOut();
            localStorage.removeItem('isAdmin');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getErrorMessage(errorCode) {
        const messages = {
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/invalid-email': 'Email inválido',
            'auth/email-already-in-use': 'El email ya está registrado',
            'auth/weak-password': 'La contraseña es muy débil',
            'auth/too-many-requests': 'Demasiados intentos, intenta más tarde'
        };
        return messages[errorCode] || 'Error desconocido';
    }

    updateUI(isLoggedIn) {
        const adminBtn = document.getElementById('admin-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const adminElements = document.querySelectorAll('.admin-only');
        
        if (isLoggedIn && localStorage.getItem('isAdmin') === 'true') {
            if (adminBtn) adminBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            adminElements.forEach(el => el.classList.remove('hidden'));
        } else {
            if (adminBtn) adminBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
            adminElements.forEach(el => el.classList.add('hidden'));
        }
    }

    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }
}

// Inicializar
window.authManager = new AuthManager();