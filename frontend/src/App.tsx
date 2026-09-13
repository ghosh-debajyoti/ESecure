import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AtmosHomePage } from "./AtmosHomePage";
import { BusinessMode } from "./BusinessMode";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AtmosHomePage />} />
        <Route path="/business" element={<BusinessMode />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
