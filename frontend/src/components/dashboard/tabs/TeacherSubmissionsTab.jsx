import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

export function TeacherSubmissionsTab({ studentSubmissions = [], onSubmissionsChanged }) {
  const [submissions, setSubmissions] = useState(studentSubmissions);
  const [feedback, setFeedback] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  // Grading Modal State
  const [gradingSub, setGradingSub] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('A+');
  const [evaluationRemarks, setEvaluationRemarks] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    setSubmissions(studentSubmissions);
  }, [studentSubmissions]);

  // Requirement 9: Only display submissions that have student uploaded files
  const uploadedSubmissions = submissions.filter(
    (sub) => (sub.fileName || sub.file_name) && (sub.fileName || sub.file_name).trim() !== ''
  );

  const handleOpenGradingModal = (sub) => {
    setGradingSub(sub);
    setSelectedGrade(sub.grade || 'A+');
    setEvaluationRemarks(sub.feedback || 'Code verified with correct test cases and report documentation.');
  };

  const handleCloseGradingModal = () => {
    setGradingSub(null);
    setEvaluationRemarks('');
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSub) return;

    try {
      setSavingGrade(true);
      const res = await api.submissions.verify(gradingSub.id, {
        grade: selectedGrade,
        feedback: evaluationRemarks.trim(),
        status: 'Verified / Graded',
      });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === gradingSub.id
            ? { ...s, status: "Verified / Graded", grade: selectedGrade, feedback: evaluationRemarks.trim() }
            : s
        )
      );

      setFeedback(`✓ Submission #${gradingSub.id} for ${gradingSub.studentName} graded as ${selectedGrade}! Reflected on student assignment.`);
      handleCloseGradingModal();
      if (onSubmissionsChanged) onSubmissionsChanged();
      setTimeout(() => setFeedback(""), 4000);
    } catch (err) {
      setFeedback(`Error evaluating submission: ${err.message}`);
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-title-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2>Student Submissions Review & Grading Queue</h2>
            <span className="brand-pill" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)' }}>
              Faculty Evaluation
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Inspect student-uploaded practical files (.py, .c, .sql, .pdf), evaluate laboratory work, and record awarded grades with instructor remarks
          </p>
        </div>
        <span className="gold-badge">{uploadedSubmissions.length} Uploaded Files In Queue</span>
      </div>

      {feedback && (
        <p className={`form-message ${feedback.startsWith('Error') ? 'error' : 'success'}`} style={{ marginBottom: '16px' }}>
          {feedback}
        </p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>Deliverable Title</th>
              <th>Section</th>
              <th>Uploaded File</th>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Awarded Grade</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {uploadedSubmissions.map((sub) => {
              const fileName = sub.fileName || sub.file_name;
              const isGraded = sub.status === "Verified / Graded" || sub.grade;

              return (
                <tr key={sub.id}>
                  <td className="font-mono" style={{ color: 'var(--text-muted)' }}>#{sub.id}</td>
                  <td>
                    <strong>{sub.studentName}</strong>
                    {sub.studentId && (
                      <span className="font-mono" style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {sub.studentId}
                      </span>
                    )}
                  </td>
                  <td>{sub.taskTitle}</td>
                  <td><span className="brand-pill">{sub.labId}</span></td>
                  <td>
                    <span className="font-mono" style={{
                      fontSize: '12px',
                      color: 'var(--primary)',
                      background: 'rgba(56, 189, 248, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(56, 189, 248, 0.2)'
                    }}>
                      📎 {fileName}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {sub.submittedAt || 'Recent'}
                  </td>
                  <td>
                    <span className={`equipment-status-pill ${isGraded ? "status-good" : "status-warning"}`}>
                      {isGraded ? "Verified / Graded" : "Submitted"}
                    </span>
                  </td>
                  <td>
                    {sub.grade ? (
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#34d399',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        background: 'rgba(52, 211, 153, 0.12)',
                        borderRadius: '4px',
                        border: '1px solid rgba(52, 211, 153, 0.3)'
                      }}>
                        ★ {sub.grade}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending Grade</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="small-gold-button"
                      type="button"
                      onClick={() => handleOpenGradingModal(sub)}
                    >
                      {isGraded ? "✏️ Regrade" : "⭐ Grade"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {uploadedSubmissions.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No uploaded student files currently awaiting grading in this queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Grading Modal */}
      {gradingSub && (
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
            maxWidth: '540px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="brand-pill">{gradingSub.labId}</span>
                <h3 style={{ marginTop: '6px', fontSize: '18px' }}>Grade Student Submission #{gradingSub.id}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Student: <strong>{gradingSub.studentName}</strong> • {gradingSub.taskTitle}
                </p>
              </div>
              <button className="small-silver-button" onClick={handleCloseGradingModal}>
                ✕ Close
              </button>
            </div>

            {/* Attached file review box */}
            <div style={{
              background: 'var(--bg-surface-raised)',
              borderRadius: 'var(--radius-xs)',
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>UPLOADED REPORT FILE</span>
                <strong>{gradingSub.fileName || gradingSub.file_name}</strong>
              </div>
              <button
                type="button"
                className="small-silver-button"
                onClick={() => alert(`Opening inspector for ${gradingSub.fileName || gradingSub.file_name}`)}
              >
                👁️ View Code / PDF
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="management-form">
              <label>
                Awarded Academic Grade
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  style={{ fontWeight: '700' }}
                >
                  <option value="O">O — Outstanding (10.0 Grade Points)</option>
                  <option value="A+">A+ — Excellent (10.0 Grade Points)</option>
                  <option value="A">A — Very Good (9.0 Grade Points)</option>
                  <option value="B+">B+ — Good (8.0 Grade Points)</option>
                  <option value="B">B — Above Average (7.0 Grade Points)</option>
                  <option value="C">C — Pass (6.0 Grade Points)</option>
                  <option value="P">P — Marginal Pass (5.0 Grade Points)</option>
                  <option value="F">F — Fail (0.0 Grade Points)</option>
                </select>
              </label>

              <label>
                Instructor Evaluation Remarks & Feedback
                <textarea
                  rows={3}
                  placeholder="e.g. Algorithms implemented accurately with optimal space complexity. Well-structured comments."
                  value={evaluationRemarks}
                  onChange={(e) => setEvaluationRemarks(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-primary)',
                    padding: '8px 10px',
                    fontSize: '13px'
                  }}
                  required
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="small-silver-button"
                  onClick={handleCloseGradingModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-dashboard-button"
                  disabled={savingGrade}
                >
                  {savingGrade ? "Saving Grade..." : "Submit Grade & Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherSubmissionsTab;
