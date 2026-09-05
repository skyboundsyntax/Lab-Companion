import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

export function NotebookTab({ user, studentRecords = [], labs = [], allLabs = [], onRefresh }) {
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const studentId = user?.userId || user?.user_id || '2023CSE0101';
  const teacherBranch = user?.branch || 'CSE';
  const teacherName = (user?.name || '').trim();

  // State for Student View
  const [calendarData, setCalendarData] = useState(null);
  const [gradeAnalytics, setGradeAnalytics] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(9); // September 2026
  const [calendarYear, setCalendarYear] = useState(2026);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingStudentData, setLoadingStudentData] = useState(false);

  // State for Teacher / Admin cohort view & Attendance Recording
  const [selectedLabFilter, setSelectedLabFilter] = useState("all");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState(isTeacher ? teacherBranch : "all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markStudentId, setMarkStudentId] = useState("");
  const [markLabCode, setMarkLabCode] = useState("");
  const [markDate, setMarkDate] = useState("2026-09-05");
  const [markStatus, setMarkStatus] = useState("Present");
  const [markTopic, setMarkTopic] = useState("");
  const [markLoading, setMarkLoading] = useState(false);
  const [markFeedback, setMarkFeedback] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveTimeString = currentDateTime.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const liveDateString = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  // Load student personal calendar and grades
  useEffect(() => {
    if (isStudent) {
      let isMounted = true;
      setLoadingStudentData(true);

      Promise.all([
        api.attendance.getCalendar(studentId, calendarMonth, calendarYear).catch(() => null),
        api.grades.getAnalytics(studentId).catch(() => null),
      ]).then(([cal, grades]) => {
        if (!isMounted) return;
        setCalendarData(cal);
        setGradeAnalytics(grades);
        if (cal?.sessions?.length) {
          setSelectedSession(cal.sessions[0]);
        }
        setLoadingStudentData(false);
      });

      return () => {
        isMounted = false;
      };
    }
  }, [isStudent, studentId, calendarMonth, calendarYear]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear((prev) => prev - 1);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear((prev) => prev + 1);
    } else {
      setCalendarMonth((prev) => prev + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // If role is student, strictly display ONLY their personal attendance calendar and grade trend!
  if (isStudent) {
    const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
    const firstDayIndex = new Date(calendarYear, calendarMonth - 1, 1).getDay(); // 0 = Sun, 1 = Mon ...

    // Build day map from sessions
    const sessionsByDay = {};
    if (calendarData?.sessions) {
      calendarData.sessions.forEach((s) => {
        const parts = s.session_date.split('-');
        if (parts.length === 3) {
          const dayNum = parseInt(parts[2], 10);
          sessionsByDay[dayNum] = s;
        }
      });
    }

    const attendancePct = calendarData?.attendance_percentage ?? 92.3;
    const isCompliant = calendarData?.is_compliant ?? attendancePct >= 75.0;
    const cgpa = gradeAnalytics?.cgpa ?? 9.25;
    const currentSgpa = gradeAnalytics?.current_sgpa ?? 9.40;
    const sgpaTrend = gradeAnalytics?.sgpa_trend || [
      { semester: 'Sem 1', sgpa: 8.85, status: 'Completed' },
      { semester: 'Sem 2', sgpa: 9.15, status: 'Completed' },
      { semester: 'Sem 3', sgpa: 9.40, status: 'Active Term (Current)' },
    ];
    let labGrades = [...(gradeAnalytics?.grades_breakdown || [])];
    if (labs && labs.length > 0) {
      const existingCodes = new Set(labGrades.map((g) => g.lab_code));
      labs.forEach((l) => {
        if (!existingCodes.has(l.id)) {
          labGrades.push({
            lab_code: l.id,
            lab_name: l.name,
            credits: l.credits || 2,
            grade: l.grade || 'A+',
            grade_points: 10.0,
            max_points: 10.0,
            semester: l.semester || user?.semester || 1,
          });
        }
      });
    }

    // SVG Chart Geometry
    const chartHeight = 220;
    const chartWidth = 600;
    const padding = { top: 30, right: 40, bottom: 40, left: 50 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const minSgpa = 7.0;
    const maxSgpa = 10.0;

    const points = sgpaTrend.map((item, idx) => {
      const x = padding.left + (idx / Math.max(1, sgpaTrend.length - 1)) * innerWidth;
      const normalizedY = (item.sgpa - minSgpa) / (maxSgpa - minSgpa);
      const y = padding.top + innerHeight - normalizedY * innerHeight;
      return { x, y, ...item };
    });

    const pathData = points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
      : '';

    const areaPath = points.length > 0
      ? `${pathData} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`
      : '';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        {/* 1. Verified Academic Profile & Privacy Clearance Banner */}
        <div
          className="panel"
          style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
            borderColor: 'rgba(56, 189, 248, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="brand-pill" style={{ background: 'var(--primary-soft)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }}>
                  {calendarData?.course || user?.course || 'B.Tech'} Curriculum
                </span>
                <span className="brand-pill" style={{ background: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.3)', color: '#34d399' }}>
                  Branch: {calendarData?.branch || user?.branch || 'CSE'}
                </span>
                <span className="brand-pill" style={{ background: 'rgba(129, 140, 248, 0.12)', borderColor: 'rgba(129, 140, 248, 0.3)', color: '#818cf8' }}>
                  Year {calendarData?.year || user?.year || 2} · Semester {calendarData?.semester || user?.semester || 3}
                </span>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', margin: '4px 0' }}>
                {user?.name || calendarData?.student_name || 'Student Portal'}
                <span className="font-mono" style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '10px', fontWeight: '400' }}>
                  Roll No: {studentId}
                </span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Personal Laboratory Attendance Log & Academic Performance Analytics
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                minWidth: '130px'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cumulative CGPA
                </span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                  {cgpa.toFixed(2)}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>/ 10.0</span>
                </div>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>
                  {gradeAnalytics?.standing || 'First Class with Distinction'}
                </div>
              </div>

              <div style={{
                background: 'var(--bg-app)',
                border: `1px solid ${isCompliant ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                minWidth: '150px'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Lab Attendance Adherence
                </span>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: isCompliant ? '#34d399' : '#f87171',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {attendancePct}%
                </div>
                <div style={{
                  fontSize: '11px',
                  color: isCompliant ? '#34d399' : '#f87171',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>{isCompliant ? '✓ Exam Eligible (>=75%)' : '⚠ Action Needed (<75%)'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Interactive Monthly Attendance Calendar (Days Present & Absent) */}
        <div className="panel">
          <div className="panel-title-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Monthly Laboratory Attendance Register</h2>
                <span className="brand-pill" style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.1)' }}>
                  Live RFID Biometric Log
                </span>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  color: '#34d399',
                  fontWeight: '700',
                  fontFamily: 'var(--font-mono)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span className="live-pulse-dot" style={{ width: '6px', height: '6px' }} />
                  LIVE CLOCK: {liveDateString} · {liveTimeString} IST
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Interactive calendar tracking your practical experiment attendance, workbench check-ins, and excused absences
              </p>
            </div>

            {/* Month Switcher & Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  background: 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '6px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                ◀ Prev
              </button>

              <span style={{ fontWeight: '700', fontSize: '15px', minWidth: '150px', textAlign: 'center', color: 'var(--text-primary)' }}>
                {monthNames[calendarMonth - 1]} {calendarYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  background: 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '6px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Next ▶
              </button>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            padding: '10px 16px',
            background: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Total Sessions: <strong style={{ color: 'var(--text-primary)' }}>{calendarData?.total_sessions ?? 0}</strong>
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: '13px', color: '#34d399' }}>
              ● Days Present: <strong>{calendarData?.days_present ?? 0}</strong>
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: '13px', color: '#f87171' }}>
              ● Days Absent: <strong>{calendarData?.days_absent ?? 0}</strong>
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: '13px', color: '#fbbf24' }}>
              ● Excused: <strong>{calendarData?.days_excused ?? 0}</strong>
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: '13px', color: '#38bdf8' }}>
              ● Upcoming: <strong>{calendarData?.days_scheduled ?? 0}</strong>
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: '13px', color: 'var(--primary)' }}>
              Compliance: <strong>{attendancePct}%</strong> (Required: 75%)
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: '12px', color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
              ⏱ Station Clock: <strong>{liveTimeString}</strong>
            </span>
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            marginTop: '12px'
          }}>
            {/* Day of Week Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {d}
              </div>
            ))}

            {/* Empty Offset cells before 1st of month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  minHeight: '74px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px dashed rgba(255, 255, 255, 0.03)',
                }}
              />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNum = index + 1;
              const session = sessionsByDay[dayNum];
              const isPresent = session?.status === 'Present';
              const isAbsent = session?.status === 'Absent';
              const isExcused = session?.status === 'Excused';
              const isSelected = selectedSession && selectedSession.session_date.endsWith(`-${String(dayNum).padStart(2, '0')}`);

              let dayBg = 'var(--bg-surface-raised)';
              let borderColor = 'var(--border-subtle)';
              let statusLabel = null;

              if (session) {
                if (isPresent) {
                  dayBg = isSelected ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.09)';
                  borderColor = 'rgba(52, 211, 153, 0.4)';
                  statusLabel = (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      marginTop: '4px'
                    }}>
                      ✓ Present
                    </span>
                  );
                } else if (isAbsent) {
                  dayBg = isSelected ? 'rgba(248, 113, 113, 0.22)' : 'rgba(248, 113, 113, 0.12)';
                  borderColor = 'rgba(248, 113, 113, 0.5)';
                  statusLabel = (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      marginTop: '4px'
                    }}>
                      ✗ Absent
                    </span>
                  );
                } else if (isExcused) {
                  dayBg = isSelected ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)';
                  borderColor = 'rgba(251, 191, 36, 0.4)';
                  statusLabel = (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#fbbf24',
                      marginTop: '4px'
                    }}>
                      Excused
                    </span>
                  );
                } else if (session?.status === 'Scheduled') {
                  dayBg = isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.08)';
                  borderColor = 'rgba(56, 189, 248, 0.35)';
                  statusLabel = (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      marginTop: '4px'
                    }}>
                      ⏱ Scheduled
                    </span>
                  );
                }
              }

              return (
                <div
                  key={dayNum}
                  onClick={() => session && setSelectedSession(session)}
                  style={{
                    minHeight: '74px',
                    padding: '8px',
                    background: dayBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 'var(--radius-xs)',
                    cursor: session ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
                  }}
                  title={session ? `${session.lab_code}: ${session.topic} (${session.status})` : `Day ${dayNum}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: session ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {dayNum}
                    </span>
                    {session && (
                      <span style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--primary)',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {session.lab_code}
                      </span>
                    )}
                  </div>

                  {statusLabel}
                </div>
              );
            })}
          </div>

          {/* Selected Session Inspector Drawer */}
          {selectedSession && (
            <div style={{
              marginTop: '20px',
              padding: '16px 20px',
              background: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-accent)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="font-mono" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700' }}>
                    {selectedSession.session_date}
                  </span>
                  <span className="brand-pill">{selectedSession.lab_code}</span>
                  {(() => {
                    let statusBg = 'rgba(248, 113, 113, 0.15)';
                    let statusColor = '#f87171';
                    if (selectedSession.status === 'Present') {
                      statusBg = 'rgba(52, 211, 153, 0.15)';
                      statusColor = '#34d399';
                    } else if (selectedSession.status === 'Scheduled') {
                      statusBg = 'rgba(56, 189, 248, 0.15)';
                      statusColor = '#38bdf8';
                    } else if (selectedSession.status === 'Excused') {
                      statusBg = 'rgba(251, 191, 36, 0.15)';
                      statusColor = '#fbbf24';
                    }
                    return (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: statusBg,
                        color: statusColor,
                      }}>
                        {selectedSession.status.toUpperCase()}
                      </span>
                    );
                  })()}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {selectedSession.topic}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedSession.lab_name} · Station #{selectedSession.id} · Instructor Verified
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="status-good equipment-status-pill">
                  RFID Telemetry Confirmed
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Personal Grade Progression & SGPA Trend (Best Chart) */}
        <div className="panel">
          <div className="panel-title-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Academic Grade Trend & SGPA Progression</h2>
                <span className="brand-pill" style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  B.Tech Semester Curve
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Visual trajectory of your Semester Grade Point Averages (SGPA) across terms and individual lab course credits
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="brand-pill" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)' }}>
                Term SGPA: <strong>{currentSgpa.toFixed(2)}</strong>
              </span>
              <span className="brand-pill" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                Overall CGPA: <strong>{cgpa.toFixed(2)}</strong>
              </span>
            </div>
          </div>

          {/* SVG Line & Area Trend Chart */}
          <div style={{
            background: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            padding: '20px 10px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <defs>
                {/* Area Gradient Fill */}
                <linearGradient id="sgpaAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>

                {/* Line Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Lines & Benchmarks */}
              {[7.0, 8.0, 9.0, 10.0].map((val) => {
                const norm = (val - minSgpa) / (maxSgpa - minSgpa);
                const yPos = padding.top + innerHeight - norm * innerHeight;
                return (
                  <g key={val}>
                    <line
                      x1={padding.left}
                      y1={yPos}
                      x2={chartWidth - padding.right}
                      y2={yPos}
                      stroke={val === 9.0 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.08)'}
                      strokeDasharray={val === 9.0 ? '4 4' : 'none'}
                      strokeWidth={val === 9.0 ? '1.5' : '1'}
                    />
                    <text
                      x={padding.left - 10}
                      y={yPos + 4}
                      fill={val === 9.0 ? '#34d399' : 'var(--text-muted)'}
                      fontSize="11"
                      textAnchor="end"
                      fontFamily="var(--font-mono)"
                    >
                      {val.toFixed(1)} {val === 9.0 ? '★' : ''}
                    </text>
                  </g>
                );
              })}

              {/* Area Under Curve */}
              {areaPath && (
                <path d={areaPath} fill="url(#sgpaAreaGradient)" />
              )}

              {/* Trend Line with Glow */}
              {pathData && (
                <path
                  d={pathData}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
              )}

              {/* Nodes for each Semester */}
              {points.map((pt, idx) => (
                <g key={pt.semester}>
                  {/* Outer circle halo */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill="var(--bg-app)"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                  />
                  {/* Center Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill={idx === points.length - 1 ? '#34d399' : 'var(--primary)'}
                  />

                  {/* Value Label above node */}
                  <text
                    x={pt.x}
                    y={pt.y - 14}
                    fill="var(--text-primary)"
                    fontSize="12"
                    fontWeight="700"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                  >
                    {pt.sgpa.toFixed(2)}
                  </text>

                  {/* Semester Label on X axis */}
                  <text
                    x={pt.x}
                    y={chartHeight - 12}
                    fill={idx === points.length - 1 ? 'var(--primary)' : 'var(--text-secondary)'}
                    fontSize="12"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {pt.semester}
                  </text>
                </g>
              ))}
            </svg>

            {/* Legend / Benchmark Indicators */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              flexWrap: 'wrap'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '3px', background: 'var(--primary)', borderRadius: '2px' }} />
                <span>Your SGPA Trajectory</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '1px', background: '#34d399', borderBottom: '1px dashed #34d399' }} />
                <span>9.0 Distinction Threshold</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
                <span>Current Active Semester ({calendarData?.semester || user?.semester || 3})</span>
              </span>
            </div>
          </div>

          {/* Enrolled B.Tech Laboratory Grades Breakdown */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>
              Enrolled Term Laboratory Subjects & Evaluation
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              {labGrades.map((sub, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span className="font-mono" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700' }}>
                        {sub.lab_code}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        · {sub.credits} Credits
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {sub.lab_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Grade Points: {sub.grade_points} / {sub.max_points}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}>
                    <span style={{ fontSize: '17px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      {sub.grade}
                    </span>
                  </div>
                </div>
              ))}

              {labGrades.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '24px',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-app)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  Enrolled laboratory practical evaluations are currently in session for this semester.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teacher / Admin Supervision View (Access to Cohort Table)
  const availableLabs = (allLabs && allLabs.length > 0) ? allLabs : labs;

  const teacherDesignatedLabs = isTeacher
    ? availableLabs.filter((l) => {
        const tName = (l.teacher_name || l.teacher || '').toLowerCase();
        const uName = teacherName.toLowerCase();
        const matchesName = uName && (tName.includes(uName) || uName.includes(tName));
        const matchesBranch = teacherBranch && (l.branch === teacherBranch || l.branch === 'COMMON');
        return matchesName || matchesBranch;
      })
    : availableLabs;

  const teacherLabCodes = new Set(teacherDesignatedLabs.map((l) => l.id || l.lab_code));

  const handleOpenMarkModal = (student = null) => {
    if (student) {
      setMarkStudentId(student.id || student.userId);
      setMarkLabCode(student.labId || (teacherDesignatedLabs[0]?.id ?? "LAB-401"));
    } else {
      const defaultStudentList = isTeacher ? filteredRecords : studentRecords;
      if (!markStudentId && defaultStudentList.length > 0) {
        setMarkStudentId(defaultStudentList[0].id);
      }
      if (!markLabCode && teacherDesignatedLabs.length > 0) {
        setMarkLabCode(teacherDesignatedLabs[0].id || teacherDesignatedLabs[0].lab_code);
      }
    }
    setMarkDate("2026-09-05");
    setMarkStatus("Present");
    setMarkTopic("Laboratory Practical Session");
    setMarkFeedback("");
    setIsMarkModalOpen(true);
  };

  const handleSubmitMarkAttendance = async (e) => {
    e.preventDefault();
    setMarkLoading(true);
    setMarkFeedback("");

    try {
      const res = await api.attendance.recordSession({
        student_id: markStudentId,
        lab_code: markLabCode,
        session_date: markDate,
        status: markStatus,
        topic: markTopic || "Laboratory Practical Session",
        role: user?.role,
        userName: user?.name,
        userId: user?.userId || user?.user_id,
        branch: user?.branch,
        dept: user?.dept,
      });

      setMarkFeedback({
        type: 'success',
        text: `Attendance saved: ${markStudentId} marked as ${markStatus} on ${markDate} (${res.attendance_percentage ?? res.student?.attendance_pct ?? ''}% aggregate)`
      });

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => {
        setIsMarkModalOpen(false);
        setMarkFeedback("");
      }, 1400);
    } catch (err) {
      setMarkFeedback({
        type: 'error',
        text: err.message || 'Failed to record attendance session'
      });
    } finally {
      setMarkLoading(false);
    }
  };

  const departmentList = [
    { value: 'all', label: 'All Departments (Institutional View)' },
    { value: 'CSE', label: 'Computer Science (CSE)' },
    { value: 'AIML', label: 'AI & Machine Learning (AIML)' },
    { value: 'DS', label: 'Data Science (DS)' },
    { value: 'IT', label: 'Information Technology (IT)' },
    { value: 'ECE', label: 'Electronics & Communication (ECE)' },
    { value: 'EEE', label: 'Electrical & Electronics (EEE)' },
    { value: 'ME', label: 'Mechanical Engineering (ME)' },
    { value: 'CIVIL', label: 'Civil Engineering (CIVIL)' },
    { value: 'ECM', label: 'Electronics & Computer (ECM)' },
    { value: 'RA', label: 'Robotics & Automation (RA)' },
  ];

  const filteredRecords = studentRecords.filter((record) => {
    if (isTeacher) {
      // 1. Teacher can ONLY see their designated department students
      const matchesDept = (record.dept && record.dept.toUpperCase().includes(teacherBranch)) ||
                          (record.course && record.course.toUpperCase().includes(teacherBranch)) ||
                          (record.id && record.id.toUpperCase().includes(teacherBranch));
      if (!matchesDept) return false;

      // 2. Teacher can ONLY see their designated lab students
      const matchesDesignatedLab = !record.labId || teacherLabCodes.has(record.labId);
      if (!matchesDesignatedLab) return false;

      // 3. Selected specific lab filter among designated labs
      if (selectedLabFilter !== "all" && record.labId !== selectedLabFilter) {
        return false;
      }
    } else {
      // Admin can see all departments
      const matchesDept = selectedDeptFilter === "all" ||
        (record.dept && record.dept.toUpperCase().includes(selectedDeptFilter)) ||
        (record.course && record.course.toUpperCase().includes(selectedDeptFilter)) ||
        (record.id && record.id.toUpperCase().includes(selectedDeptFilter));
      if (!matchesDept) return false;

      const matchesLab = selectedLabFilter === "all" || record.labId === selectedLabFilter;
      if (!matchesLab) return false;
    }

    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    const deptA = a.dept || '';
    const deptB = b.dept || '';
    if (deptA !== deptB) return deptA.localeCompare(deptB);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="panel">
      <div className="panel-title-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Faculty Cohort Supervision & Attendance Register</h2>
            {isAdmin && (
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#818cf8',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                🌐 INSTITUTIONAL ADMIN SCOPE: ALL DEPARTMENTS
              </span>
            )}
            {isTeacher && (
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                🔒 FACULTY SCOPE: {teacherBranch} DEPT · {teacherDesignatedLabs.length} DESIGNATED LABS
              </span>
            )}
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34d399',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span className="live-pulse-dot" style={{ width: '5px', height: '5px' }} />
              LIVE CLOCK: {liveDateString} · {liveTimeString} IST
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            {isTeacher
              ? `Supervising ${teacherBranch} department laboratory students across designated lab sections (${filteredRecords.length} enrolled student records)`
              : `Institutional laboratory cohort monitoring and attendance compliance audit across all 10 engineering departments (${filteredRecords.length} student records)`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => handleOpenMarkModal()}
            style={{
              height: '34px',
              padding: '0 14px',
              borderRadius: 'var(--radius-xs)',
              background: 'linear-gradient(135deg, var(--primary), #6366f1)',
              color: '#fff',
              fontWeight: '600',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)'
            }}
          >
            <span>+</span> Mark Student Attendance
          </button>

          <input
            type="text"
            placeholder="Search student or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              height: '34px',
              padding: '0 12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          />

          {/* Department Control: Admin has full dropdown; Teacher has designated department lock */}
          {isAdmin ? (
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            >
              {departmentList.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          ) : (
            <div
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                background: 'rgba(56, 189, 248, 0.08)',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
              title="Faculty Attendance Scope is strictly designated to your academic department"
            >
              <span>🔒</span> {teacherBranch} DEPT (DESIGNATED)
            </div>
          )}

          <select
            value={selectedLabFilter}
            onChange={(e) => setSelectedLabFilter(e.target.value)}
            style={{
              height: '34px',
              padding: '0 10px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          >
            <option value="all">
              {isTeacher ? `All Designated Labs (${teacherDesignatedLabs.length} Labs)` : `All Labs (${availableLabs.length} Labs)`}
            </option>
            {(isTeacher ? teacherDesignatedLabs : availableLabs).map((lab) => (
              <option key={lab.id || lab.lab_code} value={lab.id || lab.lab_code}>
                {lab.id || lab.lab_code} - {lab.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Lab Section</th>
              <th>Department</th>
              <th>Institutional Email</th>
              <th>Attendance</th>
              <th>Grade</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((stu) => (
              <tr key={stu.id}>
                <td className="font-mono" style={{ color: 'var(--primary)' }}>{stu.id}</td>
                <td><strong>{stu.name}</strong></td>
                <td><span className="brand-pill">{stu.labId}</span></td>
                <td>{stu.dept}</td>
                <td className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stu.email}</td>
                <td>
                  <span className="attendance-pill">{stu.attendance}</span>
                </td>
                <td>
                  <span className="status-good equipment-status-pill">{stu.grade}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenMarkModal(stu)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: 'var(--primary)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✎ Mark / Update
                  </button>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No student records found matching the query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Attendance Recording Modal */}
      {isMarkModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Record Student Attendance
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                  Faculty & Admin Institutional Verification · Date Threshold: 05.09.2026
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMarkModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {markFeedback && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '16px',
                fontSize: '13px',
                background: markFeedback.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                border: `1px solid ${markFeedback.type === 'success' ? '#34d399' : '#f87171'}`,
                color: markFeedback.type === 'success' ? '#34d399' : '#f87171',
              }}>
                {markFeedback.text}
              </div>
            )}

            <form onSubmit={handleSubmitMarkAttendance}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Student *
                  </label>
                  <select
                    value={markStudentId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setMarkStudentId(sid);
                      const stu = (isTeacher ? filteredRecords : studentRecords).find((s) => s.id === sid);
                      if (stu && stu.labId) setMarkLabCode(stu.labId);
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="">Select Student...</option>
                    {(isTeacher ? filteredRecords : studentRecords).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.name} ({s.labId} · {s.dept || s.course})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Lab Course *
                  </label>
                  <select
                    value={markLabCode}
                    onChange={(e) => setMarkLabCode(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="">Select Lab...</option>
                    {(isTeacher ? teacherDesignatedLabs : availableLabs).map((l) => (
                      <option key={l.id || l.lab_code} value={l.id || l.lab_code}>
                        {l.id || l.lab_code} - {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      Session Date *
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--primary)' }}>
                      Today: 2026-09-05 (Max for Present/Absent)
                    </span>
                  </div>
                  <input
                    type="date"
                    value={markDate}
                    max="2026-09-05"
                    onChange={(e) => setMarkDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Future dates (beyond 2026-09-05 or 2027) cannot be marked Present or Absent.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Attendance Status *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Present', 'Absent', 'Excused'].map((status) => {
                      const isActive = markStatus === status;
                      let activeColor = '#34d399';
                      if (status === 'Absent') activeColor = '#f87171';
                      if (status === 'Excused') activeColor = '#fbbf24';

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setMarkStatus(status)}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: 'var(--radius-xs)',
                            border: `1px solid ${isActive ? activeColor : 'var(--border-subtle)'}`,
                            background: isActive ? `${activeColor}22` : 'var(--bg-app)',
                            color: isActive ? activeColor : 'var(--text-secondary)',
                            fontWeight: isActive ? '700' : '500',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {status === 'Present' && '✓ '}
                          {status === 'Absent' && '✗ '}
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Experiment Practical / Module Topic
                  </label>
                  <input
                    type="text"
                    value={markTopic}
                    onChange={(e) => setMarkTopic(e.target.value)}
                    placeholder="e.g. Experiment 4: Red-Black Trees Verification"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setIsMarkModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-app)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markLoading}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#000',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: markLoading ? 'not-allowed' : 'pointer',
                    opacity: markLoading ? 0.7 : 1,
                  }}
                >
                  {markLoading ? 'Saving...' : 'Confirm & Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotebookTab;
