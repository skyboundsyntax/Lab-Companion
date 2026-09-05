import React from 'react';

export function HomeTab({ labs, dueItems, teacherBatches, isTeacher, isAdmin, onNavigate }) {
  return (
    <div className="page-grid">
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {(isTeacher || isAdmin) && (
          <div className="admin-stat-grid">
            <div className="stat-card">
              <span className="font-mono">SUPERVISED LABS</span>
              <strong>{labs.length}</strong>
              <p>Active lab facilities operational</p>
            </div>
            <div className="stat-card">
              <span className="font-mono">COHORT BATCHES</span>
              <strong>{teacherBatches.length}</strong>
              <p>Scheduled student cohorts</p>
            </div>
            <div className="stat-card">
              <span className="font-mono">HARDWARE HEALTH</span>
              <strong style={{ color: 'var(--status-ready)' }}>100%</strong>
              <p>All workbench sensors online</p>
            </div>
          </div>
        )}

        <div className="panel">
          <div className="panel-title-row">
            <div>
              <h2>Active Lab Schedule</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Assigned weekly laboratory sessions and workstation allocations
              </p>
            </div>
            <button className="small-silver-button" onClick={() => onNavigate('notebook')}>
              View Roster &rarr;
            </button>
          </div>

          <div className="lab-card-grid">
            {labs.map((lab) => (
              <article key={lab.id} className="lab-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="brand-pill">{lab.id}</span>
                  <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {lab.credits} Credits
                  </span>
                </div>
                <h3>{lab.name}</h3>
                <p><strong>Time:</strong> {lab.day}, {lab.time}</p>
                <p><strong>Location:</strong> {lab.room}</p>
                <p><strong>Lead:</strong> {lab.teacher}</p>
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lab.update}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {isTeacher && (
          <div className="panel">
            <div className="panel-title-row">
              <h2>Supervised Teaching Batches</h2>
              <span className="gold-badge">{teacherBatches.length} Cohorts Active</span>
            </div>
            <div className="due-list">
              {teacherBatches.map((batch) => (
                <div key={batch.id} className="due-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="font-mono">{batch.id} • {batch.labId}</span>
                      <h3>{batch.name} ({batch.labName})</h3>
                      <p>{batch.day} @ {batch.time} in {batch.room}</p>
                      <p><strong>Current Module:</strong> {batch.topic}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="attendance-pill">{batch.attendance} Attendance</span>
                      <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>{batch.students} Students</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="due-panel">
        <div className="panel-title-row">
          <h2>Upcoming Deliverables</h2>
          <span className="font-mono" style={{ fontSize: '12px', color: 'var(--primary)' }}>
            {dueItems.length} Tasks
          </span>
        </div>

        <div className="due-list">
          {dueItems.map((item) => (
            <article key={item.id} className="due-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="brand-pill">{item.category}</span>
                <strong style={{ fontSize: '11px', color: 'var(--status-busy)' }}>{item.due}</strong>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.labId}</span>
                <span className="status-good equipment-status-pill">{item.status}</span>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default HomeTab;
