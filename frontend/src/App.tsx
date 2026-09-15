import React, { Suspense, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

const AtmosHomePage = React.lazy(() => import("./AtmosHomePage").then(module => ({ default: module.AtmosHomePage })));
const BusinessMode = React.lazy(() => import("./BusinessMode").then(module => ({ default: module.BusinessMode })));

function GlobalLoaderController() {
  useEffect(() => {
    const loader = document.getElementById("ekavach-global-loader");
    if (loader) {
      loader.classList.add("fade-out");
      setTimeout(() => {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 500);
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={null}>
        <GlobalLoaderController />
        <Routes>
          <Route path="/" element={<AtmosHomePage />} />
          <Route path="/business" element={<BusinessMode />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
