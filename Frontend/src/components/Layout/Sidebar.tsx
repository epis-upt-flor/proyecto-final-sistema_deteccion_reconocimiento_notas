import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
  currentPage: string;
  onNavigate: (page: string) => void;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, currentPage, onNavigate, onToggle }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fas fa-chart-line', label: 'Dashboard' },
    { id: 'library', icon: 'fas fa-book', label: 'Biblioteca' },
    { id: 'upload', icon: 'fas fa-upload', label: 'Subir' },
    { id: 'history', icon: 'fas fa-history', label: 'Historial' },
    { id: 'profile', icon: 'fas fa-user', label: 'Perfil' },
    { id: 'admin', icon: 'fas fa-crown', label: 'Admin' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="logo">
            <i className="fas fa-piano"></i>
            <span>ChopinPlay</span>
          </div>
        )}
        <button className="toggle-btn" onClick={onToggle}>
          <i className={`fas ${collapsed ? 'fa-bars' : 'fa-times'}`}></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : ''}
          >
            <i className={item.icon}></i>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-details">
              <span className="user-name">Usuario</span>
              <span className="user-role">Estudiante</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;