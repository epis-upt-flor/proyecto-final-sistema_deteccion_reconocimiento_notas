import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-left">
          <span>© 2025 ChopinPlay - HHM Tech Solutions</span>
        </div>
        
        <div className="footer-center">
          <span>v1.0.0</span>
        </div>
        
        <div className="footer-right">
          <a href="#" className="footer-link">Términos</a>
          <a href="#" className="footer-link">Privacidad</a>
          <a href="#" className="footer-link">Soporte</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;