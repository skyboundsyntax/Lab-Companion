import React, { useState } from 'react';
import api from '../../../services/api';

export function ModulesTab({ labs = [], allLabs = [], user, isTeacher, isAdmin, onAddModule }) {
  const isStudent = user?.role === 'student' || (!isTeacher && !isAdmin);
  const teacherName = user?.name || user?.full_name || '';

  // Filter labs for teacher: only show their assigned labs
  let visibleLabs = (allLabs && allLabs.length > 0) ? allLabs : labs;
  if (isTeacher && teacherName) {
    visibleLabs = visibleLabs.filter((lab) => {
      const t = (lab.teacher || lab.teacher_name || '').toLowerCase();
      return t.includes(teacherName.toLowerCase()) || teacherName.toLowerCase().includes(t);
    });
    // Fallback if no exact match
    if (visibleLabs.length === 0) {
      visibleLabs = labs;
    }
  }

  // Courseware management form state
  const [targetLabId, setTargetLabId] = useState(visibleLabs[0]?.id || 'LAB-301');
  const [moduleTitle, setModuleTitle] = useState('');
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [fileNameInput, setFileNameInput] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewModule, setPreviewModule] = useState(null);

  // File extension badge helper
  const getFileBadge = (fileStr = '') => {
    const ext = fileStr.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return { label: 'PDF Manual', icon: '📕', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
      case 'py':
        return { label: 'Python Script', icon: '🐍', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
      case 'c':
      case 'cpp':
      case 'h':
        return { label: 'C / C++ Source', icon: '⚙️', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' };
      case 'java':
        return { label: 'Java Class', icon: '☕', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'sql':
        return { label: 'SQL Script', icon: '🗄️', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'jpeg':
      case 'jpg':
      case 'png':
      case 'svg':
        return { label: 'Circuit Diagram', icon: '🖼️', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' };
      case 'ipynb':
        return { label: 'Jupyter Notebook', icon: '📓', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' };
      case 'v':
      case 'vhd':
        return { label: 'Verilog HDL', icon: '⚡', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
      default:
        return { label: ext ? `${ext.toUpperCase()} File` : 'Protocol', icon: '📄', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileObj(file);
      setFileNameInput(file.name);
    }
  };

  const handleStartEdit = (labId, mod) => {
    setTargetLabId(labId);
    setModuleTitle(mod.title);
    setFileNameInput(mod.file || mod.file_name);
    setEditingModuleId(mod.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingModuleId(null);
    setModuleTitle('');
    setFileNameInput('');
    setSelectedFileObj(null);
  };

  const handleSubmitModule = async (e) => {
    e.preventDefault();
    const finalFileName = selectedFileObj ? selectedFileObj.name : fileNameInput.trim();
    if (!moduleTitle.trim() || !finalFileName) {
      setUploadStatus('Please provide a module title and attach a file.');
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('');

      const payload = {
        title: moduleTitle.trim(),
        file: finalFileName,
        file_name: finalFileName,
        role: user?.role,
        userName: user?.name,
      };
      if (editingModuleId) {
        payload.moduleId = editingModuleId;
      }

      await api.labs.addModule(targetLabId, payload);

      setUploadStatus(`✓ Successfully ${editingModuleId ? 'updated' : 'published'} module "${moduleTitle}" for ${targetLabId}!`);
      if (onAddModule) {
        onAddModule(targetLabId, payload);
      }
      handleCancelEdit();
      setTimeout(() => setUploadStatus(''), 4000);
    } catch (err) {
      setUploadStatus(`Failed to upload module: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (fileName) => {
    alert(`Initiating download for courseware: ${fileName}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* 1. Header Information Panel */}
      <div className="panel">
        <div className="panel-title-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>Laboratory Manuals & Protocol Courseware</h2>
              {isTeacher && (
                <span className="brand-pill" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary)' }}>
                  Faculty Scope: {visibleLabs.length} Assigned {visibleLabs.length === 1 ? 'Lab' : 'Labs'}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {isTeacher
                ? `Instructor courseware repository restricted to your assigned lab curriculum (${teacherName}). Publish experiment codes, guides, and datasets.`
                : 'Official laboratory procedures, runnable code templates (.py, .c, .java, .sql), and experiment notebooks.'}
            </p>
          </div>
          <span className="gold-badge">Verified Courseware</span>
        </div>

        {uploadStatus && (
          <p className={`form-message ${uploadStatus.startsWith('Failed') ? 'error' : 'success'}`} style={{ marginBottom: '16px' }}>
            {uploadStatus}
          </p>
        )}

        {/* 2. Real-Time Upload & Update Section for Faculty / Admin */}
        {(isTeacher || isAdmin) && (
          <div style={{
            background: 'var(--bg-surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                  {editingModuleId ? `Edit / Update Courseware Module #${editingModuleId}` : 'Publish New Courseware Module'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Supports all formats: PDF manuals, Python (.py), C/C++ (.c, .cpp), Java (.java), SQL schemas (.sql), Jupyter (.ipynb), circuit diagrams (.jpeg, .png), and Verilog (.v)
                </p>
              </div>
              {editingModuleId && (
                <button type="button" className="small-silver-button" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitModule} className="management-form">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <label>
                  Target Laboratory Facility
                  <select
                    value={targetLabId}
                    onChange={(e) => setTargetLabId(e.target.value)}
                    disabled={editingModuleId !== null}
                  >
                    {visibleLabs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.id} — {l.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Module / Experiment Title
                  <input
                    type="text"
                    placeholder="e.g. Experiment 05 - B-Tree Indexes & Query Execution"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    required
                  />
                </label>
              </div>

              {/* Real-time File Selector & Drag-Drop Area */}
              <div style={{
                marginTop: '10px',
                padding: '16px',
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-app)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <label style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="small-gold-button" style={{ display: 'inline-block' }}>
                      📁 Browse Any File (.pdf, .py, .c, .jpeg, .sql...)
                    </span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Or specify file name directly:
                  </span>

                  <input
                    type="text"
                    placeholder="e.g. exp5_btree_optimizer.sql"
                    value={fileNameInput}
                    onChange={(e) => setFileNameInput(e.target.value)}
                    style={{ flex: 1, minWidth: '220px', margin: 0, height: '34px' }}
                    required
                  />
                </div>

                {/* Real-time file preview badge */}
                {fileNameInput && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    {(() => {
                      const b = getFileBadge(fileNameInput);
                      return (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: b.bg,
                          color: b.color,
                          border: `1px solid ${b.color}40`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>{b.icon}</span>
                          <span>{b.label}</span>
                          <span style={{ color: 'var(--text-muted)' }}>({fileNameInput})</span>
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" className="primary-dashboard-button" disabled={uploading}>
                  {uploading ? "Publishing to Server..." : (editingModuleId ? "Save Module Changes" : "Publish Courseware Module")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. List of Laboratory Courseware Modules */}
        <div className="module-list">
          {visibleLabs.map((lab) => (
            <article key={lab.id} className="module-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="brand-pill">{lab.id}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sem {lab.semester} · {lab.branch}</span>
                  </div>
                  <h3 style={{ marginTop: '4px' }}>{lab.name}</h3>
                </div>
                <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Instructor: <strong>{lab.teacher || lab.teacher_name}</strong>
                </span>
              </div>

              <div className="module-file-list">
                {lab.modules && lab.modules.length > 0 ? (
                  lab.modules.map((mod, idx) => {
                    const badge = getFileBadge(mod.file || mod.file_name);
                    return (
                      <div key={idx} className="module-file-row">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <strong>{mod.title}</strong>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.color}30`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span>{badge.icon}</span>
                              <span>{badge.label}</span>
                            </span>
                          </div>
                          <p className="font-mono" style={{ fontSize: '12px', color: 'var(--primary)' }}>
                            {mod.file || mod.file_name}
                          </p>
                        </div>

                        <div className="module-actions" style={{ display: 'flex', gap: '8px' }}>
                          {(isTeacher || isAdmin) && (
                            <button
                              className="small-silver-button"
                              type="button"
                              onClick={() => handleStartEdit(lab.id, mod)}
                              title="Update Title or Replace File"
                            >
                              ✏️ Edit
                            </button>
                          )}
                          <button
                            className="small-silver-button"
                            type="button"
                            onClick={() => handleDownload(mod.file || mod.file_name)}
                          >
                            📥 Download
                          </button>
                          <button
                            className="small-gold-button"
                            type="button"
                            onClick={() => setPreviewModule({ lab, mod, badge })}
                          >
                            👁️ Preview
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No courseware modules uploaded yet for this laboratory.
                  </div>
                )}
              </div>
            </article>
          ))}

          {visibleLabs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No laboratory modules assigned to your faculty profile.
            </div>
          )}
        </div>
      </div>

      {/* Interactive Preview Drawer Modal */}
      {previewModule && (
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
            maxWidth: '600px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="brand-pill">{previewModule.lab.id}</span>
                <h3 style={{ marginTop: '6px', fontSize: '18px' }}>{previewModule.mod.title}</h3>
              </div>
              <button className="small-silver-button" onClick={() => setPreviewModule(null)}>
                ✕ Close
              </button>
            </div>

            <div style={{
              background: 'var(--bg-surface-raised)',
              borderRadius: 'var(--radius-xs)',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px'
            }}>
              <p><strong>File Name:</strong> {previewModule.mod.file || previewModule.mod.file_name}</p>
              <p><strong>Format:</strong> {previewModule.badge.label}</p>
              <p><strong>Laboratory:</strong> {previewModule.lab.name}</p>
              <p><strong>Supervisor:</strong> {previewModule.lab.teacher || previewModule.lab.teacher_name}</p>
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                <code>/* Live sandbox preview initialized for verified student workspace */</code>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="primary-dashboard-button"
                onClick={() => {
                  handleDownload(previewModule.mod.file || previewModule.mod.file_name);
                  setPreviewModule(null);
                }}
              >
                📥 Download Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModulesTab;
