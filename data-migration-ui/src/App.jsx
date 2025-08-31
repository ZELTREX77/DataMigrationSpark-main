import React, { useState } from "react";
import { PrimeReactProvider } from 'primereact/api';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SidebarMenu from "./components/Sidebar/Sidebar.jsx";
import Dashboard from "./pages/Dashboard";
import TransformationDesigner from "./components/TransformationDesigner";
import TransformationsList from "./pages/TransformationsList";
import "./App.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <PrimeReactProvider>
      <Router>
        <div style={{ display: "flex", minHeight: "98vh" }}>
          <SidebarMenu collapsed={collapsed} setCollapsed={setCollapsed} />
          <main className="main-content" style={{ flex: 1, padding: "20px", background: "#f9fafb" }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transformations" element={<TransformationsList />} />
              <Route path="/transformation-designer" element={<TransformationDesigner />} />
              {/* Add more routes here */}
            </Routes>
          </main>
        </div>
      </Router>
    </PrimeReactProvider>
  );
}
