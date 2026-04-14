import { BrowserRouter, Routes, Route } from "react-router-dom";
import Cliente from "./pages/Cliente";
import Admin from "./pages/Admin";
import Config from "./pages/Config";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Cliente />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/config" element={<Config />} />
      </Routes>
    </BrowserRouter>
  );
}
