import React, { useState, useEffect } from 'react';

export function EventModal({ event, isOpen, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('13:15');
  const [endTime, setEndTime] = useState('15:00');
  const [repeat, setRepeat] = useState('Weekly');
  const [attendees, setAttendees] = useState([]);
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [showAddAttendee, setShowAddAttendee] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || 'Tales of Women in Design');
      setStartTime(event.startTime || '13:15');
      setEndTime(event.endTime || '15:00');
      setRepeat(event.repeat || 'Weekly');
      if (event.attendees && event.attendees.length > 0) {
        setAttendees(event.attendees);
      }
    } else {
      setTitle('Advanced DSP Experiment: FFT & Filter Design');
      setStartTime('13:15');
      setEndTime('15:00');
      setRepeat('Weekly');
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  // Convert "HH:MM" to angle in degrees on 24hr or 12hr clock (0 deg is top / 00:00 or 12:00)
  const timeToAngle = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = ((h % 24) * 60) + (m || 0);
    // 24 hours = 1440 minutes = 360 degrees
    return (totalMinutes / 1440) * 360;
  };

  const startAngle = timeToAngle(startTime);
  const endAngle = timeToAngle(endTime);

  // Helper to calculate SVG arc path
  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180.0;
    const endRad = ((endAngle - 90) * Math.PI) / 180.0;

    const startX = x + radius * Math.cos(startRad);
    const startY = y + radius * Math.sin(startRad);
    const endX = x + radius * Math.cos(endRad);
    const endY = y + radius * Math.sin(endRad);

    const diff = (endAngle - startAngle + 360) % 360;
    const largeArcFlag = diff > 180 ? 1 : 0;

    return [
      'M', startX, startY,
      'A', radius, radius, 0, largeArcFlag, 1, endX, endY
    ].join(' ');
  };

  const handleAddAttendee = () => {
    if (newAttendeeName.trim()) {
      const avatars = ['🧑‍🔬', '👩‍🎓', '👨‍🏫', '👩‍🚀', '🧑‍💻'];
      const colors = ['#38bdf8', '#fb7185', '#34d399', '#a78bfa', '#f59e0b'];
      const newAtt = {
        id: Date.now(),
        name: newAttendeeName.trim(),
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        color: colors[Math.floor(Math.random() * colors.length)]
      };
      setAttendees([...attendees, newAtt]);
      setNewAttendeeName('');
      setShowAddAttendee(false);
    }
  };

  const handleRemoveAttendee = (id) => {
    setAttendees(attendees.filter(a => a.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        ...(event || {}),
        id: event?.id || `evt-${Date.now()}`,
        title: title || 'Scheduled Lab Session',
        startTime,
        endTime,
        repeat,
        attendees,
      });
    }
    onClose();
  };

  return (
    <div className="event-modal-backdrop" onClick={onClose}>
      <div className="event-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="event-modal-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <form onSubmit={handleSubmit} className="event-modal-form">
          <div className="event-modal-layout">
            {/* Left Side: Title, Attendees, Repeat */}
            <div className="event-modal-left">
              <div className="event-field-group">
                <label className="event-modal-label">Title</label>
                <input
                  type="text"
                  className="event-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event or Experiment Title..."
                  required
                  autoFocus
                />
              </div>

              <div className="event-field-group" style={{ marginTop: '24px' }}>
                <label className="event-modal-label">Add Required Attendees</label>
                <div className="attendees-row">
                  {attendees.map((att) => (
                    <div
                      key={att.id}
                      className="attendee-avatar"
                      title={`${att.name} (Click to remove)`}
                      onClick={() => handleRemoveAttendee(att.id)}
                    >
                      <span className="attendee-icon">{att.avatar}</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-attendee-btn"
                    onClick={() => setShowAddAttendee(!showAddAttendee)}
                    title="Add attendee"
                  >
                    +
                  </button>
                </div>

                {showAddAttendee && (
                  <div className="add-attendee-popover">
                    <input
                      type="text"
                      placeholder="Attendee Name"
                      value={newAttendeeName}
                      onChange={(e) => setNewAttendeeName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAttendee())}
                    />
                    <button type="button" className="small-gold-button" onClick={handleAddAttendee}>
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div className="event-field-group" style={{ marginTop: '24px' }}>
                <label className="event-modal-label">Repeat</label>
                <div className="custom-select-wrapper">
                  <select
                    className="event-repeat-select"
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value)}
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Daily">Daily</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Never">Does Not Repeat</option>
                  </select>
                  <span className="select-arrow">▼</span>
                </div>
              </div>
            </div>

            {/* Right Side: Circular Radial Clock & Time Pickers */}
            <div className="event-modal-right">
              <label className="event-modal-label" style={{ textAlign: 'center', width: '100%' }}>Time</label>

              {/* Radial Clock Dial */}
              <div className="radial-clock-container">
                <svg className="radial-clock-svg" viewBox="0 0 200 200">
                  {/* Background Circle */}
                  <circle cx="100" cy="100" r="80" className="clock-dial-bg" />
                  <circle cx="100" cy="100" r="62" className="clock-dial-inner" />

                  {/* Decorative tick marks around the clock */}
                  {[...Array(24)].map((_, i) => {
                    const angle = (i * 15 * Math.PI) / 180;
                    const x1 = 100 + 74 * Math.sin(angle);
                    const y1 = 100 - 74 * Math.cos(angle);
                    const x2 = 100 + (i % 6 === 0 ? 68 : 71) * Math.sin(angle);
                    const y2 = 100 - (i % 6 === 0 ? 68 : 71) * Math.cos(angle);
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={i % 6 === 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}
                        strokeWidth={i % 6 === 0 ? "2" : "1"}
                      />
                    );
                  })}

                  {/* Decorative Color Arcs (Matching Image 1: Cyan/Teal arc top-left, Amber arc bottom-left, Coral arc bottom-right) */}
                  <path
                    d={describeArc(100, 100, 72, 300, 360)}
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d={describeArc(100, 100, 72, 160, 240)}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d={describeArc(100, 100, 72, 100, 155)}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />

                  {/* Active Event Selected Range Arc */}
                  <path
                    d={describeArc(100, 100, 72, startAngle, endAngle > startAngle ? endAngle : endAngle + 360)}
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth="7"
                    strokeDasharray="4 2"
                    className="clock-active-arc"
                  />

                  {/* Hand Indicator from Image 1: Stylized white pointer arm */}
                  <g transform={`rotate(${endAngle}, 100, 100)`}>
                    <path
                      d="M 100,100 L 98,28 Q 100,20 102,28 Z"
                      fill="#ffffff"
                      filter="drop-shadow(0 2px 6px rgba(0,0,0,0.5))"
                    />
                    <circle cx="100" cy="24" r="6" fill="#ffffff" stroke="#141c2b" strokeWidth="2" />
                    <circle cx="100" cy="24" r="2.5" fill="#00f0ff" />
                  </g>

                  {/* Center Time Readout Display */}
                  <circle cx="100" cy="100" r="44" fill="#141c2c" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                </svg>

                <div className="clock-digital-center">
                  <span className="clock-time-strong">{startTime}</span>
                  <span className="clock-time-sub">till {endTime}</span>
                </div>
              </div>

              {/* Time Pickers Row */}
              <div className="time-pickers-row">
                <div className="time-pick-box">
                  <span>From</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="time-pick-box">
                  <span>To</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Button: Full-width vibrant Teal/Cyan Update button from Image 1 */}
          <div className="event-modal-actions">
            <button type="submit" className="event-modal-submit-btn">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventModal;
