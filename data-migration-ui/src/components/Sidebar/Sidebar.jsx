import React, { useState } from "react";
import "./SidebarMenu.css";
import { Badge } from "primereact/badge";

const sections = [
  {
    title: "Home",
    items: [
      { label: "Dashboard", icon: "pi pi-home" },
      { label: "Source Config", icon: "pi pi-bookmark", badge: 3 },
      { label: "Target Config", icon: "pi pi-users" },
      { label: "Transformations", icon: "pi pi-envelope", badge: 1 },
      { label: "Data Migration", icon: "pi pi-calendar" },
    ],
  },
  {
    title: "Organization",
    items: [
      { label: "Overview", icon: "pi pi-sitemap" },
      { label: "Security", icon: "pi pi-shield" },
      { label: "Domains", icon: "pi pi-globe" },
      { label: "Reports", icon: "pi pi-file", badge: 4 },
    ],
  },
];

export default function SidebarMenu() {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <div className="container">
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-content">
          {!collapsed && <h1>Data Migration</h1>}

          {sections.map((section, index) => (
            <div key={index} className="sidebar-section">
              {!collapsed && (
                <div className="sidebar-section-title">{section.title}</div>
              )}
              {section.items.map((item, i) => (
                <div key={i} className="sidebar-item">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <i className={item.icon}></i>
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="badge">{item.badge}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Toggle Button at Bottom */}
        <button className="toggle-btn" onClick={toggleSidebar}>
          <i className={`pi ${collapsed ? "pi-angle-right" : "pi-angle-left"}`} />
        </button>
      </aside>

      {/* Main Content */}
      {/* <main className="main-content" style={{ padding: "20px", background: "#f9fafb" }}>
        <div style={{ border: "2px dashed #d1d5db", height: "100vh" }}></div>
      </main> */}
    </div>
  );
}
