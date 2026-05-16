// ==========================================
// CONFIGURACIÓN DE FIREBASE (CDN - sin bundler)
// ==========================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, doc, getDoc, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDifPO2hBUo3PEOVnFygUeVk47J8BE-Tjk",
    authDomain: "animales-2b9a2.firebaseapp.com",
    projectId: "animales-2b9a2",
    storageBucket: "animales-2b9a2.firebasestorage.app",
    messagingSenderId: "291985164512",
    appId: "1:291985164512:web:22259511bb47b922926885"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// PARAMS DE URL Y ELEMENTOS DEL DOM
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const mascotaId = urlParams.get('id');

const cargandoDatos = document.getElementById('cargando-datos');
const contenedorResolucion = document.getElementById('contenedor-resolucion');
const mensajeExito = document.getElementById('mensaje-exito');
const formulario = document.getElementById('formulario-resolucion');
const btnEnviar = document.getElementById('btn-enviar-resolucion');
const spinner = document.getElementById('spinner');

let nombreMascota = "Mascota";

// ==========================================
// CARGA DE DATOS DE LA MASCOTA
// ==========================================
async function cargarDatosParaConfirmar() {
    if (!mascotaId) {
        cargandoDatos.innerHTML = '<p class="text-red-500">Error: No se encontró la mascota. Volvé a la cartelera.</p>';
        return;
    }

    try {
        const docRef = doc(db, "mascotas", mascotaId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const mascota = docSnap.data();
            nombreMascota = mascota.nombre;

            document.getElementById('res-foto').src = mascota.fotoUrl;
            document.getElementById('res-nombre').textContent = mascota.nombre;
            document.getElementById('res-detalle').textContent = `${mascota.estado} en ${mascota.zona}`;

            cargandoDatos.classList.add('hidden');
            contenedorResolucion.classList.remove('hidden');
        } else {
            cargandoDatos.innerHTML = '<p class="text-red-500">La publicación ya no existe o fue eliminada.</p>';
        }
    } catch (error) {
        console.error("Error al buscar mascota:", error);
        cargandoDatos.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
}

// ==========================================
// ENVÍO DEL FORMULARIO
// ==========================================
formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnEnviar.disabled = true;
    btnEnviar.classList.add('opacity-75', 'cursor-not-allowed');
    spinner.classList.remove('hidden');

    try {
        const solicitud = {
            mascotaId: mascotaId,
            nombreMascota: nombreMascota,
            motivo: document.getElementById('motivo').value,
            comentario: document.getElementById('comentario').value,
            fechaAviso: new Date(),
            resueltaPorAdmin: false
        };

        await addDoc(collection(db, "solicitudes_baja"), solicitud);

        contenedorResolucion.classList.add('hidden');
        mensajeExito.classList.remove('hidden');

    } catch (error) {
        console.error("Error al enviar solicitud:", error);
        alert("Error: " + error.message);
        btnEnviar.disabled = false;
        btnEnviar.classList.remove('opacity-75', 'cursor-not-allowed');
        spinner.classList.add('hidden');
    }
});

cargarDatosParaConfirmar();