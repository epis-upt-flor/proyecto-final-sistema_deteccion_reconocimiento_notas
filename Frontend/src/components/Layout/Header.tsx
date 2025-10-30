import React, { useState, useContext } from 'react';
import { AuthContext } from '../../App';
import './Header.css';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  onGoBack: () => void;
  showBackButton: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  currentPage,
  onNavigate,
  onGoBack,
  showBackButton
}) => {
  const { logout } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getPageTitle = () => {
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'library': 'Biblioteca',
      'upload': 'Subir Partitura',
      'detail': 'Detalles de Partitura',
      'practice': 'Modo Práctica',
      'result': 'Resultados de Sesión',
      'history': 'Historial',
      'compare': 'Comparar Sesiones',
      'profile': 'Perfil de Usuario',
      'admin': 'Panel de Administración'
    };
    return titles[currentPage] || 'ChopinPlay';
  };

  const handleLogout = () => {
    logout();
    onNavigate('dashboard');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
        
        {showBackButton && (
          <button className="back-button" onClick={onGoBack}>
            <i className="fas fa-arrow-left"></i>
            <span>Volver</span>
          </button>
        )}

        <h1 className="page-title">{getPageTitle()}</h1>
      </div>

      <div className="header-right">
        <button 
          className="header-btn" 
          title="Configuración"
          onClick={() => onNavigate('profile')}
        >
          <i className="fas fa-cog"></i>
        </button>

        <button 
          className="header-btn logout-btn" 
          title="Cerrar sesión"
          onClick={handleLogout}
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
        
        <div className="user-menu">
          <div className="user-dropdown">
            <button 
              className="user-dropdown-btn"
              onClick={toggleDropdown}
              onBlur={closeDropdown}
            >
              <i className="fas fa-ellipsis-v"></i>
            </button>
            
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { onNavigate('profile'); closeDropdown(); }}>
                  <i className="fas fa-user"></i>
                  <span>Mi Perfil</span>
                </div>
                
                <div className="dropdown-item" onClick={closeDropdown}>
                  <i className="fas fa-cog"></i>
                  <span>Configuración</span>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-item" onClick={closeDropdown}>
                  <i className="fas fa-question-circle"></i>
                  <span>Ayuda</span>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div 
                  className="dropdown-item"
                  onClick={() => { handleLogout(); closeDropdown(); }}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Cerrar sesión</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;