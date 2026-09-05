import React, { useState, useEffect } from 'react';
import './LandingHero.css';

export function LandingHero({ onOpenPortals }) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedLiveDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  const formattedLiveTime = currentDateTime.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <main className="photo-exact-landing">
      {/* 1. Header Navigation Bar (Matches Photo 1:1) */}
      <header className="photo-exact-topbar">
        {/* Left: Tilted Red Marker Font Logo */}
        <div 
          className="photo-exact-logo" 
          onClick={() => onOpenPortals()}
          title="B.Tech Engineering Labs Hub"
        >
          <span className="logo-marker-line1">B.TECH</span>
          <span className="logo-marker-line2">ENGINEERS</span>
        </div>

        {/* Center: Wide-Spaced Clean Navigation Links */}
        <nav aria-label="Main Navigation">
          <ul className="photo-exact-nav-links">
            <li>
              <a href="#workbenches" onClick={(e) => { e.preventDefault(); onOpenPortals('student'); }}>
                CODE WORKBENCHES
              </a>
            </li>
            <li>
              <a href="#protocols" onClick={(e) => { e.preventDefault(); onOpenPortals('student'); }}>
                EXPERIMENT PROTOCOLS
              </a>
            </li>
            <li>
              <a href="#faculty" onClick={(e) => { e.preventDefault(); onOpenPortals('teacher'); }}>
                FACULTY DESK
              </a>
            </li>
          </ul>
        </nav>

        {/* Real-Time Telemetry Clock */}
        <div className="photo-exact-realtime-telemetry" title="Live Laboratory Station Telemetry Stream">
          <span className="telemetry-live-dot" />
          <span className="telemetry-label">LIVE:</span>
          <span className="telemetry-timestamp">{formattedLiveDate} · {formattedLiveTime} IST</span>
        </div>

        {/* Right: Rounded Coral-Red Pill Button */}
        <button 
          className="photo-exact-account-btn" 
          type="button"
          onClick={() => onOpenPortals('student')}
        >
          Your Account
        </button>
      </header>

      {/* 2. Hero Centerpiece Stage */}
      <section className="photo-exact-hero-stage">
        {/* =========================================================================
            LAYER 1 (BACK, z-index: 1): The Giant Typography Going Behind the Rocket
            ========================================================================= */}
        <div className="photo-exact-text-backdrop">
          {/* Top Thin Title */}
          <div className="photo-exact-text-top">
            B . T E C H
          </div>

          {/* Giant Center Title (Passes Behind Rocket Fuselage & Boosters) */}
          <h1 className="photo-exact-text-main">
            LAB COMPANION
          </h1>

          {/* Bottom Subtitle (Passes Behind Delta Wings & Nozzles) */}
          <div className="photo-exact-text-sub">
            STUDENT LABS
          </div>
        </div>

        {/* =========================================================================
            LAYER 2 (MIDDLE, z-index: 2): The Space Shuttle Rocket Stack Illustration
            ========================================================================= */}
        <div className="photo-exact-rocket-wrapper">
          <svg 
            viewBox="0 0 400 760" 
            className="photo-exact-rocket-svg" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Twin Rocket Exhaust Flame Linear Gradient */}
              <linearGradient id="rocketPlumeGradientLeft" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4136" stopOpacity="1" />
                <stop offset="35%" stopColor="#e02424" stopOpacity="0.95" />
                <stop offset="75%" stopColor="#9b1c1c" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#771d1d" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="rocketPlumeGradientRight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4136" stopOpacity="1" />
                <stop offset="35%" stopColor="#e02424" stopOpacity="0.95" />
                <stop offset="75%" stopColor="#9b1c1c" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#771d1d" stopOpacity="0.8" />
              </linearGradient>

              {/* Inner Flame Core */}
              <linearGradient id="rocketInnerCore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="25%" stopColor="#ff8a4c" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#c81e1e" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* A. Twin Propulsion Exhaust Plumes Shooting Down into Clouds */}
            {/* Left Booster Exhaust Flame */}
            <polygon 
              points="142,478 160,478 174,740 124,740" 
              fill="url(#rocketPlumeGradientLeft)" 
            />
            <polygon 
              points="147,478 155,478 163,680 135,680" 
              fill="url(#rocketInnerCore)" 
            />

            {/* Right Booster Exhaust Flame */}
            <polygon 
              points="240,478 258,478 276,740 226,740" 
              fill="url(#rocketPlumeGradientRight)" 
            />
            <polygon 
              points="245,478 253,478 265,680 237,680" 
              fill="url(#rocketInnerCore)" 
            />

            {/* B. Left Solid Rocket Booster (SRB) */}
            <g id="left-booster">
              {/* Nose Cone */}
              <path 
                d="M 151 160 C 151 140, 151 120, 151 112 C 151 120, 151 140, 151 160 Z" 
                fill="#ffffff" 
              />
              <path 
                d="M 137 168 C 145 130, 151 110, 151 110 C 151 110, 157 130, 165 168 Z" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
              />
              <line x1="140" y1="154" x2="162" y2="154" stroke="#000000" strokeWidth="2" />

              {/* Booster Body Cylinder */}
              <rect 
                x="137" 
                y="168" 
                width="28" 
                height="276" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
              />

              {/* Booster Segment Joint Rings */}
              <line x1="137" y1="210" x2="165" y2="210" stroke="#000000" strokeWidth="2" />
              <line x1="137" y1="255" x2="165" y2="255" stroke="#000000" strokeWidth="2" />
              <line x1="137" y1="300" x2="165" y2="300" stroke="#000000" strokeWidth="2" />
              <line x1="137" y1="345" x2="165" y2="345" stroke="#000000" strokeWidth="2" />
              <line x1="137" y1="390" x2="165" y2="390" stroke="#000000" strokeWidth="2" />
              <line x1="137" y1="435" x2="165" y2="435" stroke="#000000" strokeWidth="2" />

              {/* Aft Flare Skirt */}
              <polygon 
                points="137,444 165,444 169,466 133,466" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
              />

              {/* Engine Bell Nozzle */}
              <polygon 
                points="140,466 162,466 160,478 142,478" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
              />
            </g>

            {/* C. Right Solid Rocket Booster (SRB) */}
            <g id="right-booster">
              {/* Nose Cone */}
              <path 
                d="M 235 168 C 243 130, 249 110, 249 110 C 249 110, 255 130, 263 168 Z" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
              />
              <line x1="238" y1="154" x2="260" y2="154" stroke="#000000" strokeWidth="2" />

              {/* Booster Body Cylinder */}
              <rect 
                x="235" 
                y="168" 
                width="28" 
                height="276" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
              />

              {/* Booster Segment Joint Rings */}
              <line x1="235" y1="210" x2="263" y2="210" stroke="#000000" strokeWidth="2" />
              <line x1="235" y1="255" x2="263" y2="255" stroke="#000000" strokeWidth="2" />
              <line x1="235" y1="300" x2="263" y2="300" stroke="#000000" strokeWidth="2" />
              <line x1="235" y1="345" x2="263" y2="345" stroke="#000000" strokeWidth="2" />
              <line x1="235" y1="390" x2="263" y2="390" stroke="#000000" strokeWidth="2" />
              <line x1="235" y1="435" x2="263" y2="435" stroke="#000000" strokeWidth="2" />

              {/* Aft Flare Skirt */}
              <polygon 
                points="235,444 263,444 267,466 231,466" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
              />

              {/* Engine Bell Nozzle */}
              <polygon 
                points="238,466 260,466 258,478 240,478" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
              />
            </g>

            {/* D. Center Orbiter (Space Shuttle) */}
            <g id="orbiter-shuttle">
              {/* Delta Wings (Left & Right Full Span) */}
              <path 
                d="M 175 290 
                   L 84 430 
                   L 174 430 
                   L 200 435 
                   L 226 430 
                   L 316 430 
                   L 225 290 
                   Z" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
              />

              {/* Black Thermal Edge on Wings (Leading Edge Accent) */}
              <path 
                d="M 175 290 L 84 430 L 92 430 L 178 296 Z" 
                fill="#111111" 
              />
              <path 
                d="M 225 290 L 316 430 L 308 430 L 222 296 Z" 
                fill="#111111" 
              />

              {/* Wing Flap / Elevon Lines */}
              <line x1="96" y1="422" x2="168" y2="422" stroke="#000000" strokeWidth="1.8" />
              <line x1="232" y1="422" x2="304" y2="422" stroke="#000000" strokeWidth="1.8" />
              <line x1="120" y1="422" x2="120" y2="430" stroke="#000000" strokeWidth="1.8" />
              <line x1="144" y1="422" x2="144" y2="430" stroke="#000000" strokeWidth="1.8" />
              <line x1="256" y1="422" x2="256" y2="430" stroke="#000000" strokeWidth="1.8" />
              <line x1="280" y1="422" x2="280" y2="430" stroke="#000000" strokeWidth="1.8" />

              {/* Orbiter Fuselage Body */}
              <path 
                d="M 200 70 
                   C 192 85, 178 120, 176 160 
                   L 174 425 
                   L 226 425 
                   L 224 160 
                   C 222 120, 208 85, 200 70 
                   Z" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
              />

              {/* Black Nose Cap Thermal Protection */}
              <path 
                d="M 200 70 
                   C 196 78, 192 88, 190 94 
                   C 196 97, 204 97, 210 94 
                   C 208 88, 204 78, 200 70 
                   Z" 
                fill="#111111" 
                stroke="#000000" 
                strokeWidth="2" 
              />

              {/* Cockpit Windshield Band (Black Trapezoid with Window Panes) */}
              <path 
                d="M 188 128 
                   L 185 142 
                   L 215 142 
                   L 212 128 
                   Z" 
                fill="#111111" 
                stroke="#000000" 
                strokeWidth="1.5" 
              />
              {/* Window Pane Dividers */}
              <line x1="192" y1="128" x2="191" y2="142" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="197" y1="128" x2="197" y2="142" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="200" y1="128" x2="200" y2="142" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="203" y1="128" x2="203" y2="142" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="208" y1="128" x2="209" y2="142" stroke="#ffffff" strokeWidth="1.2" />

              {/* Nose Hatch / Reaction Control Jets */}
              <circle cx="194" cy="112" r="1.5" fill="#000000" />
              <circle cx="206" cy="112" r="1.5" fill="#000000" />
              <circle cx="196" cy="118" r="1.5" fill="#000000" />
              <circle cx="204" cy="118" r="1.5" fill="#000000" />

              {/* Payload Bay Door Center Seam Line */}
              <line x1="200" y1="150" x2="200" y2="420" stroke="#000000" strokeWidth="2" />
              
              {/* Payload Bay Longitudinal Lines */}
              <line x1="184" y1="165" x2="184" y2="415" stroke="#000000" strokeWidth="1.2" strokeDasharray="6 4" />
              <line x1="216" y1="165" x2="216" y2="415" stroke="#000000" strokeWidth="1.2" strokeDasharray="6 4" />

              {/* Vertical Stabilizer Tail Fin (Rudder) */}
              <path 
                d="M 197 220 
                   L 197 390 
                   L 203 390 
                   L 203 220 
                   Z" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2" 
              />
              <line x1="200" y1="230" x2="200" y2="385" stroke="#000000" strokeWidth="1.5" />

              {/* OMS Pods & Aft Main Engine Cluster */}
              {/* Left OMS Pod */}
              <path 
                d="M 175 390 C 168 395, 168 425, 178 428 Z" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2" 
              />
              {/* Right OMS Pod */}
              <path 
                d="M 225 390 C 232 395, 232 425, 222 428 Z" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2" 
              />

              {/* SSME Main Engine Bells */}
              <circle cx="200" cy="416" r="6" fill="#ffffff" stroke="#000000" strokeWidth="2" />
              <circle cx="190" cy="432" r="6" fill="#ffffff" stroke="#000000" strokeWidth="2" />
              <circle cx="210" cy="432" r="6" fill="#ffffff" stroke="#000000" strokeWidth="2" />
              
              <circle cx="200" cy="416" r="3" fill="#111111" />
              <circle cx="190" cy="432" r="3" fill="#111111" />
              <circle cx="210" cy="432" r="3" fill="#111111" />
            </g>
          </svg>
        </div>

        {/* =========================================================================
            LAYER 3 (FRONT, z-index: 10): Billowing Cloud Smoke Floor
            ========================================================================= */}
        <div className="photo-exact-clouds-footer" aria-hidden="true">
          <svg 
            viewBox="0 0 1440 240" 
            preserveAspectRatio="none" 
            className="photo-exact-clouds-svg"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 1. Back Layer: Massive White Puffy Cumulus Clouds */}
            <g fill="#ffffff" stroke="#000000" strokeWidth="3" strokeLinejoin="round">
              <circle cx="70" cy="220" r="110" />
              <circle cx="180" cy="180" r="95" />
              <circle cx="310" cy="195" r="115" />
              <circle cx="430" cy="155" r="105" />
              <circle cx="560" cy="170" r="100" />
              <circle cx="680" cy="140" r="115" />
              <circle cx="800" cy="160" r="110" />
              <circle cx="940" cy="145" r="120" />
              <circle cx="1070" cy="170" r="105" />
              <circle cx="1200" cy="160" r="115" />
              <circle cx="1320" cy="180" r="100" />
              <circle cx="1410" cy="220" r="110" />
              {/* White Ground Fill */}
              <rect x="0" y="200" width="1440" height="45" fill="#ffffff" stroke="none" />
            </g>

            {/* 2. Front Layer: Soft Salmon / Coral-Pink Puffy Cumulus Clusters */}
            <g fill="#fca5a5" stroke="#000000" strokeWidth="3" strokeLinejoin="round">
              {/* Left Wing Cloud Cluster */}
              <circle cx="110" cy="230" r="85" fill="#ffb4b4" />
              <circle cx="240" cy="210" r="80" fill="#fca5a5" />
              <circle cx="370" cy="235" r="90" fill="#ffb4b4" />
              
              {/* Central Launch Plume Enveloping Clouds */}
              <circle cx="620" cy="215" r="85" fill="#ffb4b4" />
              <circle cx="720" cy="205" r="92" fill="#fca5a5" />
              <circle cx="830" cy="220" r="86" fill="#ffb4b4" />

              {/* Right Wing Cloud Cluster */}
              <circle cx="1020" cy="225" r="85" fill="#fca5a5" />
              <circle cx="1140" cy="215" r="80" fill="#ffb4b4" />
              <circle cx="1270" cy="235" r="88" fill="#fca5a5" />
              
              {/* Pink Base Strip */}
              <rect x="0" y="218" width="1440" height="25" fill="#ffb4b4" stroke="none" />
            </g>
          </svg>
        </div>

        {/* Quick Access Bar for Interactive Console Entry */}
        <div className="photo-exact-quick-bar">
          <span className="quick-bar-badge">B.Tech Suite</span>
          <button 
            type="button" 
            className="quick-bar-btn"
            onClick={() => onOpenPortals('teacher')}
          >
            Faculty Supervision
          </button>
          <button 
            type="button" 
            className="quick-bar-btn primary"
            onClick={() => onOpenPortals('student')}
          >
            Student Console &rarr;
          </button>
        </div>
      </section>
    </main>
  );
}

export default LandingHero;
