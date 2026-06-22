// App2.jsx
import React from 'react';
import { Link } from "react-router-dom";
import { IoLogoInstagram } from "react-icons/io";
import { CiLinkedin, CiGlobe } from "react-icons/ci";
import './Hero.css';
import { getAsset } from '../../config';

// Using the logo path from your project directory
// import jecrcLogo from "/placeholder-logo.svg"; 
import Nav from '../navbar/Nav.jsx';


const Hero = () => {
  return (
    <div className="main-wrapper">
      <Nav />

      <section className="hero-section">
        <div className="hero-content">
          {/* Start of Edit */}
          <picture>
            {/* 1. Mobile Image: Shows hero2.webp when screen is 768px or smaller */}
            <source 
            media="(max-width: 950px)" 
            srcSet="https://ren2026-assests.b-cdn.net/VERTICAL.webp"
/>
            
            {/* 2. Desktop Image: Shows hero.webp by default (larger screens) */}
            <img 
              src="https://ren2026-assests.b-cdn.net/output-web.webp"
              alt="Hero" 
              className="hero-image"
              decoding="sync" 
              loading="eager" 
              fetchpriority="high"
            />
          </picture>
          {/* End of Edit */}
        </div>
      </section>

     
    </div>
  );
};

export default Hero;
