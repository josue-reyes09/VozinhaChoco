"use strict";

const CLAVE = "grandsport_solicitudes";

// Referencias al DOM (getElementById / querySelector)
const form = document.getElementById("formContacto");
const campos = {
  nombre: document.getElementById("nombre"),
  correo: document.getElementById("correo"),
  telefono: document.getElementById("telefono"),
  descripcion: document.getElementById("descripcion"),
};
const contador = document.getElementById("contador");
const confirmacion = document.getElementById("confirmacion");
const resumen = document.getElementById("resumen");
const lista = document.getElementById("listaSolicitudes");

const MAX = campos.descripcion.maxLength; // 300
const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const regexTelefono = /^[0-9 +()\-]{10,15}$/;

/* ---------- localStorage ---------- */
function leerSolicitudes() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || [];
  } catch {
    return [];
  }
}

function guardarSolicitud(datos) {
  const solicitudes = leerSolicitudes();
  solicitudes.push(datos);
  localStorage.setItem(CLAVE, JSON.stringify(solicitudes));
}

function folioDe(solicitud, indice) {
  return solicitud.folio || `GS-${String(indice + 1).padStart(4, "0")}`;
}

function mostrarSolicitudes() {
  const solicitudes = leerSolicitudes();
  lista.innerHTML = "";
  resumen.hidden = solicitudes.length === 0;

  // Más recientes primero; cada una es un botón que abre su detalle
  solicitudes.map((s, i) => ({ s, i })).reverse().forEach(({ s, i }) => {
    const li = document.createElement("li");
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn btn-link p-0 text-start";
    boton.dataset.indice = i;
    boton.textContent = `${folioDe(s, i)} · ${s.nombre} · ${new Date(s.fecha).toLocaleDateString("es-MX")}`;
    li.appendChild(boton);
    lista.appendChild(li);
  });
}

/* ---------- Detalle de la solicitud (modal de Bootstrap) ---------- */
const modalEl = document.getElementById("modalSolicitud");
const modal = new bootstrap.Modal(modalEl);
let indiceAbierto = null;

function abrirSolicitud(indice) {
  const solicitudes = leerSolicitudes();
  const s = solicitudes[indice];
  if (!s) return;

  indiceAbierto = indice;
  document.getElementById("dFolio").textContent = folioDe(s, indice);
  document.getElementById("dFecha").textContent = new Date(s.fecha).toLocaleString("es-MX");
  document.getElementById("dNombre").textContent = s.nombre;
  document.getElementById("dCorreo").textContent = s.correo;
  document.getElementById("dTelefono").textContent = s.telefono;
  document.getElementById("dDescripcion").textContent = s.descripcion;
  modal.show();
}

lista.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-indice]");
  if (boton) abrirSolicitud(Number(boton.dataset.indice));
});

document.getElementById("btnEliminar").addEventListener("click", () => {
  if (indiceAbierto === null) return;
  if (!confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer.")) return;

  const solicitudes = leerSolicitudes();
  solicitudes.splice(indiceAbierto, 1);
  localStorage.setItem(CLAVE, JSON.stringify(solicitudes));
  indiceAbierto = null;
  modal.hide();
  confirmacion.hidden = true;
  mostrarSolicitudes();
});

/* ---------- Evento input: contador de caracteres ---------- */
campos.descripcion.addEventListener("input", () => {
  const largo = campos.descripcion.value.length;
  contador.textContent = `${largo} / ${MAX}`;
  contador.classList.toggle("limit", largo >= MAX);
});

/* ---------- Validación ---------- */
function validarCampo(nombre) {
  const campo = campos[nombre];
  const valor = campo.value.trim();
  let valido = valor !== "";

  if (nombre === "nombre") valido = valor.length >= 3;
  if (nombre === "correo") valido = regexCorreo.test(valor);
  if (nombre === "telefono") valido = regexTelefono.test(valor) && valor.replace(/\D/g, "").length >= 10;
  if (nombre === "descripcion") valido = valor.length >= 10;

  campo.classList.toggle("is-invalid", !valido);
  campo.classList.toggle("is-valid", valido);
  return valido;
}

// Validar al salir de cada campo y limpiar el error al corregirlo
Object.keys(campos).forEach((nombre) => {
  campos[nombre].addEventListener("blur", () => validarCampo(nombre));
  campos[nombre].addEventListener("input", () => {
    if (campos[nombre].classList.contains("is-invalid")) validarCampo(nombre);
  });
});

/* ---------- Evento submit ---------- */
form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  confirmacion.hidden = true;

  const resultados = Object.keys(campos).map(validarCampo);
  if (resultados.includes(false)) {
    form.querySelector(".is-invalid").focus();
    return;
  }

  const datos = {
    nombre: campos.nombre.value.trim(),
    correo: campos.correo.value.trim(),
    telefono: campos.telefono.value.trim(),
    descripcion: campos.descripcion.value.trim(),
    fecha: new Date().toISOString(),
    folio: "GS-" + Date.now().toString(36).toUpperCase().slice(-5),
  };

  guardarSolicitud(datos);
  const indiceNuevo = leerSolicitudes().length - 1;

  // Mensaje de confirmación (modificación del DOM)
  confirmacion.textContent = `Gracias, ${datos.nombre.split(" ")[0]}. Recibimos tu solicitud ${datos.folio} y te contactaremos al correo ${datos.correo}. `;
  const verBtn = document.createElement("button");
  verBtn.type = "button";
  verBtn.className = "btn btn-sm btn-success ms-1";
  verBtn.textContent = "Ver mi solicitud";
  verBtn.addEventListener("click", () => abrirSolicitud(indiceNuevo));
  confirmacion.appendChild(verBtn);
  confirmacion.hidden = false;

  form.reset();
  Object.values(campos).forEach((c) => c.classList.remove("is-valid", "is-invalid"));
  contador.textContent = `0 / ${MAX}`;
  contador.classList.remove("limit");
  mostrarSolicitudes();
});

// Mostrar las solicitudes ya guardadas al cargar la página
mostrarSolicitudes();
