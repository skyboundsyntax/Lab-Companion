import React, { useState, useEffect } from 'react';
import EventModal from './EventModal';

export function ScheduleTab({ labs = [], allLabs = [], user, isTeacher, isAdmin, lastSyncTime, isSyncing, onSyncNow }) {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const userName = user?.name || user?.full_name || '';

  // Helper to check if event is supervised by the logged-in teacher
  const isUserTeacherLab = (evt) => {
    if (!isTeacher || !userName) return false;
    const uClean = userName.toLowerCase();
    const instClean = (evt.instructor || '').toLowerCase();
    if (instClean && (instClean.includes(uClean) || uClean.includes(instClean))) {
      return true;
    }
    return evt.attendees?.some((a) => {
      const aClean = (a.name || '').toLowerCase();
      return aClean.includes(uClean) || uClean.includes(aClean);
    });
  };

  // Realistic Departmental Faculty Schedule:
  // Each teacher has 1-3 labs; same lab taught by different teachers on non-overlapping days!
  const [events, setEvents] = useState([
    // MONDAY
    {
      id: 'evt-1',
      title: 'Data Structures & Algorithms Lab (LAB-301)',
      category: 'Core Computer Science Lab',
      instructor: 'Prof. Marcus Vance',
      day: 'Monday',
      dateNum: 7,
      startTime: '09:00',
      endTime: '11:30',
      duration: '2h 30m',
      topOffset: '20px',
      height: '140px',
      colorTheme: 'cyan',
      attendees: [
        { id: 1, name: 'Aarav Sharma (2023CSE0101)', avatar: '👨‍🎓' },
        { id: 2, name: 'Ananya Verma (2022CSE0102)', avatar: '👩‍💻' },
        { id: 3, name: 'Prof. Marcus Vance', avatar: '👨‍🏫' },
      ],
      description: 'Binary search trees, AVL balancing, graph representations, and dynamic programming algorithms.',
      room: 'Computing Systems Lab 204',
      urgentBadge: 'Upcoming Session'
    },
    {
      id: 'evt-2',
      title: 'Object Oriented Programming with Java Lab (LAB-302)',
      category: 'Software Engineering Lab',
      instructor: 'Prof. Marcus Vance',
      day: 'Monday',
      dateNum: 7,
      startTime: '13:15',
      endTime: '15:15',
      duration: '2h',
      topOffset: '240px',
      height: '130px',
      colorTheme: 'amber',
      attendees: [
        { id: 4, name: 'Tanya Roy (2023AIM0202)', avatar: '👩‍🎓' },
        { id: 5, name: 'Siddharth Rao (2024AIM0201)', avatar: '👨‍🎓' },
        { id: 6, name: 'Prof. Marcus Vance', avatar: '👨‍🏫' },
      ],
      description: 'Multithreading, synchronized queues, Java Collections Framework, and JDBC transactions.',
      room: 'Software Towers - Lab 302',
    },

    // TUESDAY (Dr. Rajiv Sen takes LAB-301 Section B - non-coinciding day with Prof. Marcus Vance!)
    {
      id: 'evt-3',
      title: 'Data Structures & Algorithms Lab (LAB-301) - Cohort B',
      category: 'Core Computer Science Lab',
      instructor: 'Dr. Rajiv Sen',
      day: 'Tuesday',
      dateNum: 8,
      startTime: '09:00',
      endTime: '11:30',
      duration: '2h 30m',
      topOffset: '20px',
      height: '140px',
      colorTheme: 'cyan',
      attendees: [
        { id: 25, name: 'Varun Chopra (2022DAT0301)', avatar: '👨‍🎓' },
        { id: 26, name: 'Tanya Roy (2023AIM0202)', avatar: '👩‍🎓' },
        { id: 27, name: 'Dr. Rajiv Sen', avatar: '👨‍🏫' },
      ],
      description: 'Graphs traversal (BFS/DFS), shortest paths, and dynamic programming memoization.',
      room: 'Computing Systems Lab 204'
    },
    {
      id: 'evt-4',
      title: 'Digital Electronics & Verilog HDL Lab (LAB-303)',
      category: 'Hardware Synthesis Lab',
      instructor: 'Dr. Aman Gupta',
      day: 'Tuesday',
      dateNum: 8,
      startTime: '11:45',
      endTime: '14:15',
      duration: '2h 30m',
      topOffset: '165px',
      height: '140px',
      colorTheme: 'purple',
      attendees: [
        { id: 7, name: 'Rohan Iyer (2023ECE0501)', avatar: '👨‍🎓' },
        { id: 8, name: 'Sneha Patel (2021ECE0502)', avatar: '👩‍🎓' },
        { id: 9, name: 'Dr. Aman Gupta', avatar: '👨‍🏫' },
      ],
      description: 'Finite state machine synthesis, 16-bit ALU design, and Xilinx FPGA hardware simulation.',
      room: 'VLSI & Embedded Lab 202'
    },
    {
      id: 'evt-5',
      title: 'Electronic Devices & Circuits Lab (LAB-311)',
      category: 'Analog Electronics Lab',
      instructor: 'Dr. Aman Gupta',
      day: 'Tuesday',
      dateNum: 8,
      startTime: '14:30',
      endTime: '17:00',
      duration: '2h 30m',
      topOffset: '315px',
      height: '140px',
      colorTheme: 'rose',
      attendees: [
        { id: 10, name: 'Aman Saxena (2023ECM0901)', avatar: '👨‍🎓' },
        { id: 11, name: 'Divya Reddy (2021ECM0902)', avatar: '👩‍🎓' },
        { id: 12, name: 'Dr. Aman Gupta', avatar: '👨‍🏫' },
      ],
      description: 'BJT common-emitter amplifier frequency response, MOSFET switching, and oscilloscope calibration.',
      room: 'Microelectronics Wing - Lab 108'
    },

    // WEDNESDAY (Prof. Marcus Vance takes LAB-401; Dr. Rajiv Sen takes LAB-302 Cohort B)
    {
      id: 'evt-6',
      title: 'Operating Systems & Linux Kernel Lab (LAB-401)',
      category: 'Operating Systems Lab',
      instructor: 'Prof. Marcus Vance',
      day: 'Wednesday',
      dateNum: 9,
      startTime: '09:30',
      endTime: '12:00',
      duration: '2h 30m',
      topOffset: '30px',
      height: '140px',
      colorTheme: 'cyan',
      attendees: [
        { id: 1, name: 'Aarav Sharma (2023CSE0101)', avatar: '👨‍🎓' },
        { id: 2, name: 'Ananya Verma (2022CSE0102)', avatar: '👩‍💻' },
        { id: 3, name: 'Prof. Marcus Vance', avatar: '👨‍🏫' },
      ],
      description: 'Linux kernel system call tracing, process scheduling algorithms, and IPC shared memory.',
      room: 'Kernel Systems Bay 305'
    },
    {
      id: 'evt-7',
      title: 'Object Oriented Programming with Java Lab (LAB-302) - Cohort B',
      category: 'Software Engineering Lab',
      instructor: 'Dr. Rajiv Sen',
      day: 'Wednesday',
      dateNum: 9,
      startTime: '13:15',
      endTime: '15:15',
      duration: '2h',
      topOffset: '240px',
      height: '130px',
      colorTheme: 'amber',
      attendees: [
        { id: 28, name: 'Ananya Verma (2022CSE0102)', avatar: '👩‍💻' },
        { id: 29, name: 'Dr. Rajiv Sen', avatar: '👨‍🏫' },
      ],
      description: 'Design patterns in Java, thread synchronizers, reflection API, and unit testing.',
      room: 'Software Towers - Lab 302'
    },

    // THURSDAY (Prof. Sneha Deshmukh takes LAB-303 Cohort B - non-coinciding day with Dr. Aman Gupta!)
    {
      id: 'evt-8',
      title: 'Digital Electronics & Verilog HDL Lab (LAB-303) - Cohort B',
      category: 'Hardware Synthesis Lab',
      instructor: 'Prof. Sneha Deshmukh',
      day: 'Thursday',
      dateNum: 10,
      startTime: '10:00',
      endTime: '12:30',
      duration: '2h 30m',
      topOffset: '70px',
      height: '140px',
      colorTheme: 'purple',
      attendees: [
        { id: 30, name: 'Sneha Patel (2021ECE0502)', avatar: '👩‍🎓' },
        { id: 31, name: 'Prof. Sneha Deshmukh', avatar: '👩‍🏫' },
      ],
      description: 'Synthesis on Cyclone IV FPGA, clock dividers, and digital counter hardware test.',
      room: 'VLSI & Embedded Lab 202'
    },
    {
      id: 'evt-9',
      title: 'DC Machines & Electrical Transformers Lab (LAB-321)',
      category: 'Heavy Electrical Bay',
      instructor: 'Dr. Sarah Lin',
      day: 'Thursday',
      dateNum: 10,
      startTime: '13:30',
      endTime: '16:30',
      duration: '3h',
      topOffset: '250px',
      height: '160px',
      colorTheme: 'amber',
      attendees: [
        { id: 16, name: 'Aditya Nair (2024EEE0601)', avatar: '👨‍🎓' },
        { id: 17, name: 'Kavya Menon (2022EEE0602)', avatar: '👩‍🎓' },
        { id: 18, name: 'Dr. Sarah Lin (Lead Admin)', avatar: '👩‍🏫' },
      ],
      description: 'Open circuit and short circuit tests on single-phase transformers and DC shunt motor load testing.',
      room: 'Heavy Machinery Bay - Station 1'
    },

    // FRIDAY (Prof. Sneha Deshmukh takes LAB-311 Cohort B; Dr. Sarah Lin takes LAB-331)
    {
      id: 'evt-10',
      title: 'Electronic Devices & Circuits Lab (LAB-311) - Cohort B',
      category: 'Analog Electronics Lab',
      instructor: 'Prof. Sneha Deshmukh',
      day: 'Friday',
      dateNum: 11,
      startTime: '09:30',
      endTime: '12:00',
      duration: '2h 30m',
      topOffset: '40px',
      height: '140px',
      colorTheme: 'rose',
      attendees: [
        { id: 32, name: 'Divya Reddy (2021ECM0902)', avatar: '👩‍🎓' },
        { id: 33, name: 'Prof. Sneha Deshmukh', avatar: '👩‍🏫' },
      ],
      description: 'Operational amplifier filters, active RC integrators, and oscilloscope waveform analysis.',
      room: 'Microelectronics Wing - Lab 108'
    },
    {
      id: 'evt-11',
      title: 'Fluid Mechanics & Hydraulic Machinery Lab (LAB-331)',
      category: 'Mechanical Engineering Lab',
      instructor: 'Dr. Sarah Lin',
      day: 'Friday',
      dateNum: 11,
      startTime: '13:30',
      endTime: '16:00',
      duration: '2h 30m',
      topOffset: '250px',
      height: '150px',
      colorTheme: 'rose',
      attendees: [
        { id: 19, name: 'Vikram Singh (2023MEC0701)', avatar: '👨‍🎓' },
        { id: 20, name: 'Pooja Kulkarni (2021MEC0702)', avatar: '👩‍🎓' },
        { id: 21, name: 'Dr. Sarah Lin', avatar: '👩‍🏫' },
      ],
      description: 'Venturi meter coefficient calibration, Pelton wheel impulse turbine performance, and Reynolds number experiments.',
      room: 'Thermal & Fluids Annex - Rig 02'
    },
  ]);

  const currentDayName = currentDateTime.toLocaleDateString('en-US', { weekday: 'long' });

  const daysOfWeek = [
    { dayName: 'Monday', label: 'M', dateNum: 7, isToday: currentDayName === 'Monday' },
    { dayName: 'Tuesday', label: 'T', dateNum: 8, isToday: currentDayName === 'Tuesday' },
    { dayName: 'Wednesday', label: 'W', dateNum: 9, isToday: currentDayName === 'Wednesday' },
    { dayName: 'Thursday', label: 'T', dateNum: 10, isToday: currentDayName === 'Thursday' },
    { dayName: 'Friday', label: 'F', dateNum: 11, isToday: currentDayName === 'Friday' },
    { dayName: 'Saturday', label: 'S', dateNum: 12, isToday: currentDayName === 'Saturday' },
    { dayName: 'Sunday', label: 'S', dateNum: 13, isToday: currentDayName === 'Sunday' },
  ];

  const handleOpenEvent = (evt) => {
    setActiveModalEvent(evt);
    setIsModalOpen(true);
  };

  const handleAddNewEvent = () => {
    const newEvtTemplate = {
      id: null,
      title: 'New Laboratory Practical',
      category: 'Engineering Lab',
      day: selectedDay,
      dateNum: daysOfWeek.find(d => d.dayName === selectedDay)?.dateNum || 10,
      startTime: '11:00',
      endTime: '13:00',
      duration: '2h',
      colorTheme: 'cyan',
      attendees: [
        { id: Date.now(), name: userName || 'Faculty Lead', avatar: '👨‍🏫' }
      ],
      description: 'Hands-on practical session setup.',
      room: 'General Engineering Lab',
    };
    setActiveModalEvent(newEvtTemplate);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (savedEvt) => {
    if (savedEvt.id) {
      setEvents((prev) => prev.map((e) => (e.id === savedEvt.id ? { ...e, ...savedEvt } : e)));
    } else {
      const newEvt = {
        ...savedEvt,
        id: `evt-${Date.now()}`,
        day: selectedDay,
        dateNum: daysOfWeek.find(d => d.dayName === selectedDay)?.dateNum || 10,
        colorTheme: 'rose',
        topOffset: '180px',
        height: '110px',
      };
      setEvents((prev) => [...prev, newEvt]);
    }
  };

  const currentDayEvents = events.filter((e) => e.day === selectedDay);

  return (
    <div className="schedule-tab-container">
      {/* 1. Geometric Bauhaus/Memphis Decorative Banner (Matching Image 1) */}
      <div className="geometric-header-banner" role="img" aria-label="Decorative abstract geometric schedule banner">
        <div className="geo-pattern-grid">
          <div className="geo-shape geo-coral-quarter" />
          <div className="geo-shape geo-pink-semicircle" />
          <div className="geo-shape geo-black-block" />
          <div className="geo-shape geo-teal-quarter" />
          <div className="geo-shape geo-yellow-circle" />
          <div className="geo-shape geo-coral-stripe" />
          <div className="geo-shape geo-navy-semicircle" />
          <div className="geo-shape geo-pink-quarter" />
          <div className="geo-shape geo-teal-block" />
          <div className="geo-shape geo-yellow-semicircle" />
          <div className="geo-shape geo-black-quarter" />
          <div className="geo-shape geo-coral-semicircle" />
        </div>
      </div>

      {/* 2. Main Schedule Workspace Card */}
      <div className="schedule-workspace-card">
        {/* Month Navigation & Kicker */}
        <div className="schedule-top-nav">
          <div className="month-selector">
            <button
              className="month-nav-btn"
              onClick={() => setSelectedMonth('September 2026')}
              aria-label="Previous Month"
            >
              ‹
            </button>
            <span className="month-nav-label">{selectedMonth}</span>
            <button
              className="month-nav-btn"
              onClick={() => setSelectedMonth('November 2026')}
              aria-label="Next Month"
            >
              ›
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}>
              <span className="live-pulse-dot" />
              <span style={{ color: '#34d399', fontWeight: '800', letterSpacing: '0.05em' }}>LIVE CLOCK:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formattedLiveDate} · {formattedLiveTime} IST</strong>
            </div>

            {isTeacher && (
              <span style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: 'var(--primary)',
                fontWeight: '700',
              }}>
                ⭐ Faculty: {userName}
              </span>
            )}

            <div className="schedule-kicker-tag">
              <span className="dot green" />
              <span>{isSyncing ? 'Syncing...' : 'Real-Time Timetable Sync'}</span>
            </div>
          </div>
        </div>

        {/* 3. Two-Column Layout (This Week & Day Timeline) */}
        <div className="schedule-columns-grid">
          {/* Left Column: This Week Day Selector */}
          <aside className="week-overview-column">
            <h2 className="week-heading">
              This <strong>Week</strong>
            </h2>

            <div className="week-days-list">
              {daysOfWeek.map((day) => {
                const dayEvents = events.filter((e) => e.day === day.dayName);
                const isSelected = selectedDay === day.dayName;
                const hasUserSession = dayEvents.some((e) => isUserTeacherLab(e));

                return (
                  <div
                    key={day.dayName}
                    className={`week-day-card ${isSelected ? 'selected' : ''} ${day.isToday ? 'is-today' : ''}`}
                    onClick={() => setSelectedDay(day.dayName)}
                    style={{
                      borderLeft: hasUserSession ? '4px solid #38bdf8' : undefined,
                      background: hasUserSession && !isSelected ? 'rgba(56, 189, 248, 0.04)' : undefined,
                    }}
                  >
                    <div className="day-card-left">
                      {day.isToday && <span className="today-badge">Today</span>}
                      {hasUserSession && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: '800',
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.15)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          marginBottom: '2px',
                          display: 'inline-block'
                        }}>
                          YOUR LAB
                        </span>
                      )}
                      <span className="day-initial">{day.label}</span>
                      <span className="day-date">{day.dateNum}th</span>
                    </div>

                    <div className="day-card-events">
                      {dayEvents.map((evt) => {
                        const isMine = isUserTeacherLab(evt);
                        return (
                          <div
                            key={evt.id}
                            className="day-event-snippet"
                            onClick={(e) => { e.stopPropagation(); handleOpenEvent(evt); }}
                            style={{
                              borderLeft: isMine ? '3px solid #38bdf8' : undefined,
                              background: isMine ? 'rgba(56, 189, 248, 0.12)' : undefined,
                            }}
                          >
                            <span className="event-snippet-title">
                              {isMine && '⭐ '}{evt.title}
                            </span>
                            <span className="event-snippet-time">{evt.startTime} — {evt.endTime}</span>
                            {evt.urgentBadge && (
                              <div className="urgent-indicator">
                                <span className="urgent-line" />
                                <span className="urgent-text">{evt.urgentBadge}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {dayEvents.length === 0 && (
                        <span className="no-events-text">No scheduled lab sessions</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Column: Timeline Detail for Selected Day */}
          <section className="timeline-main-column">
            <div className="timeline-header">
              <h2 className="selected-day-title">
                {daysOfWeek.find(d => d.dayName === selectedDay)?.dateNum || 10}th, <strong>{selectedDay}</strong>
              </h2>
              <span className="font-mono text-secondary" style={{ fontSize: '13px' }}>
                {currentDayEvents.length} Sessions Allocated
              </span>
            </div>

            {/* Timeline Hours and Event Blocks */}
            <div className="timeline-canvas">
              {/* Hour Grid Lines */}
              {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time) => (
                <div key={time} className="timeline-hour-slot">
                  <span className="hour-label font-mono">{time}</span>
                  <div className="hour-dash-line" />
                </div>
              ))}

              {/* Live Current Time Indicator Marker */}
              {selectedDay === 'Monday' && (
                <div className="live-time-indicator" style={{ top: '210px' }}>
                  <div className="live-time-pill">
                    <span className="live-time-marker-bar" />
                    <span className="live-time-bold">12:45</span>
                    <span className="live-time-note">Next event in 30m</span>
                  </div>
                  <div className="live-time-full-line" />
                </div>
              )}

              {/* Event Cards Positioned on Timeline */}
              <div className="timeline-events-layer">
                {currentDayEvents.map((evt) => {
                  const isMine = isUserTeacherLab(evt);

                  return (
                    <div
                      key={evt.id}
                      className={`timeline-event-card theme-${evt.colorTheme}`}
                      style={{
                        top: evt.topOffset || '60px',
                        minHeight: evt.height || '90px',
                        border: isMine ? '2.5px solid #38bdf8' : undefined,
                        boxShadow: isMine ? '0 0 20px rgba(56, 189, 248, 0.45), 0 8px 24px rgba(0, 0, 0, 0.3)' : undefined,
                        zIndex: isMine ? 10 : 2,
                      }}
                      onClick={() => handleOpenEvent(evt)}
                      role="button"
                      tabIndex={0}
                    >
                      {/* Teacher highlighted badge (Requirement 7) */}
                      {isMine && (
                        <div style={{
                          position: 'absolute',
                          top: '-12px',
                          left: '14px',
                          background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                          color: '#0f172a',
                          padding: '2px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '10px',
                          fontWeight: '900',
                          letterSpacing: '0.06em',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>⭐</span>
                          <span>YOUR SUPERVISED SESSION ({userName})</span>
                        </div>
                      )}

                      <div className="timeline-card-header" style={{ marginTop: isMine ? '6px' : '0' }}>
                        <div>
                          <h4 className="timeline-event-title">{evt.title}</h4>
                          <span className="timeline-event-time font-mono">
                            {evt.startTime} ···· {evt.endTime}
                          </span>
                        </div>
                        <span className="duration-pill font-mono">{evt.duration || '1h'}</span>
                      </div>

                      <div className="timeline-card-footer">
                        <div className="timeline-avatars">
                          {evt.attendees?.map((att) => (
                            <span key={att.id} className="timeline-avatar-bubble" title={att.name}>
                              {att.avatar}
                            </span>
                          ))}
                          <span style={{ fontSize: '11px', color: isMine ? '#38bdf8' : 'var(--text-muted)', marginLeft: '6px', fontWeight: isMine ? '700' : 'normal' }}>
                            Lead: {evt.instructor}
                          </span>
                        </div>
                        <span className="timeline-room-tag">{evt.room}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floating "+ Add Event" Button */}
            <div className="timeline-actions-footer">
              <button
                type="button"
                className="add-event-floating-btn"
                onClick={handleAddNewEvent}
              >
                + Add Event
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* 4. Interactive Radial Dial Clock Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        event={activeModalEvent}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
      />
    </div>
  );
}

export default ScheduleTab;
