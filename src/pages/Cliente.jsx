import { useState, useEffect } from "react";
import { C, font, mono } from "../design/tokens.js";
import { getBookings, saveBookings, getBlocked, getNegocio } from "../storage/index.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatPrice(p) {
  return "Gs. " + p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseTime(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function generateSlots(horario) {
  const slots = [];
  const startMin = parseTime(horario.inicio);
  const endMin = parseTime(horario.fin);
  const step = horario.slotMinutos;
  let cur = startMin;
  while (cur < endMin) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    cur += step;
  }
  return slots;
}

function getWeekDates(diasSemana) {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  }).filter(d => {
    const dow = new Date(d + "T12:00:00").getDay();
    return diasSemana.includes(dow);
  });
}

function fmtDate(d) {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const dt = new Date(d + "T12:00:00");
  return `${days[dt.getDay()]} ${dt.getDate()} ${months[dt.getMonth()]}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function calcEndTime(startSlot, totalSlots, slotMinutos) {
  const endMin = parseTime(startSlot) + totalSlots * slotMinutos;
  return `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
}

function isSlotOccupied(slot, barbero, fecha, bookings, blocked, allSlots) {
  const idx = allSlots.indexOf(slot);
  const bookedHere = bookings.some(b => {
    if (b.fecha !== fecha || b.barbero !== barbero || b.status === "cancelled") return false;
    const bIdx = allSlots.indexOf(b.hora);
    // A booking occupies its start slot plus the next one (legacy 2-slot assumption)
    return bIdx === idx || bIdx === idx - 1;
  });
  const blockedHere = blocked.includes(`${fecha}__${slot}__${barbero}`);
  return bookedHere || blockedHere;
}

// services = array of service objects; checks totalSlots consecutive free slots
function isSlotAvailableForService(slot, barbero, fecha, services, bookings, blocked, allSlots) {
  const totalSlots = services.reduce((a, s) => a + s.slots, 0);
  const startIdx = allSlots.indexOf(slot);
  if (startIdx < 0 || startIdx + totalSlots > allSlots.length) return false;
  for (let i = 0; i < totalSlots; i++) {
    if (isSlotOccupied(allSlots[startIdx + i], barbero, fecha, bookings, blocked, allSlots)) return false;
  }
  return true;
}

function getAvailableSlotsForBarber(barbero, fecha, services, bookings, blocked, allSlots) {
  const cutoff = fecha === todayStr() ? nowMinutes() + 30 : -1;
  return allSlots.filter(s =>
    (cutoff < 0 || parseTime(s) > cutoff) &&
    isSlotAvailableForService(s, barbero, fecha, services, bookings, blocked, allSlots)
  );
}

function getBestBarber(fecha, slot, services, bookings, blocked, barberos, allSlots) {
  const available = barberos.filter(name =>
    isSlotAvailableForService(slot, name, fecha, services, bookings, blocked, allSlots)
  );
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function getSlotsWithAnyBarber(fecha, services, bookings, blocked, barberos, allSlots) {
  const cutoff = fecha === todayStr() ? nowMinutes() + 30 : -1;
  return allSlots.filter(slot =>
    (cutoff < 0 || parseTime(slot) > cutoff) &&
    barberos.some(name =>
      isSlotAvailableForService(slot, name, fecha, services, bookings, blocked, allSlots)
    )
  );
}

// ─── SERVICE ICONS ────────────────────────────────────────────────────────────
const SERVICE_ICONS = {
  "Corte de cabello": "✂️",
  "Retoque de barba": "🪒",
  "Barba con ritual": "🪒",
  "Cejas": "✨",
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function StepHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {subtitle && (
        <div style={{ fontSize: "0.65rem", color: C.textDim, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
          {subtitle}
        </div>
      )}
      <div style={{ fontSize: "1.1rem", color: C.text }}>{title}</div>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: "0.65rem", letterSpacing: "0.12em", color: C.textDim, textTransform: "uppercase", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button
      className="back-btn"
      onClick={onClick}
      style={{
        background: "transparent", border: "none", color: "#4A3B2A",
        cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.1em",
        marginBottom: 20, padding: 0, fontFamily: font, transition: "color 0.15s",
      }}
    >
      ← Volver
    </button>
  );
}

function ChoiceCard({ title, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.surface, border: `1px solid ${C.border}`, padding: "20px 24px",
        cursor: "pointer", textAlign: "left", fontFamily: font,
        transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 4,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.goldDim; e.currentTarget.style.background = C.surface2; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
    >
      <div style={{ fontSize: "0.95rem", color: C.text }}>{title}</div>
      <div style={{ fontSize: "0.7rem", color: C.textDim }}>{sub}</div>
    </button>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Cliente() {
  const [negocio, setNegocio] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [step, setStep] = useState("service");
  const [flow, setFlow] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    (async () => {
      const [neg, b, bl] = await Promise.all([getNegocio(), getBookings(), getBlocked()]);
      setNegocio(neg);
      setBookings(b);
      setBlocked(bl);
      setLoaded(true);
    })();
  }, []);

  function reset() {
    setStep("service"); setFlow(null);
    setSelectedServices([]); setSelectedBarber(null);
    setSelectedDate(null); setSelectedSlot(null);
    setNombre(""); setTelefono("");
  }

  function toggleService(svc) {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === svc.id);
      return isSelected ? prev.filter(s => s.id !== svc.id) : [...prev, svc];
    });
  }

  async function confirm() {
    const allSlots = generateSlots(negocio.horario);
    const barbero = flow === "A"
      ? selectedBarber
      : getBestBarber(selectedDate, selectedSlot, selectedServices, bookings, blocked, negocio.barberos, allSlots);
    if (!barbero) return;
    const totalPrecio = selectedServices.reduce((a, s) => a + s.precio, 0);
    const booking = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      barbero,
      servicio: selectedServices.map(s => s.nombre).join(", "),
      precio: totalPrecio,
      fecha: selectedDate,
      hora: selectedSlot,
      status: "pending",
      source: "client",
      creadoEn: new Date().toISOString(),
    };
    const updated = [...bookings, booking];
    setBookings(updated);
    await saveBookings(updated);
    setStep("success");
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: C.textDim, fontFamily: font, fontSize: "0.8rem", letterSpacing: "0.15em" }}>Cargando…</span>
      </div>
    );
  }

  const allSlots = generateSlots(negocio.horario);
  const weekDates = getWeekDates(negocio.diasSemana);
  const servicesSubtitle = selectedServices.map(s => s.nombre).join(" + ");
  const totalSlots = selectedServices.reduce((a, s) => a + s.slots, 0);
  const totalPrecio = selectedServices.reduce((a, s) => a + s.precio, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font, color: C.text }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: ${C.textDim}; }
        input:focus { outline: none; border-color: ${C.gold} !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fadeUp 0.25s ease; }
        .svc-card:hover { border-color: #C8A96E !important; box-shadow: 0 4px 14px rgba(200,169,110,0.18) !important; }
        .barber-card:hover { border-color: ${C.goldDim} !important; }
        .slot-btn:hover { border-color: ${C.goldDim} !important; }
        .day-btn:hover { background: ${C.surface2} !important; }
        .primary-btn:hover { background: ${C.gold} !important; color: ${C.bg} !important; }
        .back-btn:hover { color: ${C.textMid} !important; }
      `}</style>

      {/* NAVBAR */}
      <div style={{
        padding: "16px 0 14px",
        borderBottom: `1px solid ${C.border2}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: C.surface, gap: 6,
      }}>
        <img src="/logo.png" alt="Iron Barberos" style={{ height: 40, objectFit: "contain" }} />
        <div style={{
          fontSize: "0.65rem", letterSpacing: "0.35em", color: "#111111",
          fontFamily: "'Georgia', 'Times New Roman', serif", fontWeight: "bold",
          textTransform: "uppercase",
        }}>
          IRON BARBEROS
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px" }}>

        {/* STEP: SERVICE */}
        {step === "service" && (
          <div className="fade">
            <div style={{ marginBottom: 32 }}>
              <div style={{
                fontSize: "1.7rem", color: "#111111", marginBottom: 10,
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: "bold", lineHeight: 1.25,
              }}>
                Tu estilo empieza en la barbería.
              </div>
              <div style={{ fontSize: "0.85rem", color: "#666666" }}>
                ¡Te damos la bienvenida! Agenda tu cita a continuación.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {negocio.servicios.map(svc => {
                const isSelected = selectedServices.some(s => s.id === svc.id);
                return (
                  <button
                    key={svc.id}
                    className={isSelected ? "" : "svc-card"}
                    onClick={() => toggleService(svc)}
                    style={{
                      position: "relative",
                      background: isSelected ? "#FFFBF4" : "#FFFFFF",
                      border: isSelected ? "2px solid #C8A96E" : "1px solid #E8D5A3",
                      borderRadius: 12,
                      padding: "18px 20px",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: font,
                      transition: "all 0.15s",
                      boxShadow: isSelected
                        ? "0 4px 14px rgba(200,169,110,0.22)"
                        : "0 2px 8px rgba(0,0,0,0.06)",
                      display: "flex", alignItems: "center", gap: 16,
                    }}
                  >
                    {/* Checkmark */}
                    {isSelected && (
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        width: 22, height: 22, borderRadius: "50%",
                        background: "#C8A96E",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.7rem", color: "#FFFFFF", fontWeight: "bold",
                        lineHeight: 1,
                      }}>
                        ✓
                      </div>
                    )}
                    <div style={{ fontSize: "2rem", lineHeight: 1, flexShrink: 0 }}>
                      {SERVICE_ICONS[svc.nombre] || "✂️"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "1rem", color: "#C8A96E",
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        fontWeight: "bold", marginBottom: 4,
                      }}>
                        {svc.nombre}
                      </div>
                      {svc.descripcion && (
                        <div style={{ fontSize: "0.75rem", color: "#555555", lineHeight: 1.4 }}>
                          {svc.descripcion}
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: "0.85rem", color: "#111111", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {formatPrice(svc.precio)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Barra de resumen + botón Continuar */}
            {selectedServices.length > 0 && (
              <div className="fade" style={{ marginTop: 20 }}>
                <div style={{
                  background: "#FFFBF4", border: "1px solid #E8D5A3",
                  borderRadius: 10, padding: "12px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 12,
                }}>
                  <span style={{ fontSize: "0.8rem", color: "#555555" }}>
                    {selectedServices.length} servicio{selectedServices.length > 1 ? "s" : ""} seleccionado{selectedServices.length > 1 ? "s" : ""}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: "0.9rem", color: "#111111", fontWeight: "bold" }}>
                    {formatPrice(totalPrecio)}
                  </span>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => setStep("preference")}
                  style={{
                    width: "100%", padding: "14px", background: "transparent",
                    border: "1px solid #C8A96E", color: "#C8A96E", fontFamily: font,
                    fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase",
                    cursor: "pointer", transition: "all 0.2s", borderRadius: 8,
                  }}
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP: PREFERENCE */}
        {step === "preference" && (
          <div className="fade">
            <BackBtn onClick={() => setStep("service")} />
            <StepHeader title="¿Tenés preferencia de barbero?" subtitle={servicesSubtitle} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ChoiceCard
                title="Sí, quiero elegir mi barbero"
                sub="Ver disponibilidad por barbero"
                onClick={() => { setFlow("A"); setStep("barber"); }}
              />
              <ChoiceCard
                title="No, cualquier disponible"
                sub="El sistema asigna automáticamente"
                onClick={() => { setFlow("B"); setStep("day"); }}
              />
            </div>
          </div>
        )}

        {/* STEP: BARBER (Flujo A) */}
        {step === "barber" && (
          <div className="fade">
            <BackBtn onClick={() => setStep("preference")} />
            <StepHeader title="Elegí tu barbero" subtitle={servicesSubtitle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {negocio.barberos.map(name => (
                <button key={name} className="barber-card"
                  onClick={() => { setSelectedBarber(name); setStep("day"); }}
                  style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    padding: "18px 16px", cursor: "pointer", fontFamily: font,
                    transition: "all 0.15s", textAlign: "center",
                  }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>💈</div>
                  <div style={{ fontSize: "0.9rem", color: C.text }}>{name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: DAY */}
        {step === "day" && (
          <div className="fade">
            <BackBtn onClick={() => setStep(flow === "A" ? "barber" : "preference")} />
            <StepHeader
              title="Elegí el día"
              subtitle={flow === "A" ? `${servicesSubtitle} · ${selectedBarber}` : servicesSubtitle}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {weekDates.map(d => {
                const isPast = d < todayStr();
                if (isPast) return null;

                // Deshabilitar hoy si ya no quedan slots útiles
                const isTodayExhausted =
                  d === todayStr() &&
                  nowMinutes() >= parseTime(negocio.horario.fin) - 30;

                const slots = isTodayExhausted ? [] : (
                  flow === "A"
                    ? getAvailableSlotsForBarber(selectedBarber, d, selectedServices, bookings, blocked, allSlots)
                    : getSlotsWithAnyBarber(d, selectedServices, bookings, blocked, negocio.barberos, allSlots)
                );

                return (
                  <button key={d} className={slots.length > 0 ? "day-btn" : ""}
                    disabled={slots.length === 0}
                    onClick={() => { setSelectedDate(d); setStep("slot"); }}
                    style={{
                      background: C.surface, border: `1px solid ${C.border2}`,
                      padding: "14px 18px",
                      cursor: slots.length === 0 ? "not-allowed" : "pointer",
                      fontFamily: font, transition: "all 0.15s",
                      opacity: slots.length === 0 ? 0.35 : 1,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                    <div style={{ fontSize: "0.9rem", color: C.text }}>{fmtDate(d)}</div>
                    <div style={{ fontSize: "0.7rem", color: slots.length > 0 ? C.goldDim : C.textDim, fontFamily: mono }}>
                      {slots.length > 0 ? `${slots.length} horarios` : "Sin disponibilidad"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP: SLOT */}
        {step === "slot" && (
          <div className="fade">
            <BackBtn onClick={() => setStep("day")} />
            <StepHeader title="Elegí el horario" subtitle={fmtDate(selectedDate)} />
            {(() => {
              const availableSlots = flow === "A"
                ? getAvailableSlotsForBarber(selectedBarber, selectedDate, selectedServices, bookings, blocked, allSlots)
                : getSlotsWithAnyBarber(selectedDate, selectedServices, bookings, blocked, negocio.barberos, allSlots);
              const cutoff = selectedDate === todayStr() ? nowMinutes() + 30 : -1;
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {allSlots.map(s => {
                    const free = availableSlots.includes(s);
                    const isPast = cutoff >= 0 && parseTime(s) <= cutoff;
                    const opacity = free ? 1 : (isPast ? 0.15 : 0.3);
                    return (
                      <button key={s} className={free ? "slot-btn" : ""}
                        disabled={!free}
                        onClick={() => { setSelectedSlot(s); setStep("confirm"); }}
                        style={{
                          padding: "10px 16px", fontFamily: mono, fontSize: "0.85rem",
                          background: free ? C.surface : C.bg,
                          border: `1px solid ${free ? C.border : C.border2}`,
                          color: free ? C.gold : C.textDim,
                          cursor: free ? "pointer" : "not-allowed",
                          opacity, transition: "all 0.15s",
                        }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* STEP: CONFIRM */}
        {step === "confirm" && (
          <div className="fade">
            <BackBtn onClick={() => setStep("slot")} />
            <StepHeader title="Confirmá tu turno" subtitle="Ingresá tus datos" />
            <div style={{ marginBottom: 20 }}>
              <Label>Nombre</Label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Tu nombre"
                style={{
                  width: "100%", padding: "12px 14px", background: C.surface,
                  border: `1px solid ${C.border2}`, color: C.text,
                  fontFamily: font, fontSize: "0.9rem", marginBottom: 12,
                }}
              />
              <Label>Teléfono</Label>
              <input
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="0981 000 000"
                style={{
                  width: "100%", padding: "12px 14px", background: C.surface,
                  border: `1px solid ${C.border2}`, color: C.text,
                  fontFamily: font, fontSize: "0.9rem",
                }}
              />
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border2}`, padding: "16px 20px", marginBottom: 20 }}>
              {[
                ["Servicio", selectedServices.map(s => s.nombre).join(", ")],
                ["Barbero", flow === "A" ? selectedBarber : "Asignado automáticamente"],
                ["Fecha", fmtDate(selectedDate)],
                ["Hora", `${selectedSlot} → ${calcEndTime(selectedSlot, totalSlots, negocio.horario.slotMinutos)}`],
                ["Precio", formatPrice(totalPrecio)],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "6px 0", borderBottom: `1px solid ${C.border2}`,
                }}>
                  <span style={{ fontSize: "0.7rem", color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>{k}</span>
                  <span style={{
                    fontSize: "0.85rem",
                    color: k === "Precio" ? C.gold : C.text,
                    fontFamily: (k === "Precio" || k === "Hora") ? mono : font,
                    textAlign: "right", maxWidth: "60%",
                  }}>{v}</span>
                </div>
              ))}
            </div>
            <button
              className="primary-btn"
              disabled={!nombre.trim()}
              onClick={confirm}
              style={{
                width: "100%", padding: "14px", background: "transparent",
                border: `1px solid ${C.gold}`, color: C.gold, fontFamily: font,
                fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase",
                cursor: nombre.trim() ? "pointer" : "not-allowed",
                transition: "all 0.2s", opacity: nombre.trim() ? 1 : 0.4,
              }}
            >
              Confirmar turno
            </button>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === "success" && (
          <div className="fade" style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{ fontSize: "3rem", marginBottom: 20 }}>💈</div>
            <div style={{ fontSize: "1.2rem", color: C.gold, letterSpacing: "0.1em", marginBottom: 8 }}>
              ¡Turno confirmado!
            </div>
            <div style={{ fontSize: "0.85rem", color: C.textMid, marginBottom: 32, lineHeight: 1.6 }}>
              Te esperamos el {fmtDate(selectedDate)} a las {selectedSlot}
            </div>
            <button
              className="primary-btn"
              onClick={reset}
              style={{
                padding: "12px 32px", background: "transparent",
                border: `1px solid ${C.gold}`, color: C.gold, fontFamily: font,
                fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              Reservar otro turno
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
