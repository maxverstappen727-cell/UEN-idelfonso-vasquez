// Configuración de Firebase - REEMPLAZA CON TUS DATOS
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID",
    measurementId: "TU_MEASUREMENT_ID"
};

// Inicializar Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    console.log("Firebase inicializado correctamente");
} catch (error) {
    console.error("Error inicializando Firebase:", error);
}

// Exportar servicios
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Configuración de Firestore
const settings = { timestampsInSnapshots: true };
db.settings(settings);

// Exportar
window.db = db;
window.auth = auth;
window.storage = storage;
window.firebase = firebase;