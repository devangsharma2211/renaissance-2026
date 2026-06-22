import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react'; // Added ChevronDown
import './Nav.css';

export default function Nav() {
    const [isOpen, setIsOpen] = useState(false);
    const [studentToken, setStudentToken] = useState(() => localStorage.getItem("token"));
    const location = useLocation();

    // Helper to close menu when a link is clicked
    const closeMenu = () => setIsOpen(false);

    // Handle same-page navigation with scroll to top
    const handleSamePageClick = (e, to) => {
        if (location.pathname === to) {
            e.preventDefault();
            window.scrollTo(0, 0);
        }
        closeMenu();
    };

    const handleStudentLogout = () => {
        localStorage.removeItem("token");
        setStudentToken(null);
        window.dispatchEvent(new Event("student-auth-changed"));
        setIsOpen(false);
        window.location.reload();
    };

    useEffect(() => {
        const updateToken = () => setStudentToken(localStorage.getItem("token"));
        window.addEventListener("student-auth-changed", updateToken);
        window.addEventListener("storage", updateToken);
        window.addEventListener("focus", updateToken);
        return () => {
            window.removeEventListener("student-auth-changed", updateToken);
            window.removeEventListener("storage", updateToken);
            window.removeEventListener("focus", updateToken);
        };
    }, []);

    return (
        <nav className="glass-nav">
            <div className="nav-logo">
            <div className="nav-logo">
  <Link
    to="/"
    style={{
      color: '#000000',
      fontSize: 'calc(1.3rem + 0.4vw)',
      margin: 0,
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}
  >
    <img
      src="https://ren2026-assests.b-cdn.net/rlogo.webp"   // change path if needed
      alt="Logo"
      fetchpriority="high"
      style={{
        height: '57px',
        width: '62px',
        objectFit: 'contain'
      }}
    />
  </Link>
</div>

            </div>

            {/* Desktop Links (Hidden on Mobile) */}
            <div className="nav-links-container desktop-hidden">
                <Link to="/" className="nav-item" onClick={(e) => handleSamePageClick(e, "/")}>HOME</Link>
                <Link to="/events" className="nav-item" onClick={(e) => handleSamePageClick(e, "/events")}>EVENTS</Link>
                <Link to="/itinerary" className="nav-item" onClick={(e) => handleSamePageClick(e, "/itinerary")}>ITINERARY</Link>
                <Link to="/teams" className="nav-item" onClick={(e) => handleSamePageClick(e, "/teams")}>TEAMS</Link>
                
                {/* MORE Dropdown */}
                <div className="nav-item dropdown-container">
                    <span className="dropdown-trigger">
                        MORE <ChevronDown size={16} style={{ marginLeft: '4px' }} />
                    </span>
                    <div className="dropdown-menu">
                        <Link to="/gallery" className="dropdown-link" onClick={(e) => handleSamePageClick(e, "/gallery")}>GALLERY</Link>
                        {/* <Link to="/sponsers" className="dropdown-link">SPONSERS</Link> */}
                        <Link to="/about" className="dropdown-link" onClick={(e) => handleSamePageClick(e, "/about")}>ABOUT</Link>
                    </div>
                </div>
            </div>

            <div className="nav-action">
                {/* Desktop Login Button */}
                {studentToken ? (
                    <button
                        className="nav-login-link desktop-hidden"
                        onClick={handleStudentLogout}
                    >
                        LOGOUT
                    </button>
                ) : (
                    <Link to="/login" className="nav-login-link desktop-hidden" onClick={(e) => handleSamePageClick(e, "/login")}>LOGIN</Link>
                )}

                {/* Mobile Hamburger Button */}
                <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={28} color="white" /> : <Menu size={28} color="black" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-overlay ${isOpen ? 'active' : ''}`}>
                <div className="mobile-links-list">
                    <Link to="/" className="mobile-link" onClick={(e) => handleSamePageClick(e, "/")}>HOME</Link>
                    <Link to="/events" className="mobile-link" onClick={(e) => handleSamePageClick(e, "/events")}>EVENTS</Link>
                    <Link to="/itinerary" className="mobile-link" onClick={(e) => handleSamePageClick(e, "/itinerary")}>ITINERARY</Link>
                    <Link to="/teams" className="mobile-link" onClick={(e) => handleSamePageClick(e, "/teams")}>TEAMS</Link>
                    <Link to="/gallery" className="mobile-link" onClick={(e) => handleSamePageClick(e, "/gallery")}>GALLERY</Link>
                    {/* <Link to="/sponsers" className="mobile-link" onClick={(e) => handleSamePageClick(e, "/sponsers")}>SPONSERS</Link> */}
                    <Link to="/about" className="mobile-link" onClick={(e) => handleSamePageClick(e, "/about")}>ABOUT</Link>
                    
                    {studentToken ? (
                        <button className="mobile-login" onClick={handleStudentLogout}>LOGOUT</button>
                    ) : (
                        <Link to="/login" className="mobile-login" onClick={(e) => handleSamePageClick(e, "/login")}>LOGIN</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
