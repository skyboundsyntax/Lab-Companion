import React from 'react';

export function PortalGateway({ onSelectPortal, onBackToLanding }) {
  const portals = [
    {
      id: 'student',
      title: 'Student Lab Notebook',
      icon: '🎓',
      kicker: 'Session Access & Code Submissions',
      desc: 'Access your assigned lab workstation, view experiment protocol manuals, run coding benchmarks, record datasets, and submit post-lab deliverables.',
      badge: 'Active Term'
    },
    {
      id: 'teacher',
      title: 'Faculty / Instructor Portal',
      icon: '🧑‍🏫',
      kicker: 'Session Supervision & Grading',
      desc: 'Supervise ongoing cohort batches, unlock courseware modules, verify calibration readings, review student code, and assign official grades.',
      badge: 'Instructor Clearance'
    },
    {
      id: 'admin',
      title: 'Lab Facilities & Admin',
      icon: '⚙️',
      kicker: 'Lab Workstations & Code Audits',
      desc: 'Manage hardware maintenance cycles, configure lab workstation topologies, oversee safety compliance, and audit PostgreSQL academic databases.',
      badge: 'Full Root Access'
    }
  ];

  return (
    <main className="gateway-page">
      <header className="gateway-header">
        <button className="back-gateway-btn" onClick={onBackToLanding}>
          &larr; Return to Overview
        </button>
        <div className="brand-pill">AUTHENTICATION GATEWAY</div>
        <h1>Select Laboratory Command Portal</h1>
        <p className="gateway-subtitle">
          Choose your role-specific console to access specialized lab schedules, code repositories, and grading consoles.
        </p>
      </header>

      <section className="gateway-grid">
        {portals.map((portal) => (
          <article 
            key={portal.id} 
            className="gateway-card"
            onClick={() => onSelectPortal(portal.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectPortal(portal.id)}
          >
            <div className="gateway-card-icon">{portal.icon}</div>
            <div className="attendance-pill" style={{ marginBottom: '12px' }}>{portal.badge}</div>
            <h2>{portal.title}</h2>
            <p>{portal.desc}</p>
            <button className="gateway-card-button" type="button">
              Authenticate into {portal.id.charAt(0).toUpperCase() + portal.id.slice(1)} Portal &rarr;
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

export default PortalGateway;
