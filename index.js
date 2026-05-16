// ==========================================
// CONFIGURACIÓN DE FIREBASE (CDN - sin bundler)
// ==========================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, getDoc, doc, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
const contenedorUltimos = document.getElementById('ultimos-avisos');

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

    // Intentar con la Clipboard API moderna (requiere HTTPS o localhost)
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(link);
            mostrarCopiado();
            return;
        } catch {
            // cae al fallback
        }
    }

    // Fallback universal sin alert: input temporal fuera de pantalla
    try {
        const input = document.createElement('input');
        input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
        input.value = link;
        document.body.appendChild(input);
        input.focus();
        input.select();
        input.setSelectionRange(0, input.value.length); // necesario en iOS
        document.execCommand('copy');
        document.body.removeChild(input);
        mostrarCopiado();
    } catch {
        // Si absolutamente nada funciona, toast discreto en lugar de alert
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

    const cerrarLb = () => {
        lb.style.display = 'none';
        // Solo desbloquear scroll si el modal también está cerrado
        if (!document.getElementById('modal-publicacion')?.classList.contains('abierto')) {
            desbloquearScroll();
        }
    };
    lb.addEventListener('click', cerrarLb);
    document.getElementById('lightbox-cerrar').addEventListener('click', (e) => { e.stopPropagation(); cerrarLb(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.style.display === 'flex') cerrarLb(); });
}

function abrirLightbox(src, alt) {
    const lb = document.getElementById('lightbox');
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox-img').alt = alt || '';
    lb.style.display = 'flex';
    bloquearScroll();
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
// SCROLL LOCK (sin salto de layout)
// ==========================================
function bloquearScroll() {
    if (document.body.dataset.scrollLocked) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll'; // evita reflow por scrollbar
    document.body.dataset.scrollLocked = '1';
    document.body.dataset.scrollY = scrollY;
}

function desbloquearScroll() {
    if (!document.body.dataset.scrollLocked) return;
    const scrollY = parseInt(document.body.dataset.scrollY || '0');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflowY = '';
    delete document.body.dataset.scrollLocked;
    window.scrollTo(0, scrollY);
}

// ==========================================
// MODAL DE PUBLICACIÓN
// ==========================================
function crearModal() {
    if (document.getElementById('modal-publicacion')) return document.getElementById('modal-publicacion');

    const style = document.createElement('style');
    style.textContent = `
        #modal-publicacion {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 100;
            align-items: center;
            justify-content: center;
            padding: 16px;
            box-sizing: border-box;
        }
        #modal-publicacion.abierto {
            display: flex;
        }
        #modal-inner {
            position: relative;
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.35);
            width: 100%;
            max-width: 448px;
            /* dvh = dynamic viewport height: respeta la barra de dirección de iOS/Android */
            max-height: min(90dvh, 90vh);
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
        }
    `;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'modal-publicacion';
    modal.innerHTML = `
        <div id="modal-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,0.62);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);"></div>
        <div id="modal-inner">
            <button id="modal-cerrar" style="position:absolute;top:12px;right:12px;z-index:10;background:white;border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.15);">
                <svg width="16" height="16" fill="none" stroke="#64748b" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            <div id="modal-contenido">
                <div style="padding:48px;text-align:center;color:#94a3b8;">Cargando publicación...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('modal-overlay').addEventListener('click', cerrarModal);
    document.getElementById('modal-cerrar').addEventListener('click', cerrarModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

    return modal;
}

function cerrarModal() {
    const modal = document.getElementById('modal-publicacion');
    if (!modal) return;
    modal.classList.remove('abierto');
    desbloquearScroll();
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url);
}

window.cerrarModalGlobal = cerrarModal;

function renderizarModal(id, mascota) {
    const linkWsp = generarLinkWhatsApp(mascota.contacto, mascota.nombre, mascota.estado, mascota.zona);
    const contenido = document.getElementById('modal-contenido');
    contenido.innerHTML = `
        <div style="position:relative;">
            <div class="${colorBadge(mascota.estado)}" style="position:absolute;top:12px;left:12px;z-index:1;color:white;font-size:0.7rem;font-weight:700;padding:6px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:0.05em;box-shadow:0 2px 6px rgba(0,0,0,0.2);">
                ${labelEstado(mascota.estado)}
            </div>
            <div style="aspect-ratio:4/3;width:100%;background:#e2e8f0;overflow:hidden;border-radius:20px 20px 0 0;cursor:zoom-in;"
                 onclick="abrirLightbox('${mascota.fotoUrl}', 'Foto de ${mascota.nombre}')">
                <img src="${mascota.fotoUrl}" alt="Foto de ${mascota.nombre}" style="width:100%;height:100%;object-fit:cover;pointer-events:none;display:block;">
            </div>
        </div>
        <div style="padding:24px;">
            <h2 class="font-title" style="font-size:1.5rem;font-weight:700;color:#0f172a;text-transform:capitalize;margin:0 0 4px;">${mascota.nombre}</h2>
            <p style="font-size:0.875rem;color:#94a3b8;text-transform:capitalize;margin:0 0 14px;">${mascota.especie} • ${mascota.sexo}</p>
            <div style="display:flex;align-items:center;gap:4px;color:#475569;font-size:0.875rem;margin-bottom:16px;">
                <svg width="16" height="16" fill="none" stroke="#94a3b8" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                ${mascota.zona}
            </div>
            ${mascota.descripcion ? `<p style="font-size:0.875rem;color:#475569;line-height:1.65;margin:0 0 20px;">${mascota.descripcion}</p>` : ''}
            <div style="display:flex;flex-direction:column;gap:8px;">
                <a href="${linkWsp}" target="_blank" style="background:#25D366;color:white;font-weight:500;padding:12px 16px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>
                    Tengo información
                </a>
                <div style="display:flex;gap:8px;">
                    <a href="resolucion.html?id=${id}&estado=${mascota.estado}" style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-weight:500;padding:10px 8px;border-radius:12px;text-align:center;font-size:0.8rem;text-decoration:none;">
                        ¿Ya se resolvió?
                    </a>
                    <button onclick="copiarLinkCard('${id}', this)" style="display:flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-weight:500;padding:10px 12px;border-radius:12px;font-size:0.8rem;cursor:pointer;white-space:nowrap;">
                        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                        </svg>
                        Compartir
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function abrirModalPorId(id) {
    const modal = crearModal();
    modal.classList.add('abierto');
    bloquearScroll();

    try {
        const docRef = doc(db, "mascotas", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || !docSnap.data().activo) {
            document.getElementById('modal-contenido').innerHTML = `
                <div style="padding:48px;text-align:center;">
                    <p style="color:#94a3b8;margin-bottom:16px;">Esta publicación ya no está disponible.</p>
                    <button onclick="cerrarModalGlobal()" style="color:#14b8a6;font-weight:500;background:none;border:none;cursor:pointer;font-size:1rem;">Cerrar</button>
                </div>
            `;
            return;
        }

        renderizarModal(id, docSnap.data());
    } catch {
        document.getElementById('modal-contenido').innerHTML = `
            <div style="padding:48px;text-align:center;color:#ef4444;">Error al cargar la publicación.</div>
        `;
    }
}

// ==========================================
// CARGA DE ÚLTIMOS AVISOS
// ==========================================
async function cargarUltimosAvisos() {
    try {
        const q = query(
            collection(db, "mascotas"),
            where("activo", "==", true),
            orderBy("fechaPublicacion", "desc"),
            limit(4)
        );

        const snapshot = await getDocs(q);
        contenedorUltimos.innerHTML = '';

        if (snapshot.empty) {
            contenedorUltimos.innerHTML = '<p class="text-center col-span-full text-slate-500 py-4">Aún no hay publicaciones. ¡Sé el primero en ayudar!</p>';
            return;
        }

        snapshot.forEach((docSnap) => {
            contenedorUltimos.innerHTML += crearCardHTML(docSnap.id, docSnap.data());
        });

    } catch (error) {
        console.error("Error al cargar últimos avisos:", error);
        contenedorUltimos.innerHTML = `<p class="text-center col-span-full text-red-500 py-4">Error: ${error.message}</p>`;
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
crearModal();
crearLightbox();
cargarUltimosAvisos();

// Abrir modal si la URL trae ?id=
const params = new URLSearchParams(window.location.search);
const idDesdeUrl = params.get('id');
if (idDesdeUrl) {
    abrirModalPorId(idDesdeUrl);
}