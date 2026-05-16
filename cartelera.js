// ==========================================
// CONFIGURACIÓN DE FIREBASE (CDN - sin bundler)
// ==========================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
const contenedorMascotas = document.getElementById('contenedor-mascotas');

// ==========================================
// UTILIDADES
// ==========================================
function generarLinkWhatsApp(numero, nombre, estado, zona) {
    const numeroLimpio = numero.replace(/\D/g, '');
    const mensaje = `Hola! Vi tu publicación en Buscando Mi Mascota. Te escribo por ${nombre !== "Desconocido" ? nombre : 'el animalito'} (${estado}) en la zona de ${zona}.`;
    return `https://wa.me/549${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
}

function colorBadge(estado) {
    if (estado === 'encontrado') return 'bg-teal-500';
    if (estado === 'adopcion') return 'bg-purple-500';
    return 'bg-amber-500';
}

function labelEstado(estado) {
    if (estado === 'encontrado') return 'Encontrado';
    if (estado === 'adopcion') return 'Adopción';
    return 'Perdido';
}

// El link de compartir apunta siempre a index.html?id=xxx
function generarLinkCompartir(id) {
    const origen = window.location.origin;
    const carpeta = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    return `${origen}${carpeta}index.html?id=${id}`;
}

// ==========================================
// COPIAR LINK — sin alert, funciona en mobile
// ==========================================
async function copiarLink(id, btn) {
    const link = generarLinkCompartir(id);
    const original = btn.innerHTML;

    const mostrarCopiado = () => {
        btn.innerHTML = `
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            ¡Copiado!
        `;
        btn.classList.add('text-teal-600', 'border-teal-300');
        setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('text-teal-600', 'border-teal-300');
        }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(link);
            mostrarCopiado();
            return;
        } catch {
            // cae al fallback
        }
    }

    // Fallback sin alert: input temporal fuera de pantalla
    try {
        const input = document.createElement('input');
        input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
        input.value = link;
        document.body.appendChild(input);
        input.focus();
        input.select();
        input.setSelectionRange(0, input.value.length); // iOS
        document.execCommand('copy');
        document.body.removeChild(input);
        mostrarCopiado();
    } catch {
        mostrarToast('No se pudo copiar automáticamente.');
    }
}

function mostrarToast(mensaje) {
    const existing = document.getElementById('toast-copia');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toast-copia';
    toast.textContent = mensaje;
    toast.style.cssText = `
        position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
        background:#1e293b;color:white;padding:12px 20px;border-radius:12px;
        font-size:14px;z-index:9999;max-width:90vw;text-align:center;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);pointer-events:none;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

window.copiarLinkCard = copiarLink;

// ==========================================
// LIGHTBOX DE IMAGEN
// ==========================================
function crearLightbox() {
    if (document.getElementById('lightbox')) return;
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.style.cssText = `
        display:none;position:fixed;inset:0;z-index:200;
        background:rgba(0,0,0,0.93);align-items:center;justify-content:center;
        padding:16px;cursor:zoom-out;
    `;
    lb.innerHTML = `
        <button id="lightbox-cerrar" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.12);border:none;border-radius:50%;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg width="20" height="20" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
        <img id="lightbox-img" src="" alt="" style="max-width:100%;max-height:90dvh;object-fit:contain;border-radius:12px;pointer-events:none;display:block;">
    `;
    document.body.appendChild(lb);

    const cerrar = () => {
        lb.style.display = 'none';
        document.body.style.overflow = '';
    };
    lb.addEventListener('click', cerrar);
    document.getElementById('lightbox-cerrar').addEventListener('click', (e) => { e.stopPropagation(); cerrar(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.style.display === 'flex') cerrar(); });
}

function abrirLightbox(src, alt) {
    const lb = document.getElementById('lightbox');
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox-img').alt = alt || '';
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

window.abrirLightbox = abrirLightbox;

// ==========================================
// CARD HTML
// ==========================================
function crearCardHTML(id, mascota) {
    const linkWsp = generarLinkWhatsApp(mascota.contacto, mascota.nombre, mascota.estado, mascota.zona);
    return `
    <article class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative flex flex-col">
        <div class="absolute top-3 right-3 ${colorBadge(mascota.estado)} text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm z-10">
            ${labelEstado(mascota.estado)}
        </div>
        <div class="aspect-[4/3] w-full bg-slate-200 relative overflow-hidden cursor-zoom-in"
             onclick="abrirLightbox('${mascota.fotoUrl}', 'Foto de ${mascota.nombre}')">
            <img src="${mascota.fotoUrl}" alt="Foto de ${mascota.nombre}" class="object-cover w-full h-full pointer-events-none">
        </div>
        <div class="p-5 flex-grow flex flex-col">
            <div class="mb-2">
                <h3 class="font-title text-xl font-bold text-slate-900 leading-tight capitalize">${mascota.nombre}</h3>
                <p class="text-sm text-slate-500 capitalize">${mascota.especie} • ${mascota.sexo}</p>
            </div>
            <div class="flex items-center text-slate-600 text-sm mb-3">
                <svg class="w-4 h-4 mr-1 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="truncate">${mascota.zona}</span>
            </div>
            <p class="text-sm text-slate-600 line-clamp-2 mb-4">${mascota.descripcion || 'Sin descripción adicional.'}</p>
            <div class="mt-auto flex flex-col gap-2">
                <a href="${linkWsp}" target="_blank" class="w-full bg-[#25D366] hover:bg-[#20b858] text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>
                    Tengo información
                </a>
                <div class="flex gap-2">
                    <a href="resolucion.html?id=${id}&estado=${mascota.estado}" class="flex-1 bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium py-2 rounded-xl text-center text-sm transition-colors">
                        ¿Ya se resolvió?
                    </a>
                    <button onclick="copiarLinkCard('${id}', this)" class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium py-2 px-3 rounded-xl text-sm transition-colors whitespace-nowrap">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                        </svg>
                        Compartir
                    </button>
                </div>
            </div>
        </div>
    </article>
    `;
}

// ==========================================
// CARGA Y FILTRADO
// ==========================================
let todasLasMascotas = [];

async function cargarMascotas() {
    contenedorMascotas.innerHTML = '<p class="text-center col-span-full text-slate-500 py-10">Cargando...</p>';

    try {
        const q = query(collection(db, "mascotas"), where("activo", "==", true));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            contenedorMascotas.innerHTML = '<p class="text-center col-span-full text-slate-500 py-10">Aún no hay publicaciones activas.</p>';
            return;
        }

        todasLasMascotas = [];
        snapshot.forEach((doc) => {
            todasLasMascotas.push({ id: doc.id, ...doc.data() });
        });

        renderizarMascotas(todasLasMascotas);

    } catch (error) {
        console.error("Error al cargar mascotas:", error);
        contenedorMascotas.innerHTML = `<p class="text-center col-span-full text-red-500 py-10">Error: ${error.message}</p>`;
    }
}

function renderizarMascotas(lista) {
    if (lista.length === 0) {
        contenedorMascotas.innerHTML = '<p class="text-center col-span-full text-slate-500 py-10">No hay publicaciones en esta categoría.</p>';
        return;
    }
    contenedorMascotas.innerHTML = lista.map(m => crearCardHTML(m.id, m)).join('');
}

// ==========================================
// FILTROS
// ==========================================
document.querySelectorAll('[data-filtro]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filtro]').forEach(b => {
            b.classList.remove('bg-slate-800', 'text-white');
            b.classList.add('bg-white', 'text-slate-600');
        });
        btn.classList.add('bg-slate-800', 'text-white');
        btn.classList.remove('bg-white', 'text-slate-600');

        const filtro = btn.dataset.filtro;
        if (filtro === 'todos') {
            renderizarMascotas(todasLasMascotas);
        } else {
            renderizarMascotas(todasLasMascotas.filter(m => m.estado === filtro));
        }
    });
});

// ==========================================
// INICIALIZACIÓN
// ==========================================
crearLightbox();
cargarMascotas();