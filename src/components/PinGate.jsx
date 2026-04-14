import { useState } from "react";
import { C, font } from "../design/tokens.js";

export default function PinGate({ pin, label, children }) {
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit() {
    if (input === pin) {
      setAuthed(true);
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(() => { setError(false); setShake(false); }, 600);
    }
  }

  if (authed) return children;

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: font,
    }}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)}
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .pin-box { animation: fadeIn 0.4s ease; }
        .pin-box.shake { animation: shake 0.4s ease; }
        .pin-input::placeholder { color: #3A2F1E; }
        .pin-input:focus { outline: none; border-color: #C8A96E !important; }
        .pin-submit:hover { background: #C8A96E !important; color: #0A0806 !important; }
      `}</style>
      <div className={`pin-box${shake ? " shake" : ""}`} style={{
        width: 320, padding: "48px 40px",
        border: `1px solid ${error ? C.red : C.border}`,
        background: C.surface,
        transition: "border-color 0.2s",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: "1.4rem", letterSpacing: "0.25em", color: C.gold, marginBottom: 6 }}>TAJOS</div>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: C.textDim, textTransform: "uppercase" }}>
            {label || "Acceso restringido"}
          </div>
        </div>
        <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: C.textDim, marginBottom: 8, textTransform: "uppercase" }}>
          PIN de acceso
        </div>
        <input
          className="pin-input"
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="••••••••"
          style={{
            width: "100%", padding: "12px 14px", background: C.bg,
            border: `1px solid ${error ? C.red : C.border2}`, color: C.text,
            fontFamily: font, fontSize: "1rem", boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
        />
        {error && (
          <div style={{ fontSize: "0.7rem", color: C.redText, marginTop: 6, letterSpacing: "0.05em" }}>
            PIN incorrecto
          </div>
        )}
        <button
          className="pin-submit"
          onClick={handleSubmit}
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
