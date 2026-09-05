import React, { useState, useEffect } from 'react';

export function Header({
  user,
  userName,
  userRole,
  activePage,
  onSearch,
  onLogout,
  lastSyncTime,
  isSyncing,
  onSyncNow
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Real-time ticking clock (1000ms interval)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const notifications = [
    { id: 1, title: 'Institutional laboratory services active', time: 'Just now', type: 'alert' },
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const getInitials = (name) => {
    if (!name) return 'LC';
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2).toUpperCase();
  };

  const formattedDay = currentDateTime.toLocaleDateString('en-US', { weekday: 'short' });
  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getSyncText = () => {
    if (isSyncing) return 'Syncing...';
    if (!lastSyncTime) return 'Live Stream';
    const diffSec = Math.floor((currentDateTime - lastSyncTime) / 1000);
    if (diffSec < 4) return 'Just synced';
    return `Synced ${diffSec}s ago`;
  };

  return (
    <header className="image1-dashboard-header">
      {/* 1. Left: Search Bar */}
      <div className="header-search-box">
        <svg className="header-search-icon" viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="header-search-input"
          placeholder="Search labs, experiments, instruments..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* 2. Middle: Real-Time Date & Time Telemetry + Live Data Sync */}
      <div className="header-realtime-clock-pill">
        <div className="realtime-live-indicator" title="Real-Time Telemetry Connection Active">
          <span className="live-pulse-dot" />
          <span className="live-text">LIVE</span>
        </div>

        <div className="realtime-datetime-group">
          <div className="realtime-clock-row">
            <span className="realtime-clock-time">{formattedTime}</span>
            <span className="realtime-tz-badge">IST</span>
          </div>
          <div className="realtime-date-row">
            <span className="realtime-clock-day">{formattedDay},</span>
            <span className="realtime-clock-date">{formattedDate}</span>
          </div>
        </div>

        <div className="realtime-data-sync-box" title="Real-Time Data Stream: Click to force sync">
          <span className="realtime-sync-status">{getSyncText()}</span>
          <button
            type="button"
            className={`realtime-sync-btn ${isSyncing ? 'is-syncing' : ''}`}
            onClick={onSyncNow}
            aria-label="Synchronize Real-Time Data"
            title="Refresh Real-Time Data Now"
          >
            <svg
              className={`sync-svg-icon ${isSyncing ? 'spinning' : ''}`}
              viewBox="0 0 24 24"
              width="13"
              height="13"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 3. Right Utility Area */}
      <div className="header-right-actions">
        {/* Pending Invites / Notifications Pill (Matching Image 1: "🔔 2 pending invites ∨") */}
        <div className="notifications-dropdown-container">
          <button
            type="button"
            className="pending-invites-pill-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-expanded={showNotifications}
          >
            <span className="notif-bell-icon">🔔</span>
            <span>2 pending invites</span>
            <span className="dropdown-caret">▼</span>
          </button>

          {showNotifications && (
            <div className="notifications-popover-card">
              <div className="popover-header">
                <strong>Pending System Notifications</strong>
                <span className="badge-count">2 New</span>
              </div>
              <div className="popover-list">
                {notifications.map((n) => (
                  <div key={n.id} className="popover-item">
                    <span className="popover-item-icon">{n.type === 'alert' ? '⚠️' : '📋'}</span>
                    <div>
                      <p className="popover-item-text">{n.title}</p>
                      <small className="popover-item-time">{n.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill with Avatar and Dropdown */}
        <div className="user-profile-pill-container">
          <button
            type="button"
            className="user-profile-pill-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
          >
            <div className="user-avatar-circle">
              {getInitials(userName || user?.name || user?.email || 'User')}
            </div>
            <span className="user-name-text">{userName || user?.name || user?.email || 'User'}</span>
            <span className="dropdown-caret">▼</span>
          </button>

          {showProfileMenu && (
            <div className="profile-menu-popover">
              <div className="profile-menu-header">
                <strong>{userName || user?.name || user?.email || 'User'}</strong>
                <span className="role-tag-pill">{userRole?.toUpperCase()}</span>
                {user?.email && <small className="font-mono text-muted">{user.email}</small>}
              </div>
              <div className="profile-menu-body">
                {user?.dept && (
                  <div className="profile-detail-row">
                    <span>Department:</span>
                    <strong>{user.dept}</strong>
                  </div>
                )}
                {user?.userId && (
                  <div className="profile-detail-row">
                    <span>Badge ID:</span>
                    <strong className="font-mono">{user.userId}</strong>
                  </div>
                )}
              </div>
              <div className="profile-menu-footer">
                <button type="button" className="signout-menu-btn" onClick={onLogout}>
                  Sign Out Session &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
