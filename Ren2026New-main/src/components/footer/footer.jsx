import { Link, useLocation } from "react-router-dom";
import { IoLogoInstagram } from "react-icons/io";
import { CiLinkedin, CiGlobe } from "react-icons/ci";
import EncryptedText from "./encrypted-Text"; // ✅ FIXED (default import)
import "./footer.css";
import { color } from "framer-motion";
import { getAsset } from "../../config";
// import { url } from "inspector";
const Footer = () => {
  const location = useLocation();
  const navigationLinks = [
    { label: "HOME", href: "/" },
    { label: "ABOUT", href: "/about" },
    { label: "EVENTS", href: "/events" },
    { label: "GALLERY", href: "/gallery" },
    { label: "ITINERARY", href: "/itinerary" },
    { label: "OUR TEAM", href: "/teams" },
  ];

  const contacts = [
    { name: "ASHISH SHARMA", role: "TECHNICAL", phone: "+917851053521" },
    { name: "VIVEK CHAHAR", role: "SPLASH", phone: "+919216948156" },
    { name: "SACHIN CHOUDHARY", role: "OPERATION", phone: "+919257002303" },
    { name: "SWATI SHARMA", role: "CULTURAL", phone: "+919785631315" },
  ];

  return (
    <footer className="footer-container"
    style={{
  background: `linear-gradient(rgba(0, 0, 0, 0.99), rgba(0, 0, 0, 0.7)), url("${getAsset("/footer/bg2.webp")}")`,
  backgroundSize: "cover", // standard css properties usually go with this
  backgroundPosition: "center"
}}
    >
      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      <div className="footer-content">
        <div className="main-grid">
          {/* Branding */}
          <div className="branding-section">
            <div className="logo-group">
              {/* <div className="logo-box" /> */}
              <div className="logo-box">
                <img 
                  src="https://ren2026-assests.b-cdn.net/rlogo.webp" 
                  alt="Renaissance Logo" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* JECRC logo frame (same size as Renaissance logo) */}
              <div className="logo-box">
                <img 
                  src="https://ren2026-assests.b-cdn.net/jecrc.webp" 
                  alt="JECRC Logo" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            <div className="brand-titles">
              <h2 className="main-title">RENAISSANCE</h2>
              <div className="year-text">2026</div>
            </div>

            <p className="tagline">Bigger & Beyond!</p>
          </div>

          {/* Navigation */}
          <div className="nav-section">
            <nav className="nav-links">
              <h3 className="section-title">Navigation</h3>

              {navigationLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  to={href}
                  className="nav-item"
                  onClick={() => {
                    if (location.pathname === href) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  <EncryptedText
                    text={label}
                    revealDelayMs={50}
                    flipDelayMs={50}
                    encryptedClassName="text-fade"
                    revealedClassName="text-bright"
                  />
                </Link>
              ))}
            </nav>
          </div>

          {/* Contacts */}
          <div className="contact-section">
            <h3 className="section-title">Contact</h3>

            <div className="contact-list">
              {contacts.map(({ name, role, phone }) => (
                <div key={name} className="contact-card">
                  <p className="contact-name">
                    <EncryptedText text={name} revealDelayMs={50} flipDelayMs={50} />
                  </p>
                  <p className="contact-role">
                    <EncryptedText text={role} revealDelayMs={50} flipDelayMs={50} />
                  </p>
                  <a href={`tel:${phone}`} className="contact-phone">
                    <EncryptedText text={phone} revealDelayMs={50} flipDelayMs={50} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Socials */}
        <div className="social-footer">
          <div className="social-links">
            <a
              href="https://www.instagram.com/jecrcrenaissance"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon instagram"
            >
              <IoLogoInstagram />
            </a>

            <a
              href="https://www.linkedin.com/school/jaipur-engineering-college-and-research-centre-jecrc-"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon linkedin"
            >
              <CiLinkedin />
            </a>

            <a
              href="https://jecrcfoundation.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon globe"
            >
              <CiGlobe />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;