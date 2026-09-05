import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

export function SubmissionsTab({
  dueItems = [],
  labs = [],
  allLabs = [],
  user,
  userRole,
  userName,
  isTeacher,
  isAdmin,
  onSubmissionCreated,
}) {
  const isStudent = userRole === 'student' || (!isTeacher && !isAdmin);
  const studentName = userName || user?.name || user?.full_name || 'Enrolled Student';

  const [tasks, setTasks] = useState(dueItems);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [activeUploadTask, setActiveUploadTask] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [submissionFeedback, setSubmissionFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Teacher / Admin Assignment Creation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const availableLabs = (allLabs && allLabs.length > 0) ? allLabs : labs;
  const [createLabId, setCreateLabId] = useState(availableLabs[0]?.id || 'LAB-301');
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState('Assignment');
  const [createDue, setCreateDue] = useState('Sep 25, 2026');
  const [createDesc, setCreateDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    setTasks(dueItems);
  }, [dueItems]);

  useEffect(() => {
    // Load student submissions to show awarded grades & feedback
    api.submissions.getAll()
      .then((data) => setStudentSubmissions(data))
      .catch((err) => console.error("Error loading submissions in SubmissionsTab:", err));
  }, []);

  // Helper to check if task deadline has passed
  const isDeadlineExpired = (dueStr) => {
    if (!dueStr) return false;
    const systemNow = new Date('2026-09-05T00:00:00');
    const parsed = new Date(dueStr);
    if (!isNaN(parsed.getTime())) {
      return parsed < systemNow;
    }
    return false;
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!activeUploadTask || !selectedFileName) return;

    if (isDeadlineExpired(activeUploadTask.due)) {
      setSubmissionFeedback(`Error submitting report: Assignment deadline has expired (${activeUploadTask.due}). Submissions are closed.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.submissions.create({
        studentName: studentName,
        taskTitle: activeUploadTask.title,
        labId: activeUploadTask.labId,
        fileName: selectedFileName,
        submittedAt: 'Just now',
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeUploadTask.id
            ? { ...t, status: "Submitted", submittedFile: selectedFileName, submittedAt: "Just now" }
            : t
        )
      );

      // Refresh submissions
      const updatedSubs = await api.submissions.getAll();
      setStudentSubmissions(updatedSubs);

      setSubmissionFeedback(`✓ Report "${selectedFileName}" submitted to Django server for ${activeUploadTask.title}!`);
      setActiveUploadTask(null);
      setSelectedFileName("");
      if (onSubmissionCreated) onSubmissionCreated();
      setTimeout(() => setSubmissionFeedback(""), 4000);
    } catch (err) {
      setSubmissionFeedback(`Error submitting report: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    try {
      setCreateLoading(true);
      const payload = {
        title: createTitle.trim(),
        labId: createLabId,
        category: createCategory,
        due: createDue,
        description: createDesc.trim() || 'Laboratory experiment deliverable requirements and observation logs.',
        status: 'Pending',
      };

      const created = await api.deliverables.create(payload);
      setTasks((prev) => [created, ...prev]);
      setSubmissionFeedback(`✓ Assignment "${created.title}" successfully published for ${createLabId}!`);
      setIsCreateModalOpen(false);
      setCreateTitle('');
      setCreateDesc('');
      if (onSubmissionCreated) onSubmissionCreated();
      setTimeout(() => setSubmissionFeedback(''), 4000);
    } catch (err) {
      setSubmissionFeedback(`Error publishing deliverable: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {submissionFeedback && (
        <p className={`form-message ${submissionFeedback.startsWith('Error') ? 'error' : 'success'}`}>
          {submissionFeedback}
        </p>
      )}

      <div className="panel">
        <div className="panel-title-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>Experiment Deliverables & Post-Lab Reports</h2>
              <span className="brand-pill" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)' }}>
                Academic Year 2026-27
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {isStudent
                ? 'Submit your laboratory codes, observation datasets, and practical logs before deadlines.'
                : 'Manage student assignment deliverables, specify deadlines, and review student experiment submissions.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {(isTeacher || isAdmin) && (
              <button
                type="button"
                className="primary-dashboard-button"
                onClick={() => setIsCreateModalOpen(true)}
                style={{ height: '34px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>+</span> Publish New Assignment
              </button>
            )}
            <span className="gold-badge">{tasks.length} Assigned Deliverables</span>
          </div>
        </div>

        {/* Deliverables Grid */}
        <div className="submission-grid">
          {tasks.map((task) => {
            const expired = isDeadlineExpired(task.due);

            // Find matching submission for this task (if student)
            const matchedSub = studentSubmissions.find(
              (s) =>
                s.taskTitle === task.title ||
                (s.taskId && s.taskId === task.id) ||
                (s.studentName && s.studentName.toLowerCase().includes(studentName.toLowerCase()) && s.taskTitle === task.title)
            );

            const isGraded = matchedSub?.status === 'Verified / Graded' || task.status === 'Verified / Graded' || matchedSub?.grade;
            const awardedGrade = matchedSub?.grade;
            const feedbackRemarks = matchedSub?.feedback;

            return (
              <article key={task.id} className="submission-card" style={{
                border: isGraded ? '1px solid rgba(52, 211, 153, 0.4)' : (expired ? '1px solid rgba(248, 113, 113, 0.3)' : '1px solid var(--border-subtle)')
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="brand-pill">{task.category}</span>
                  {isGraded ? (
                    <span className="equipment-status-pill status-good" style={{ fontWeight: '800' }}>
                      ★ Graded: {awardedGrade || 'Completed'}
                    </span>
                  ) : expired ? (
                    <span className="equipment-status-pill status-danger">
                      ⛔ Deadline Expired
                    </span>
                  ) : (
                    <span className={`equipment-status-pill ${task.status === "Submitted" ? "status-good" : "status-warning"}`}>
                      {task.status}
                    </span>
                  )}
                </div>

                <h3>{task.title}</h3>
                <p>{task.description}</p>

                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <p><strong>Section:</strong> {task.labId} ({task.labName || 'Laboratory'})</p>
                  <p>
                    <strong>Deadline:</strong>{' '}
                    <span style={{ color: expired ? '#f87171' : 'var(--status-busy)', fontWeight: expired ? '700' : 'normal' }}>
                      {task.due} {expired && '(Expired)'}
                    </span>
                  </p>
                  {(task.submittedFile || matchedSub?.fileName) && (
                    <p style={{ marginTop: '4px', color: 'var(--status-ready)' }}>
                      <strong>Attached:</strong> {task.submittedFile || matchedSub?.fileName}
                    </p>
                  )}
                </div>

                {/* Grade & Instructor Feedback display */}
                {isGraded && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'rgba(52, 211, 153, 0.08)',
                    border: '1px solid rgba(52, 211, 153, 0.25)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', textTransform: 'uppercase' }}>
                        Instructor Evaluation
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                        Grade: {awardedGrade || 'A+'}
                      </span>
                    </div>
                    {feedbackRemarks && (
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px', fontStyle: 'italic' }}>
                        "{feedbackRemarks}"
                      </p>
                    )}
                  </div>
                )}

                {/* Student Action Buttons */}
                {isStudent && (
                  <div style={{ marginTop: '16px' }}>
                    {expired ? (
                      <button
                        className="secondary-button"
                        style={{ height: '36px', fontSize: '13px', width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                        disabled={true}
                        title="Submissions closed because the deadline has passed"
                      >
                        ⛔ Deadline Expired - Submissions Closed
                      </button>
                    ) : isGraded ? (
                      <button
                        className="secondary-button"
                        style={{ height: '36px', fontSize: '13px', width: '100%', opacity: 0.7, cursor: 'default' }}
                        disabled={true}
                      >
                        ✓ Evaluation Finalized
                      </button>
                    ) : task.status !== "Submitted" ? (
                      <button
                        className="primary-button"
                        style={{ height: '36px', fontSize: '13px', width: '100%' }}
                        onClick={() => setActiveUploadTask(task)}
                      >
                        Upload Report & Dataset
                      </button>
                    ) : (
                      <button
                        className="secondary-button"
                        style={{ height: '36px', fontSize: '13px', width: '100%' }}
                        onClick={() => setActiveUploadTask(task)}
                      >
                        Replace Submission
                      </button>
                    )}
                  </div>
                )}

                {/* Teacher / Admin View Indicator */}
                {(isTeacher || isAdmin) && (
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Faculty Deliverable • Review in Student Submissions tab
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* Student Upload Modal Drawer */}
      {activeUploadTask && (
        <div className="panel" style={{ border: '1px solid var(--primary-border)', background: 'var(--bg-surface-raised)' }}>
          <div className="panel-title-row">
            <div>
              <h2>Submit Deliverable: {activeUploadTask.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Section: {activeUploadTask.labId} • Student: {studentName} ({userRole})
              </p>
            </div>
            <button className="small-silver-button" onClick={() => setActiveUploadTask(null)}>
              Cancel
            </button>
          </div>

          <form onSubmit={handleFileUpload} className="management-form" style={{ maxWidth: '500px' }}>
            <label>
              Select File to Attach (PDF, ZIP, CSV, IPYNB, SQL, PY)
              <input
                type="text"
                placeholder="e.g. lab_exp3_data_alex.pdf"
                value={selectedFileName}
                onChange={(e) => setSelectedFileName(e.target.value)}
                required
              />
            </label>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="submit"
                className="primary-dashboard-button"
                disabled={submitting}
              >
                {submitting ? "Uploading..." : "Confirm & Submit Deliverable"}
              </button>
              <button
                type="button"
                className="small-silver-button"
                onClick={() => setActiveUploadTask(null)}
              >
                Abort
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Faculty / Admin Publish New Assignment Modal */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '560px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Publish New Assignment Deliverable</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Create practical tasks with deadlines visible to enrolled B.Tech students
                </p>
              </div>
              <button className="small-silver-button" onClick={() => setIsCreateModalOpen(false)}>
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="management-form">
              <label>
                Target Laboratory
                <select value={createLabId} onChange={(e) => setCreateLabId(e.target.value)}>
                  {availableLabs.map((l) => (
                    <option key={l.id} value={l.id}>{l.id} — {l.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Deliverable Title
                <input
                  type="text"
                  placeholder="e.g. Experiment #5 - Multithreaded Socket Server"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Category
                  <select value={createCategory} onChange={(e) => setCreateCategory(e.target.value)}>
                    <option value="Assignment">Assignment</option>
                    <option value="Project">Project / Mini-Project</option>
                    <option value="Module">Lab Module Deliverable</option>
                    <option value="Lab Material">Lab Material Submission</option>
                  </select>
                </label>

                <label>
                  Submission Deadline
                  <input
                    type="text"
                    placeholder="e.g. Sep 28, 2026"
                    value={createDue}
                    onChange={(e) => setCreateDue(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label>
                Instructions / Description
                <textarea
                  rows={3}
                  placeholder="Describe code files, datasets, and observation tables required..."
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-primary)',
                    padding: '8px 10px',
                    fontSize: '13px'
                  }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="small-silver-button"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-dashboard-button"
                  disabled={createLoading}
                >
                  {createLoading ? "Publishing..." : "Publish Deliverable to Students"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmissionsTab;
