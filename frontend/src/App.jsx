import React, { useState } from 'react';
import LoginForm from './LoginForm';
import Dashboard from './Dashboard';
import LandingHero from './components/landing/LandingHero';
import PortalGateway from './components/landing/PortalGateway';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("currentUser");
      return null;
    }
  });

  const [viewState, setViewState] = useState("landing"); // 'landing' | 'gateway' | 'login'
  const [selectedPortal, setSelectedPortal] = useState("student");

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", JSON.stringify(userData));
    setIsLoggedIn(true);
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setViewState("landing");
  };

  const handleOpenPortals = (directRole = null) => {
    if (directRole) {
      setSelectedPortal(directRole);
      setViewState("login");
    } else {
      setViewState("gateway");
    }
  };

  const handleSelectPortal = (role) => {
    setSelectedPortal(role);
    setViewState("login");
  };

  // 1. Authenticated User Dashboard
  if (isLoggedIn) {
    return (
      <Dashboard
        user={currentUser}
        userName={currentUser?.name || currentUser?.email || "Lab Operator"}
        onLogout={handleLogout}
      />
    );
  }

  // 2. Public Landing Hero & Overview
  if (viewState === "landing") {
    return <LandingHero onOpenPortals={handleOpenPortals} />;
  }

  // 3. Role-Based Portal Gateway
  if (viewState === "gateway") {
    return (
      <PortalGateway
        onSelectPortal={handleSelectPortal}
        onBackToLanding={() => setViewState("landing")}
      />
    );
  }

  // 4. Role-Specific Authorization Screen
  return (
    <main className="auth-page">
      <section className="landing-copy">
        <button className="back-gateway-btn" onClick={() => setViewState("gateway")}>
          &larr; Return to Portals
        </button>
        <div>
          <div className="brand-pill">
            {selectedPortal.toUpperCase()} ACCESS NODE
          </div>
        </div>
        <h1>
          {selectedPortal === "student" && "Access Experiment Notebooks & Workbenches"}
          {selectedPortal === "teacher" && "Cohort Supervision & Protocol Management"}
          {selectedPortal === "admin" && "Laboratory Infrastructure & Hardware Control"}
        </h1>
        <p className="text-secondary" style={{ maxWidth: '480px', marginTop: '12px' }}>
          {selectedPortal === "student" && "Record laboratory observations, verify instrument calibrations, and submit data sets for grading."}
          {selectedPortal === "teacher" && "Unlock workstation terminals, audit experiment runs, and manage student project evaluations."}
          {selectedPortal === "admin" && "Monitor bench sensor readings, schedule autoclave/spectrometer service, and audit safety adherence."}
        </p>
      </section>

      <aside className="auth-panel">
        <LoginForm
          role={selectedPortal}
          onLoginSuccess={handleLoginSuccess}
          onBack={() => setViewState("gateway")}
        />
      </aside>
    </main>
  );
}

export default App;
