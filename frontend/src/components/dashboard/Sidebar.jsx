import React from 'react';

export function Sidebar({ userRole, activePage, onNavigate, onLogout, pendingClearancesCount = 0 }) {
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';
  const canManage = isTeacher || isAdmin;

  // Nav items matching Image 1's icon rail
  const navItems = [
    {
      id: 'home',
      label: 'Command Overview',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      id: 'schedule',
      label: 'Schedule & Timeline',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      id: 'notebook',
      label: 'Attendance & Notebooks',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      id: 'equipment',
      label: 'Equipment & Workstations',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      id: 'modules',
      label: 'Lab Protocols & Modules',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      )
    },
    {
      id: 'submissions',
      label: 'Experiment Deliverables',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
  ];

  if (canManage) {
    navItems.push({
      id: 'upload',
      label: 'Student Grading & Performance',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    });
    navItems.push({
      id: 'teacherSubmissions',
      label: 'Submissions Review',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    });
  }

  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'System & Registry',
      badge: pendingClearancesCount,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    });
  }

  return (
    <aside className="slim-icon-sidebar" aria-label="Main Navigation">
      {/* Top Brand Mark (Orange Graduation Cap from Image 1) */}
      <div className="sidebar-top-brand" title="Lab Companion Command Center">
        <div className="grad-cap-badge">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#ff782d">
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.5 8.13 21.36 12 21.36C15.87 21.36 19 19.5 19 17.18V13.18L12 17L5 13.18Z" />
          </svg>
        </div>
      </div>

      {/* Main Navigation Vertical Rail */}
      <nav className="sidebar-icon-rail">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rail-icon-btn ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            aria-label={item.label}
            style={{ position: 'relative' }}
          >
            <span className="rail-icon-svg" style={{ position: 'relative', display: 'inline-flex' }}>
              {item.icon}
              {item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-9px',
                    background: '#f59e0b',
                    color: '#000',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: '900',
                    padding: '1px 5px',
                    lineHeight: '1.2',
                    boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </span>
            <span className="rail-tooltip">
              {item.label}
              {item.badge > 0 ? ` (${item.badge} pending)` : ''}
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom Logout Button (matching Image 1 exit icon) */}
      <div className="sidebar-bottom-action">
        <button
          type="button"
          className="rail-icon-btn logout-rail-btn"
          onClick={onLogout}
          title={`Sign Out (${userRole})`}
          aria-label="Sign out"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="rail-tooltip">Sign Out ({userRole})</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
