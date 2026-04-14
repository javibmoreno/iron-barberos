import { supabase } from "../config/supabase.js";
import { NEGOCIO_DEFAULT } from "../config/negocio.js";

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

export async function getBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("creado_en", { ascending: true });
  if (error) { console.error("getBookings:", error); return []; }
  return data.map(row => ({
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    barbero: row.barbero,
    servicio: row.servicio,
    precio: row.precio,
    fecha: row.fecha,
    hora: row.hora,
    status: row.status,
    source: row.source,
    creadoEn: row.creado_en,
  }));
}

export async function saveBookings(bookings) {
  // Upsert toda la lista. Supabase hace insert o update según el id.
  const rows = bookings.map(b => ({
    id: b.id,
    nombre: b.nombre,
    telefono: b.telefono,
    barbero: b.barbero,
    servicio: b.servicio,
    precio: b.precio,
    fecha: b.fecha,
    hora: b.hora,
    status: b.status,
    source: b.source,
    creado_en: b.creadoEn,
  }));
  const { error } = await supabase.from("bookings").upsert(rows);
  if (error) console.error("saveBookings:", error);
}

// ─── BLOCKED SLOTS ────────────────────────────────────────────────────────────

export async function getBlocked() {
  const { data, error } = await supabase.from("blocked_slots").select("slot_key");
  if (error) { console.error("getBlocked:", error); return []; }
  return data.map(row => row.slot_key);
}

export async function saveBlocked(blocked) {
  // 1. Borrar todos los existentes
  const { error: delError } = await supabase
    .from("blocked_slots")
    .delete()
    .neq("slot_key", "__never__"); // borra todo
  if (delError) { console.error("saveBlocked delete:", delError); return; }

  // 2. Insertar la nueva lista
  if (blocked.length === 0) return;
  const rows = blocked.map(key => ({ slot_key: key }));
  const { error } = await supabase.from("blocked_slots").insert(rows);
  if (error) console.error("saveBlocked insert:", error);
}

// ─── NEGOCIO CONFIG ───────────────────────────────────────────────────────────

export async function getNegocio() {
  const { data, error } = await supabase
    .from("negocio_config")
    .select("data")
    .eq("id", 1)
    .single();
  if (error || !data) return NEGOCIO_DEFAULT;
  return data.data;
}

export async function saveNegocio(config) {
  const { error } = await supabase
    .from("negocio_config")
    .upsert({ id: 1, data: config });
  if (error) console.error("saveNegocio:", error);
}
