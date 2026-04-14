import { NEGOCIO_DEFAULT } from "../config/negocio.js";

// Prefijo por negocio (preparado para multi-tenant)
const PREFIX = "tajos";

export async function getBookings() {
  try {
    const raw = localStorage.getItem(`${PREFIX}_bookings`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveBookings(data) {
  try {
    localStorage.setItem(`${PREFIX}_bookings`, JSON.stringify(data));
  } catch {}
}

export async function getBlocked() {
  try {
    const raw = localStorage.getItem(`${PREFIX}_blocked`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveBlocked(data) {
  try {
    localStorage.setItem(`${PREFIX}_blocked`, JSON.stringify(data));
  } catch {}
}

export async function getNegocio() {
  try {
    const raw = localStorage.getItem(`${PREFIX}_config`);
    return raw ? JSON.parse(raw) : NEGOCIO_DEFAULT;
  } catch {
    return NEGOCIO_DEFAULT;
  }
}

export async function saveNegocio(data) {
  try {
    localStorage.setItem(`${PREFIX}_config`, JSON.stringify(data));
  } catch {}
}
