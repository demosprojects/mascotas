// ==========================================
// CONFIGURACIÓN DE FIREBASE (CDN - sin bundler)
// ==========================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ⚠️ Reemplazá estos valores por los de tu proyecto en Firebase Console
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
// ELEMENTOS DEL DOM
// ==========================================
const formulario = document.getElementById('formulario-publicar');
const inputFoto = document.getElementById('foto');
const zonaDrop = document.getElementById('zona-drop');
const vistaPrevia = document.getElementById('vista-previa');
const imgPreview = document.getElementById('img-preview');
const btnCambiarFoto = document.getElementById('btn-cambiar-foto');
const btnPublicar = document.getElementById('btn-publicar');
const spinner = document.getElementById('spinner');

// ==========================================
// 1. LÓGICA DE IMAGEN (Vista Previa)
// ==========================================

// Clic en la zona de drop → abre el selector de archivos
zonaDrop.addEventListener('click', () => {
    inputFoto.click();
});

// Cuando el usuario selecciona una imagen
inputFoto.addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
        const urlTemporal = URL.createObjectURL(archivo);
        imgPreview.src = urlTemporal;
        zonaDrop.classList.add('hidden');
        vistaPrevia.classList.remove('hidden');
    }
});

// Botón para cambiar la foto
btnCambiarFoto.addEventListener('click', () => {
    inputFoto.value = '';
    imgPreview.src = '';
    vistaPrevia.classList.add('hidden');
    zonaDrop.classList.remove('hidden');
});

// ==========================================
// 2. SUBIDA A CLOUDINARY
// ==========================================

async function subirImagenACloudinary(archivo) {
    const urlCloudinary = 'https://api.cloudinary.com/v1_1/dhgrivib0/image/upload';
    
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('upload_preset', 'animales');

    const respuesta = await fetch(urlCloudinary, {
        method: 'POST',
        body: formData
    });

    if (!respuesta.ok) throw new Error("Error al subir imagen a Cloudinary");

    const datos = await respuesta.json();
    return datos.secure_url;
}

// ==========================================
// 3. ENVÍO DEL FORMULARIO A FIREBASE
// ==========================================

formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const archivo = inputFoto.files[0];
    if (!archivo) {
        alert("Por favor, seleccioná una foto de la mascota.");
        return;
    }

    // Mostrar spinner y deshabilitar botón
    btnPublicar.disabled = true;
    btnPublicar.classList.add('opacity-75', 'cursor-not-allowed');
    spinner.classList.remove('hidden');

    try {
        // Paso 1: Subir foto a Cloudinary
        const fotoUrl = await subirImagenACloudinary(archivo);

        // Paso 2: Armar los datos
        const datosMascota = {
            estado: document.getElementById('estado').value,
            especie: document.getElementById('especie').value,
            nombre: document.getElementById('nombre').value || "Desconocido",
            sexo: document.getElementById('sexo').value,
            zona: document.getElementById('zona').value,
            contacto: document.getElementById('contacto').value,
            descripcion: document.getElementById('descripcion').value,
            fotoUrl: fotoUrl,
            fechaPublicacion: new Date(),
            activo: true
        };

        // Paso 3: Guardar en Firestore
        const docRef = await addDoc(collection(db, "mascotas"), datosMascota);

        // Guardar el ID en localStorage para identificar avisos propios
        const misAvisos = JSON.parse(localStorage.getItem('misAvisos') || '[]');
        misAvisos.push(docRef.id);
        localStorage.setItem('misAvisos', JSON.stringify(misAvisos));

        // Paso 4: Redirigir
        window.location.href = 'buscar.html';

    } catch (error) {
        console.error("Error al publicar:", error);
        alert("Error al publicar: " + error.message);

        // Restaurar botón
        btnPublicar.disabled = false;
        btnPublicar.classList.remove('opacity-75', 'cursor-not-allowed');
        spinner.classList.add('hidden');
    }
});