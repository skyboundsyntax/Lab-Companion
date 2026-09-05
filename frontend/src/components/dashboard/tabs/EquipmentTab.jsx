import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

export function EquipmentTab({ labs = [], allLabs = [], studentRecords = [], user, isTeacher, isAdmin }) {
  const isStudent = user?.role === 'student' || (!isTeacher && !isAdmin);
  const displayLabs = (allLabs && allLabs.length > 0) ? allLabs : labs;

  const [equipmentAssignments, setEquipmentAssignments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Teacher checkout state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('Digital Storage Oscilloscope');
  const [quantity, setQuantity] = useState(1);
  const [assignMessage, setAssignMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Student booking state
  const [bookLabId, setBookLabId] = useState(displayLabs[0]?.id || 'LAB-301');
  const [bookEquipment, setBookEquipment] = useState('');
  const [bookQty, setBookQty] = useState(1);
  const [bookDate, setBookDate] = useState('2026-09-08');
  const [bookSlot, setBookSlot] = useState('09:00 - 11:30 AM');
  const [bookPurpose, setBookPurpose] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const departments = ['ALL', 'CSE', 'AIML', 'DS', 'IT', 'ECE', 'EEE', 'ME', 'CIVIL', 'ECM', 'RA'];

  useEffect(() => {
    // Fetch live hardware assignments from Django backend
    api.equipment.getAssignments()
      .then((data) => setEquipmentAssignments(data))
      .catch((err) => console.error("Error loading equipment checkouts:", err));
  }, []);

  useEffect(() => {
    if (studentRecords.length > 0 && !selectedStudent) {
      setSelectedStudent(studentRecords[0].id);
    }
  }, [studentRecords, selectedStudent]);

  // Update default bookLabId when displayLabs changes
  useEffect(() => {
    if (displayLabs.length > 0 && !bookLabId) {
      setBookLabId(displayLabs[0].id);
    }
  }, [displayLabs, bookLabId]);

  // Dynamic available equipment for student booking based on chosen lab
  const currentSelectedLab = displayLabs.find(l => l.id === bookLabId) || displayLabs[0];
  const availableEquipmentsForBooking = currentSelectedLab?.equipmentStatus || [];

  useEffect(() => {
    if (availableEquipmentsForBooking.length > 0) {
      setBookEquipment(availableEquipmentsForBooking[0].name);
    } else {
      setBookEquipment('Standard Bench Multimeter & Probes');
    }
  }, [bookLabId, displayLabs]);

  const handleAssign = async (e) => {
    e.preventDefault();
    const student = studentRecords.find((s) => s.id === selectedStudent);
    if (!student) return;

    try {
      setSubmitting(true);
      const newAssignment = await api.equipment.createAssignment({
        studentId: student.id,
        studentName: student.name,
        labId: student.labId,
        equipment: selectedEquipment,
        quantity: Number(quantity) || 1,
        assignedOn: "Just now",
      });

      setEquipmentAssignments([newAssignment, ...equipmentAssignments]);
      setAssignMessage(`Assigned ${quantity}x ${selectedEquipment} to ${student.name}. Saved to server.`);
      setTimeout(() => setAssignMessage(""), 3500);
    } catch (err) {
      setAssignMessage(`Failed to assign equipment: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentBookEquipment = async (e) => {
    e.preventDefault();
    if (!bookEquipment) return;

    try {
      setBookingLoading(true);
      setBookingMessage('');
      const studentName = user?.name || user?.full_name || 'Enrolled Student';
      const studentId = user?.userId || user?.user_id || '2023CSE0101';

      const newAssignment = await api.equipment.createAssignment({
        studentId: studentId,
        studentName: studentName,
        labId: bookLabId,
        equipment: `${bookEquipment} [${bookDate} ${bookSlot}]`,
        quantity: Number(bookQty) || 1,
        assignedOn: `Reserved for ${bookDate} (${bookSlot})`,
      });

      setEquipmentAssignments([newAssignment, ...equipmentAssignments]);
      setBookingMessage(`✓ Hardware Reservation Confirmed: ${bookQty}x ${bookEquipment} reserved for ${studentName} on ${bookDate}.`);
      setBookPurpose('');
      setTimeout(() => setBookingMessage(''), 4500);
    } catch (err) {
      setBookingMessage(`Booking failed: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  // Filter labs by selected department
  const filteredLabs = displayLabs.filter((lab) => {
    if (selectedDept === 'ALL') return true;
    const branch = (lab.branch || '').toUpperCase();
    if (branch === 'COMMON') return true;
    return branch === selectedDept;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* 1. Hardware Matrix Header & Department Filter Bar */}
      <div className="panel">
        <div className="panel-title-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>Laboratory Workstation & Hardware Matrix</h2>
              <span className="brand-pill" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)' }}>
                {filteredLabs.length} of {displayLabs.length} Facilities
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Real-time instrumentation, test rigs, and live sensor diagnostics across all 25 B.Tech departmental laboratories
            </p>
          </div>
          <span className="gold-badge">Live Hardware Diagnostics</span>
        </div>

        {/* Department Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              style={{
                background: selectedDept === dept ? 'var(--primary)' : 'var(--bg-surface-raised)',
                color: selectedDept === dept ? '#0f172a' : 'var(--text-secondary)',
                border: selectedDept === dept ? 'none' : '1px solid var(--border-subtle)',
                fontWeight: selectedDept === dept ? '700' : '500',
                padding: '6px 14px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {dept === 'ALL' ? 'All (25 Labs)' : dept}
            </button>
          ))}
        </div>

        {/* Equipment Lab Grid */}
        <div className="equipment-lab-grid">
          {filteredLabs.map((lab) => (
            <article key={lab.id} className="equipment-lab-card">
              <div className="equipment-lab-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="brand-pill">{lab.id}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sem {lab.semester} · {lab.branch}</span>
                  </div>
                  <h3 style={{ marginTop: '4px' }}>{lab.name}</h3>
                </div>
                <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{lab.room}</span>
              </div>

              <div className="equipment-status-list">
                {lab.equipmentStatus && lab.equipmentStatus.length > 0 ? (
                  lab.equipmentStatus.map((item, idx) => {
                    const isGood = item.status === "Working" || item.status === "Stable" || item.status === "Updated" || item.status === "Available";
                    const isWarn = item.status === "Moderate" || item.status === "Limited";
                    const statusClass = isGood ? "status-good" : isWarn ? "status-warning" : "status-danger";

                    return (
                      <div key={idx} className="equipment-status-row">
                        <div>
                          <strong>{item.name}</strong>
                          <p style={{ fontSize: '11px', margin: '2px 0 0', color: 'var(--text-muted)' }}>{item.note}</p>
                        </div>
                        <div className="equipment-status-meta">
                          <span className={`equipment-status-pill ${statusClass}`}>{item.status}</span>
                          <small className="font-mono">{item.count || item.count_info || 'Available'}</small>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Hardware telemetry calibrating for this facility.
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* 2. Student Equipment Booking Form */}
      {isStudent && (
        <div className="admin-equipment-grid">
          <div className="panel" style={{ border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div className="panel-title-row">
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: '700' }}>Book Equipment / Reserve Hardware Unit</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Reserve laboratory instruments, FPGA boards, microcontrollers, and measurement benches for your upcoming practical slot
                </p>
              </div>
              <span className="brand-pill" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                Student Self-Service
              </span>
            </div>

            {bookingMessage && (
              <p className={`form-message ${bookingMessage.startsWith('Booking failed') ? 'error' : 'success'}`} style={{ marginBottom: '14px' }}>
                {bookingMessage}
              </p>
            )}

            <form onSubmit={handleStudentBookEquipment} className="management-form">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <label>
                  Select Laboratory Facility
                  <select value={bookLabId} onChange={(e) => setBookLabId(e.target.value)}>
                    {displayLabs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.id} — {l.name} ({l.room})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Select Instrument / Hardware Rig
                  <select value={bookEquipment} onChange={(e) => setBookEquipment(e.target.value)}>
                    {availableEquipmentsForBooking.map((eq, i) => (
                      <option key={i} value={eq.name}>
                        {eq.name} ({eq.status} - {eq.count || 'Units Available'})
                      </option>
                    ))}
                    {availableEquipmentsForBooking.length === 0 && (
                      <option value="General Workbench Unit">General Workbench Unit</option>
                    )}
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <label>
                  Units Needed
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={bookQty}
                    onChange={(e) => setBookQty(e.target.value)}
                  />
                </label>

                <label>
                  Reservation Date
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                  />
                </label>

                <label>
                  Practical Time Slot
                  <select value={bookSlot} onChange={(e) => setBookSlot(e.target.value)}>
                    <option value="09:00 - 11:30 AM">Morning (09:00 - 11:30 AM)</option>
                    <option value="11:45 - 01:15 PM">Midday (11:45 - 01:15 PM)</option>
                    <option value="02:00 - 04:30 PM">Afternoon (02:00 - 04:30 PM)</option>
                  </select>
                </label>
              </div>

              <label>
                Experiment Purpose / Topic Note
                <input
                  type="text"
                  placeholder="e.g. Experiment #4 Signal Filtering Analysis"
                  value={bookPurpose}
                  onChange={(e) => setBookPurpose(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="primary-dashboard-button"
                disabled={bookingLoading}
                style={{ marginTop: '8px' }}
              >
                {bookingLoading ? "Reserving..." : "Confirm & Book Equipment"}
              </button>
            </form>
          </div>

          {/* Student's Active Equipment Bookings */}
          <div className="panel">
            <div className="panel-title-row">
              <h2>My Equipment Reservations & Checkouts</h2>
              <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {equipmentAssignments.length} Records
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Lab</th>
                    <th>Qty</th>
                    <th>Status / Time</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentAssignments.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.equipment}</strong></td>
                      <td><span className="brand-pill">{a.labId || 'LAB'}</span></td>
                      <td className="font-mono">{a.quantity}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.assignedOn}</td>
                    </tr>
                  ))}
                  {equipmentAssignments.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                        No active equipment bookings. Use the form to reserve instruments.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Faculty / Admin Equipment Issue & Master Log */}
      {(isTeacher || isAdmin) && (
        <div className="admin-equipment-grid">
          <div className="panel">
            <div className="panel-title-row">
              <h2>Issue Equipment / Checkout</h2>
            </div>
            {assignMessage && (
              <p className={`form-message ${assignMessage.startsWith('Failed') ? 'error' : 'success'}`} style={{ marginBottom: '12px' }}>
                {assignMessage}
              </p>
            )}
            <form onSubmit={handleAssign} className="management-form">
              <label>
                Select Recipient Student
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                  {studentRecords.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id} - {s.labId})</option>
                  ))}
                </select>
              </label>

              <label>
                Instrument / Equipment Unit
                <select value={selectedEquipment} onChange={(e) => setSelectedEquipment(e.target.value)}>
                  <option value="Digital Storage Oscilloscope">Digital Storage Oscilloscope (100MHz)</option>
                  <option value="Logic Analyzer">USB Logic Analyzer (16 Channel)</option>
                  <option value="FPGA Development Board">FPGA Cyclone IV Dev Board</option>
                  <option value="ARM Cortex Debug Probe">ARM Cortex-M Debug Probe (J-Link)</option>
                  <option value="High-Precision Multimeter">6.5 Digit Bench Multimeter</option>
                  <option value="Spectrophotometer Cuvettes">Quartz Cuvette Set (UV-Vis)</option>
                </select>
              </label>

              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>

              <button type="submit" className="primary-dashboard-button" disabled={submitting}>
                {submitting ? "Issuing..." : "Authorize & Checkout Equipment"}
              </button>
            </form>
          </div>

          <div className="panel">
            <div className="panel-title-row">
              <h2>Active Hardware Checkouts & Student Reservations</h2>
              <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {equipmentAssignments.length} Items
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Instrument</th>
                    <th>Qty</th>
                    <th>Timestamp / Slot</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentAssignments.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.studentName}</strong> <small className="font-mono" style={{ color: 'var(--text-muted)' }}>({a.studentId})</small></td>
                      <td>{a.equipment}</td>
                      <td className="font-mono">{a.quantity}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.assignedOn}</td>
                    </tr>
                  ))}
                  {equipmentAssignments.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                        No active checkouts recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentTab;
