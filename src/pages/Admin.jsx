import { useState, useEffect, useCallback, useRef } from "react";
import { C, font, mono } from "../design/tokens.js";
import { getBookings, saveBookings, getBlocked, saveBlocked, getNegocio } from "../storage/index.js";

const SESSION_KEY = "tajos_admin_auth";
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

function getSessionAge() {
  const ts = sessionStorage.getItem(SESSION_KEY);
  if (!ts) return Infinity;
  return Date.now() - Number(ts);
}

function markSession() {
  sessionStorage.setItem(SESSION_KEY, String(Date.now()));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatPrice(p) {
  return "Gs. " + p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

function parseTime(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
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

function getWeekDates(base) {
  const dt = new Date(base + "T12:00:00");
  const day = dt.getDay();
  const mon = new Date(dt);
  mon.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function getNextSlot(hora, allSlots) {
  const idx = allSlots.indexOf(hora);
  return idx >= 0 && idx + 1 < allSlots.length ? allSlots[idx + 1] : null;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function Admin() {
  const [negocio, setNegocio] = useState(null);
  const [authed, setAuthed] = useState(() => getSessionAge() < TIMEOUT_MS);
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [shake, setShake] = useState(false);
  const inactivityRef = useRef(null);

  useEffect(() => {
    getNegocio().then(setNegocio);
  }, []);

  // Resetear timer de inactividad en cualquier interacción
  const resetTimer = useCallback(() => {
    if (!authed) return;
    markSession();
    clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(() => {
      clearSession();
      setAuthed(false);
    }, TIMEOUT_MS);
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    markSession();
    inactivityRef.current = setTimeout(() => {
      clearSession();
      setAuthed(false);
    }, TIMEOUT_MS);

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => {
      clearTimeout(inactivityRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [authed, resetTimer]);

  function handlePin() {
    if (!negocio) return;
    if (pinInput === negocio.pins.admin) {
      markSession();
      setAuthed(true);
      setPinInput("");
    } else {
      setPinErr(true);
      setShake(true);
      setPinInput("");
      setTimeout(() => { setPinErr(false); setShake(false); }, 600);
    }
  }

  if (!negocio) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: C.textDim, fontFamily: font, fontSize: "0.8rem", letterSpacing: "0.15em" }}>Cargando…</span>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
        <style>{`
          @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
          @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          .admin-pin-box { animation: fadeIn 0.4s ease; }
          .admin-pin-box.shake { animation: shake 0.4s ease; }
          .admin-pin-input::placeholder { color: #3A2F1E; }
          .admin-pin-input:focus { outline: none; border-color: #C8A96E !important; }
          .admin-pin-btn:hover { background: #C8A96E !important; color: #0A0806 !important; }
        `}</style>
        <div className={`admin-pin-box${shake ? " shake" : ""}`} style={{
          width: 320, padding: "48px 40px",
          border: `1px solid ${pinErr ? C.red : C.border}`,
          background: C.surface, transition: "border-color 0.2s",
        }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: "1.4rem", letterSpacing: "0.25em", color: C.gold, marginBottom: 6 }}>TAJOS</div>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: C.textDim, textTransform: "uppercase" }}>
              Panel de Administración
            </div>
          </div>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: C.textDim, marginBottom: 8, textTransform: "uppercase" }}>
            Acceso
          </div>
          <input
            className="admin-pin-input"
            type="password"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handlePin()}
            placeholder="••••••••"
            style={{
              width: "100%", padding: "12px 14px", background: C.bg,
              border: `1px solid ${pinErr ? C.red : C.border2}`, color: C.text,
              fontFamily: font, fontSize: "1rem", boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
          />
          {pinErr && (
            <div style={{ fontSize: "0.7rem", color: C.redText, marginTop: 6, letterSpacing: "0.05em" }}>
              PIN incorrecto
            </div>
          )}
          <button
            className="admin-pin-btn"
            onClick={handlePin}
            style={{
              marginTop: 20, width: "100%", padding: "12px",
              background: "transparent", border: `1px solid ${C.gold}`,
              color: C.gold, fontFamily: font, fontSize: "0.8rem",
              letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  return <AdminPanel negocio={negocio} />;
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ negocio }) {
  const [bookings, setBookings] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState("grid");

  const allSlots = generateSlots(negocio.horario);

  useEffect(() => {
    (async () => {
      const [b, bl] = await Promise.all([getBookings(), getBlocked()]);
      setBookings(b);
      setBlocked(bl);
      setLoading(false);
    })();
  }, []);

  async function cancelBooking(id) {
    const updated = bookings.map(b => b.id === id ? { ...b, status: "cancelled" } : b);
    setBookings(updated);
    await saveBookings(updated);
    setModal(null);
  }

  async function completeBooking(id) {
    const updated = bookings.map(b => b.id === id ? { ...b, status: "completed" } : b);
    setBookings(updated);
    await saveBookings(updated);
    setModal(null);
  }

  async function toggleBlock(date, slot, barber) {
    const key = `${date}__${slot}__${barber}`;
    const updated = blocked.includes(key)
      ? blocked.filter(k => k !== key)
      : [...blocked, key];
    setBlocked(updated);
    await saveBlocked(updated);
  }

  async function addBooking(booking) {
    const updated = [...bookings, booking];
    setBookings(updated);
    await saveBookings(updated);
    setModal(null);
  }

  const weekDates = getWeekDates(selectedDate);
  const dayBookings = bookings.filter(b => b.fecha === selectedDate && b.status !== "cancelled");
  const dayRevenue = dayBookings.filter(b => b.status === "completed").reduce((s, b) => s + (b.precio || 0), 0);
  const pendingCount = dayBookings.filter(b => b.status !== "completed").length;
  const completedCount = dayBookings.filter(b => b.status === "completed").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font, color: C.text }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .fade { animation: fadeIn 0.2s ease; }
        .cell-btn:hover { border-color: ${C.goldDim} !important; }
        .nav-date:hover { background: ${C.surface2} !important; }
        .tab-btn:hover { color: ${C.gold} !important; }
        .action-btn:hover { opacity: 0.8; }
        input::placeholder { color: ${C.textDim}; }
        input:focus, select:focus { outline: none; border-color: ${C.gold} !important; }
        select option { background: ${C.surface}; color: ${C.text}; }
      `}</style>

      {/* NAVBAR */}
      <div style={{
        height: 52, borderBottom: `1px solid ${C.border2}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", background: C.surface, position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: "1.1rem", letterSpacing: "0.25em", color: C.gold }}>TAJOS</span>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: C.textDim, textTransform: "uppercase" }}>Admin</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["grid", "summary"].map(t => (
            <button key={t} className="tab-btn" onClick={() => setTab(t)} style={{
              background: "transparent", border: "none",
              borderBottom: `2px solid ${tab === t ? C.gold : "transparent"}`,
              color: tab === t ? C.gold : C.textDim, fontFamily: font,
              fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
              cursor: "pointer", padding: "4px 12px", transition: "all 0.15s",
            }}>
              {t === "grid" ? "Grilla" : "Resumen"}
            </button>
          ))}
        </div>
        <div style={{ fontSize: "0.65rem", color: C.textDim, letterSpacing: "0.1em" }}>
          {new Date().toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* WEEK NAV */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "10px 16px", borderBottom: `1px solid ${C.border2}`,
        background: C.surface, overflowX: "auto",
      }}>
        {weekDates.map(d => {
          const dt = new Date(d + "T12:00:00");
          const isToday = d === todayStr();
          const isSel = d === selectedDate;
          const dayNames = ["D", "L", "M", "M", "J", "V", "S"];
          const cnt = bookings.filter(b => b.fecha === d && b.status !== "cancelled").length;
          return (
            <button key={d} className="nav-date" onClick={() => setSelectedDate(d)} style={{
              background: isSel ? C.goldFaint : "transparent",
              border: `1px solid ${isSel ? C.gold : isToday ? C.goldDim : C.border2}`,
              color: isSel ? C.gold : C.textMid,
              fontFamily: font, cursor: "pointer", padding: "6px 10px",
              minWidth: 52, transition: "all 0.15s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}>
              <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}>{dayNames[dt.getDay()]}</span>
              <span style={{ fontSize: "1rem" }}>{dt.getDate()}</span>
              {cnt > 0 && <span style={{ fontSize: "0.55rem", color: isSel ? C.goldDim : C.textDim }}>{cnt}</span>}
            </button>
          );
        })}
        <button onClick={() => setModal({ type: "new" })} style={{
          marginLeft: "auto", background: "transparent", border: `1px solid ${C.gold}`,
          color: C.gold, fontFamily: font, fontSize: "0.65rem", letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer", padding: "6px 14px",
          transition: "all 0.15s", whiteSpace: "nowrap",
        }}>+ Turno manual</button>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: C.textDim, fontSize: "0.8rem", letterSpacing: "0.1em" }}>
          Cargando…
        </div>
      ) : tab === "grid" ? (
        <GridView
          selectedDate={selectedDate}
          bookings={bookings}
          blocked={blocked}
          barberos={negocio.barberos}
          allSlots={allSlots}
          onCellClick={(slot, barber, booking) => {
            if (booking) setModal({ type: "detail", booking });
            else setModal({ type: "block", slot, barber, date: selectedDate });
          }}
        />
      ) : (
        <SummaryView
          selectedDate={selectedDate}
          bookings={dayBookings}
          revenue={dayRevenue}
          pending={pendingCount}
          completed={completedCount}
          onAction={(booking) => setModal({ type: "detail", booking })}
        />
      )}

      {/* MODALS */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal.type === "detail" && (
            <DetailModal
              booking={modal.booking}
              onComplete={() => completeBooking(modal.booking.id)}
              onCancel={() => cancelBooking(modal.booking.id)}
              onClose={() => setModal(null)}
            />
          )}
          {modal.type === "new" && (
            <NewBookingModal
              selectedDate={selectedDate}
              bookings={bookings}
              blocked={blocked}
              negocio={negocio}
              allSlots={allSlots}
              onSave={addBooking}
              onClose={() => setModal(null)}
            />
          )}
          {modal.type === "block" && (
            <BlockModal
              slot={modal.slot}
              barber={modal.barber}
              date={modal.date}
              blocked={blocked}
              onToggle={() => { toggleBlock(modal.date, modal.slot, modal.barber); setModal(null); }}
              onClose={() => setModal(null)}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── GRID VIEW ────────────────────────────────────────────────────────────────
function GridView({ selectedDate, bookings, blocked, barberos, allSlots, onCellClick }) {
  const CELL_W = 148;
  const SLOT_H = 36;

  function getCell(slot, barber) {
    const booking = bookings.find(b =>
      b.fecha === selectedDate && b.barbero === barber &&
      (b.hora === slot || getNextSlot(b.hora, allSlots) === slot) &&
      b.status !== "cancelled"
    );
    const isBlocked = blocked.includes(`${selectedDate}__${slot}__${barber}`);
    return { booking, isBlocked };
  }

  function isSecondSlot(slot, barber) {
    const prevIdx = allSlots.indexOf(slot) - 1;
    if (prevIdx < 0) return false;
    const prevSlot = allSlots[prevIdx];
    return bookings.some(b =>
      b.fecha === selectedDate && b.barbero === barber &&
      b.hora === prevSlot && b.status !== "cancelled"
    );
  }

  return (
    <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
      <div style={{ minWidth: barberos.length * CELL_W + 64, position: "relative" }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `64px repeat(${barberos.length}, ${CELL_W}px)`,
          borderBottom: `1px solid ${C.border}`,
          background: C.surface, position: "sticky", top: 0, zIndex: 10,
        }}>
          <div />
          {barberos.map(b => (
            <div key={b} style={{
              padding: "10px 0", textAlign: "center",
              fontSize: "0.7rem", letterSpacing: "0.12em", color: C.gold,
              textTransform: "uppercase", borderLeft: `1px solid ${C.border2}`,
            }}>{b}</div>
          ))}
        </div>

        {/* Rows */}
        {allSlots.map((slot, si) => (
          <div key={slot} style={{
            display: "grid",
            gridTemplateColumns: `64px repeat(${barberos.length}, ${CELL_W}px)`,
            borderBottom: `1px solid ${C.border2}`,
            background: si % 2 === 0 ? C.bg : C.surface,
          }}>
            <div style={{
              height: SLOT_H, display: "flex", alignItems: "center",
              justifyContent: "flex-end", paddingRight: 10,
              fontSize: "0.65rem", color: C.textDim, fontFamily: mono,
              letterSpacing: "0.05em",
            }}>{slot}</div>

            {barberos.map(barber => {
              const { booking, isBlocked } = getCell(slot, barber);
              const second = isSecondSlot(slot, barber);
              if (second) {
                return (
                  <div key={barber} style={{
                    height: SLOT_H,
                    borderLeft: `3px solid ${booking?.status === "completed" ? C.green : C.amber}`,
                    background: booking?.status === "completed" ? C.greenBg : C.amberBg,
                  }} />
                );
              }
              return (
                <GridCell key={barber}
                  slot={slot} barber={barber} booking={booking}
                  isBlocked={isBlocked} height={SLOT_H}
                  onClick={() => onCellClick(slot, barber, booking)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function GridCell({ booking, isBlocked, height, onClick }) {
  const [hover, setHover] = useState(false);

  let bg = "transparent";
  let borderLeft = `1px solid ${C.border2}`;
  let content = null;

  if (isBlocked) {
    bg = C.surface2;
    content = <span style={{ fontSize: "0.55rem", color: C.textDim, letterSpacing: "0.08em" }}>BLOQUEADO</span>;
  } else if (booking) {
    bg = booking.status === "completed" ? C.greenBg : C.amberBg;
    borderLeft = `1px solid ${booking.status === "completed" ? C.green : C.amber}`;
    content = (
      <div style={{ overflow: "hidden", lineHeight: 1.2 }}>
        <div style={{
          fontSize: "0.65rem",
          color: booking.status === "completed" ? C.greenText : C.amberText,
          fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{booking.nombre}</div>
        <div style={{
          fontSize: "0.55rem", color: C.textDim,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{booking.servicio?.split(" ").slice(0, 2).join(" ")}</div>
      </div>
    );
  } else if (hover) {
    bg = C.surface2;
  }

  return (
    <button
      className="cell-btn"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        height, display: "flex", alignItems: "center", paddingLeft: 8,
        background: bg, border: "none", borderLeft,
        cursor: "pointer", transition: "all 0.1s", textAlign: "left",
        fontFamily: font, width: "100%",
      }}
    >
      {content}
      {!booking && !isBlocked && hover && (
        <span style={{ fontSize: "0.55rem", color: C.textDim, letterSpacing: "0.06em" }}>bloquear</span>
      )}
    </button>
  );
}

// ─── SUMMARY VIEW ─────────────────────────────────────────────────────────────
function SummaryView({ selectedDate, bookings, revenue, pending, completed, onAction }) {
  const total = bookings.length;
  const projected = bookings.reduce((s, b) => s + (b.precio || 0), 0);

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }} className="fade">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.15em", color: C.textDim, textTransform: "uppercase", marginBottom: 4 }}>
          {fmtDate(selectedDate)}
        </div>
        <div style={{ fontSize: "1.2rem", color: C.gold, letterSpacing: "0.08em" }}>Resumen del día</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Turnos totales", value: total, color: C.text },
          { label: "Pendientes", value: pending, color: C.amberText },
          { label: "Completados", value: completed, color: C.greenText },
          { label: "Caja del día", value: formatPrice(revenue), color: C.gold },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border2}`, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: C.textDim, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: "1.3rem", color, fontFamily: mono }}>{value}</div>
          </div>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.textDim, fontSize: "0.8rem", letterSpacing: "0.1em" }}>
          Sin turnos para este día
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...bookings].sort((a, b) => a.hora?.localeCompare(b.hora)).map(booking => (
            <BookingRow key={booking.id} booking={booking} onClick={() => onAction(booking)} />
          ))}
        </div>
      )}

      {bookings.length > 0 && (
        <div style={{
          marginTop: 20, padding: "12px 16px",
          borderTop: `1px solid ${C.border2}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "0.65rem", color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Proyección total (si se completan todos)
          </span>
          <span style={{ fontSize: "1rem", color: C.goldDim, fontFamily: mono }}>{formatPrice(projected)}</span>
        </div>
      )}
    </div>
  );
}

function BookingRow({ booking, onClick }) {
  const [hover, setHover] = useState(false);
  const statusColor = booking.status === "completed" ? C.greenText : booking.status === "cancelled" ? C.redText : C.amberText;
  const statusLabel = booking.status === "completed" ? "Completado" : booking.status === "cancelled" ? "Cancelado" : "Pendiente";
  const statusBg = booking.status === "completed" ? C.greenBg : booking.status === "cancelled" ? C.redBg : C.amberBg;

  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr 90px 80px",
        alignItems: "center", gap: 12, padding: "10px 16px",
        background: hover ? C.surface2 : C.surface,
        border: `1px solid ${C.border2}`, cursor: "pointer",
        fontFamily: font, textAlign: "left", transition: "all 0.1s", color: C.text,
      }}
    >
      <span style={{ fontFamily: mono, fontSize: "0.8rem", color: C.gold }}>{booking.hora}</span>
      <span style={{ fontSize: "0.8rem" }}>{booking.nombre}</span>
      <span style={{ fontSize: "0.7rem", color: C.textMid }}>{booking.barbero}</span>
      <span style={{ fontSize: "0.7rem", color: C.textDim }}>{booking.servicio}</span>
      <span style={{ fontFamily: mono, fontSize: "0.75rem", color: C.textMid, textAlign: "right" }}>{formatPrice(booking.precio || 0)}</span>
      <span style={{
        fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase",
        color: statusColor, background: statusBg, padding: "3px 8px", textAlign: "center",
      }}>{statusLabel}</span>
    </button>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, backdropFilter: "blur(2px)",
      }}
      className="fade"
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, border: `1px solid ${C.border}`,
        padding: "32px 28px", minWidth: 340, maxWidth: 460, width: "90%",
      }}>
        {children}
      </div>
    </div>
  );
}

function ModalTitle({ children }) {
  return (
    <div style={{ fontSize: "0.7rem", letterSpacing: "0.18em", color: C.gold, textTransform: "uppercase", marginBottom: 20 }}>
      {children}
    </div>
  );
}

function DetailModal({ booking, onComplete, onCancel, onClose }) {
  const isCompleted = booking.status === "completed";
  const isCancelled = booking.status === "cancelled";

  return (
    <div>
      <ModalTitle>Detalle del turno</ModalTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {[
          ["Cliente", booking.nombre],
          ["Teléfono", booking.telefono || "—"],
          ["Barbero", booking.barbero],
          ["Servicio", booking.servicio],
          ["Fecha", fmtDate(booking.fecha)],
          ["Hora", booking.hora],
          ["Precio", formatPrice(booking.precio || 0)],
        ].map(([k, v]) => (
          <div key={k} style={{
            display: "flex", justifyContent: "space-between",
            borderBottom: `1px solid ${C.border2}`, paddingBottom: 8,
          }}>
            <span style={{ fontSize: "0.65rem", color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase" }}>{k}</span>
            <span style={{ fontSize: "0.8rem", color: C.text }}>{v}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 2 }}>
          <span style={{ fontSize: "0.65rem", color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase" }}>Estado</span>
          <span style={{
            fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase",
            color: isCompleted ? C.greenText : isCancelled ? C.redText : C.amberText,
          }}>
            {isCompleted ? "Completado" : isCancelled ? "Cancelado" : "Pendiente"}
          </span>
        </div>
      </div>
      {!isCompleted && !isCancelled && (
        <div style={{ display: "flex", gap: 10 }}>
          <ActionBtn color={C.greenText} bg={C.greenBg} border={C.green} onClick={onComplete}>✓ Completar</ActionBtn>
          <ActionBtn color={C.redText} bg={C.redBg} border={C.red} onClick={onCancel}>✕ Cancelar</ActionBtn>
        </div>
      )}
      <button onClick={onClose} style={{
        marginTop: 12, background: "transparent", border: "none",
        color: C.textDim, fontFamily: font, fontSize: "0.7rem",
        letterSpacing: "0.1em", cursor: "pointer", padding: 0,
      }}>← Cerrar</button>
    </div>
  );
}

function BlockModal({ slot, barber, date, blocked, onToggle, onClose }) {
  const key = `${date}__${slot}__${barber}`;
  const isBlocked = blocked.includes(key);

  return (
    <div>
      <ModalTitle>{isBlocked ? "Desbloquear slot" : "Bloquear slot"}</ModalTitle>
      <div style={{ marginBottom: 20, fontSize: "0.85rem", color: C.textMid, lineHeight: 1.6 }}>
        <div>
          <span style={{ color: C.textDim, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Barbero</span>
          <br />{barber}
        </div>
        <div style={{ marginTop: 10 }}>
          <span style={{ color: C.textDim, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Horario</span>
          <br />{fmtDate(date)} a las {slot}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <ActionBtn
          color={isBlocked ? C.greenText : C.redText}
          bg={isBlocked ? C.greenBg : C.redBg}
          border={isBlocked ? C.green : C.red}
          onClick={onToggle}
        >
          {isBlocked ? "✓ Desbloquear" : "✕ Bloquear"}
        </ActionBtn>
      </div>
      <button onClick={onClose} style={{
        marginTop: 12, background: "transparent", border: "none",
        color: C.textDim, fontFamily: font, fontSize: "0.7rem",
        letterSpacing: "0.1em", cursor: "pointer", padding: 0,
      }}>← Cancelar</button>
    </div>
  );
}

function NewBookingModal({ selectedDate, bookings, blocked, negocio, allSlots, onSave, onClose }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [barbero, setBarbero] = useState(negocio.barberos[0]);
  const [servicio, setServicio] = useState(negocio.servicios[0].nombre);
  const [fecha, setFecha] = useState(selectedDate);
  const [hora, setHora] = useState("");
  const [err, setErr] = useState("");

  function getAvailableSlots() {
    return allSlots.filter(slot => {
      const nextIdx = allSlots.indexOf(slot) + 1;
      if (nextIdx >= allSlots.length) return false;
      const next = allSlots[nextIdx];
      const taken = (s) =>
        bookings.some(b =>
          b.fecha === fecha && b.barbero === barbero &&
          (b.hora === s || getNextSlot(b.hora, allSlots) === s) && b.status !== "cancelled"
        ) || blocked.includes(`${fecha}__${s}__${barbero}`);
      return !taken(slot) && !taken(next);
    });
  }

  function handleSave() {
    if (!nombre.trim()) { setErr("Ingresá el nombre del cliente"); return; }
    if (!hora) { setErr("Seleccioná un horario"); return; }
    const svc = negocio.servicios.find(s => s.nombre === servicio);
    onSave({
      id: Date.now().toString(),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      barbero, servicio, fecha, hora,
      precio: svc?.precio || 0,
      status: "pending",
      source: "admin",
      creadoEn: new Date().toISOString(),
    });
  }

  const availableSlots = getAvailableSlots();
  const inputStyle = {
    width: "100%", padding: "9px 12px",
    background: C.bg, border: `1px solid ${C.border2}`,
    color: C.text, fontFamily: font, fontSize: "0.85rem",
  };

  return (
    <div>
      <ModalTitle>Nuevo turno manual</ModalTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <Field label="Cliente">
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" style={inputStyle} />
        </Field>
        <Field label="Teléfono (opcional)">
          <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="0981 000 000" style={inputStyle} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Barbero">
            <select value={barbero} onChange={e => { setBarbero(e.target.value); setHora(""); }} style={inputStyle}>
              {negocio.barberos.map(b => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Fecha">
            <input type="date" value={fecha} onChange={e => { setFecha(e.target.value); setHora(""); }} style={inputStyle} />
          </Field>
        </div>
        <Field label="Servicio">
          <select value={servicio} onChange={e => setServicio(e.target.value)} style={inputStyle}>
            {negocio.servicios.map(s => <option key={s.id}>{s.nombre}</option>)}
          </select>
        </Field>
        <Field label="Horario">
          {availableSlots.length === 0 ? (
            <div style={{ fontSize: "0.75rem", color: C.redText, padding: "8px 0" }}>
              Sin horarios disponibles para este barbero/día
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {availableSlots.map(s => (
                <button key={s} onClick={() => setHora(s)} style={{
                  background: hora === s ? C.goldFaint : "transparent",
                  border: `1px solid ${hora === s ? C.gold : C.border2}`,
                  color: hora === s ? C.gold : C.textMid,
                  fontFamily: mono, fontSize: "0.75rem", cursor: "pointer",
                  padding: "5px 10px", transition: "all 0.1s",
                }}>{s}</button>
              ))}
            </div>
          )}
        </Field>
      </div>
      {err && <div style={{ fontSize: "0.7rem", color: C.redText, marginBottom: 12 }}>{err}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <ActionBtn color={C.gold} bg={C.goldFaint} border={C.gold} onClick={handleSave}>
          Guardar turno
        </ActionBtn>
      </div>
      <button onClick={onClose} style={{
        marginTop: 12, background: "transparent", border: "none",
        color: C.textDim, fontFamily: font, fontSize: "0.7rem",
        letterSpacing: "0.1em", cursor: "pointer", padding: 0,
      }}>← Cancelar</button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: C.textDim, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function ActionBtn({ color, bg, border, onClick, children }) {
  return (
    <button
      className="action-btn"
      onClick={onClick}
      style={{
        background: bg, border: `1px solid ${border}`,
        color, fontFamily: font, fontSize: "0.75rem",
        letterSpacing: "0.1em", textTransform: "uppercase",
        cursor: "pointer", padding: "9px 18px", transition: "opacity 0.15s",
      }}
    >{children}</button>
  );
}
