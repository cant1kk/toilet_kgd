import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { telegramService } from '../services/telegram';

const Navigation: React.FC = () => {
  const location = useLocation();
  const isAdmin = localStorage.getItem('adminToken');

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          🚽 Туалеты Кgd
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              active={location.pathname === '/'}
            >
              🗺️ Карта
            </Nav.Link>
            
            {isAdmin && (
              <Nav.Link 
                as={Link} 
                to="/admin" 
                active={location.pathname === '/admin'}
              >
                ⚙️ Админ
              </Nav.Link>
            )}
          </Nav>
          
          <Nav>
            {telegramService.isTelegramApp() && (
              <Nav.Link 
                onClick={() => telegramService.openLink('https://t.me/kaliningrad_toilets_bot')}
                target="_blank"
              >
                📱 Telegram
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;