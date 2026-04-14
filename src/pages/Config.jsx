import { useState, useEffect } from "react";
import { C, font, mono } from "../design/tokens.js";
import { getNegocio, saveNegocio } from "../storage/index.js";
import PinGate from "../components/PinGate.jsx";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatPrice(p) {
  return "Gs. " + p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const DIAS_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function Config() {
  const [negocio, setNegocio] = useState(null);

  useEffect(() => {
    getNegocio().then(setNegocio);
  }, []);

  if (!negocio) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: C.textDim, fontFamily: font, fontSize: "0.8rem", letterSpacing: "0.15em" }}>Cargando…</span>
      </div>
    );
  }

  return (
    <PinGate pin={negocio.pins.config} label="Panel de Configuración">
      <ConfigPanel negocio={negocio} />
    </PinGate>
  );
}

// ─── CONFIG PANEL ─────────────────────────────────────────────────────────────
function ConfigPanel({ negocio: initialNegocio }) {
  const [config, setConfig] = useState(JSON.parse(JSON.stringify(initialNegocio)));
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);

  // ── Barberos ──
  function addBarbero() {
    const nombre = nuevoNombre.trim();
    if (!nombre || config.barberos.includes(nombre)) return;
    setConfig(c => ({ ...c, barberos: [...c.barberos, nombre] }));
    setNuevoNombre("");
  }

  function removeBarbero(idx) {
    setConfig(c => ({ ...c, barberos: c.barberos.filter((_, i) => i !== idx) }));
  }

  function moveBarbero(idx, dir) {
    const arr = [...config.barberos];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setConfig(c => ({ ...c, barberos: arr }));
  }

  // ── Servicios ──
  function addServicio() {
    const nuevo = {
      id: Date.now().toString(),
      nombre: "Nuevo servicio",
      precio: 0,
      slots: 2,
    };
    setConfig(c => ({ ...c, servicios: [...c.servicios, nuevo] }));
  }

  function updateServicio(idx, field, value) {
    const arr = [...config.servicios];
    arr[idx] = { ...arr[idx], [field]: value };
    setConfig(c => ({ ...c, servicios: arr }));
  }

  function removeServicio(idx) {
    setConfig(c => ({ ...c, servicios: c.servicios.filter((_, i) => i !== idx) }));
  }

  // ── Horario ──
  function updateHorario(field, value) {
    setConfig(c => ({ ...c, horario: { ...c.horario, [field]: value } }));
  }

  function toggleDia(dow) {
    const dias = config.diasSemana.includes(dow)
      ? config.diasSemana.filter(d => d !== dow)
      : [...config.diasSemana, dow].sort((a, b) => a - b);
    setConfig(c => ({ ...c, diasSemana: dias }));
  }

  // ── Guardar ──
  async function handleSave() {
    await saveNegocio(config);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  const inputStyle = {
    padding: "9px 12px", background: C.bg,
    border: `1px solid ${C.border2}`, color: C.text,
    fontFamily: font, fontSize: "0.85rem",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font, color: C.text }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; }
        input::placeholder { color: ${C.textDim}; }
        input:focus, select:focus { outline: none; border-color: ${C.gold} !important; }
        select option { background: ${C.surface}; color: ${C.text}; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fadeIn 0.25s ease; }
        .remove-btn:hover { color: ${C.redText} !important; border-color: ${C.red} !important; }
        .move-btn:hover { color: ${C.gold} !important; border-color: ${C.goldDim} !important; }
        .save-btn:hover { background: ${C.gold} !important; color: ${C.bg} !important; }
        .add-btn:hover { border-color: ${C.goldDim} !important; color: ${C.textMid} !important; }
      `}</style>

      {/* NAVBAR */}
      <div style={{
        height: 52, borderBottom: `1px solid ${C.border2}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", background: C.surface, position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: "1.1rem", letterSpacing: "0.25em", color: C.gold }}>TAJOS</span>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: C.textDim, textTransform: "uppercase" }}>Configuración</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }} className="fade">

        {/* ── SECCIÓN: BARBEROS ── */}
        <Section title="Barberos">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {config.barberos.map((nombre, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: C.surface, border: `1px solid ${C.border2}`,
                padding: "10px 14px",
              }}>
                <span style={{ flex: 1, fontSize: "0.9rem", color: C.text }}>{nombre}</span>
                <button className="move-btn" onClick={() => moveBarbero(idx, -1)}
                  style={iconBtnStyle} disabled={idx === 0}>↑</button>
                <button className="move-btn" onClick={() => moveBarbero(idx, 1)}
                  style={iconBtnStyle} disabled={idx === config.barberos.length - 1}>↓</button>
                <button className="remove-btn" onClick={() => removeBarbero(idx)}
                  style={iconBtnStyle}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addBarbero()}
              placeholder="Nombre del barbero"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button className="add-btn" onClick={addBarbero} style={{
              padding: "9px 18px", background: "transparent",
              border: `1px solid ${C.border}`, color: C.textDim,
              fontFamily: font, fontSize: "0.75rem", letterSpacing: "0.1em",
              cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase",
            }}>Agregar</button>
          </div>
        </Section>

        {/* ── SECCIÓN: SERVICIOS ── */}
        <Section title="Servicios">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Nombre", "Precio (Gs.)", "Slots", ""].map(h => (
                    <th key={h} style={{
                      fontSize: "0.6rem", letterSpacing: "0.12em", color: C.textDim,
                      textTransform: "uppercase", padding: "6px 8px",
                      borderBottom: `1px solid ${C.border2}`, textAlign: "left",
                      fontWeight: "normal",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {config.servicios.map((svc, idx) => (
                  <tr key={svc.id}>
                    <td style={{ padding: "8px 4px" }}>
                      <input
                        value={svc.nombre}
                        onChange={e => updateServicio(idx, "nombre", e.target.value)}
                        style={{ ...inputStyle, width: "100%", minWidth: 200 }}
                      />
                    </td>
                    <td style={{ padding: "8px 4px" }}>
                      <input
                        type="number"
                        value={svc.precio}
                        onChange={e => updateServicio(idx, "precio", Number(e.target.value))}
                        style={{ ...inputStyle, width: 120, fontFamily: mono }}
                      />
                    </td>
                    <td style={{ padding: "8px 4px" }}>
                      <select
                        value={svc.slots}
                        onChange={e => updateServicio(idx, "slots", Number(e.target.value))}
                        style={{ ...inputStyle, width: 80 }}
                      >
                        {[1, 2, 3, 4].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "8px 4px", textAlign: "center" }}>
                      <button className="remove-btn" onClick={() => removeServicio(idx)} style={iconBtnStyle}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preview de precios */}
          {config.servicios.length > 0 && (
            <div style={{ marginTop: 12, fontSize: "0.65rem", color: C.textDim, lineHeight: 1.8 }}>
              {config.servicios.map(svc => (
                <span key={svc.id} style={{ marginRight: 16 }}>
                  {svc.nombre}: <span style={{ color: C.goldDim, fontFamily: mono }}>{formatPrice(svc.precio)}</span>
                </span>
              ))}
            </div>
          )}

          <button className="add-btn" onClick={addServicio} style={{
            marginTop: 14, padding: "8px 18px", background: "transparent",
            border: `1px solid ${C.border}`, color: C.textDim,
            fontFamily: font, fontSize: "0.75rem", letterSpacing: "0.1em",
            cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase",
          }}>+ Agregar servicio</button>
        </Section>

        {/* ── SECCIÓN: HORARIO ── */}
        <Section title="Horario de atención">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            <Field label="Hora de inicio">
              <input
                type="time"
                value={config.horario.inicio}
                onChange={e => updateHorario("inicio", e.target.value)}
                style={{ ...inputStyle, width: "100%", fontFamily: mono }}
              />
            </Field>
            <Field label="Hora de fin">
              <input
                type="time"
                value={config.horario.fin}
                onChange={e => updateHorario("fin", e.target.value)}
                style={{ ...inputStyle, width: "100%", fontFamily: mono }}
              />
            </Field>
            <Field label="Duración de slot">
              <select
                value={config.horario.slotMinutos}
                onChange={e => updateHorario("slotMinutos", Number(e.target.value))}
                style={{ ...inputStyle, width: "100%" }}
              >
                {[15, 20, 30, 45, 60].map(m => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Días de atención">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {DIAS_LABELS.map((label, dow) => {
                const active = config.diasSemana.includes(dow);
                return (
                  <button
                    key={dow}
                    onClick={() => toggleDia(dow)}
                    style={{
                      padding: "8px 14px", fontFamily: font, fontSize: "0.75rem",
                      cursor: "pointer", transition: "all 0.15s",
                      background: active ? C.goldFaint : "transparent",
                      border: `1px solid ${active ? C.gold : C.border2}`,
                      color: active ? C.gold : C.textDim,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>

        {/* ── GUARDAR ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <button className="save-btn" onClick={handleSave} style={{
            padding: "12px 32px", background: "transparent",
            border: `1px solid ${C.gold}`, color: C.gold,
            fontFamily: font, fontSize: "0.8rem", letterSpacing: "0.15em",
            textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
          }}>
            Guardar cambios
          </button>
          {savedMsg && (
            <span style={{
              fontSize: "0.75rem", color: C.greenText, letterSpacing: "0.08em",
              animation: "fadeIn 0.3s ease",
            }}>
              ✓ Guardado correctamente
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        fontSize: "0.65rem", letterSpacing: "0.2em", color: C.gold,
        textTransform: "uppercase", marginBottom: 16,
        paddingBottom: 10, borderBottom: `1px solid ${C.border2}`,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: C.textDim, textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const iconBtnStyle = {
  background: "transparent",
  border: `1px solid ${C.border2}`,
  color: C.textDim,
  cursor: "pointer",
  width: 28, height: 28,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "0.8rem", transition: "all 0.15s",
  fontFamily: font,
};
