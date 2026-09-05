import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

export function AdminUsersTab() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    facultyCount: 0,
    studentCount: 0,
  });
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [loading, setLoading] = useState(true);

  // Edit / Promote Student Academic Year & Semester Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editYear, setEditYear] = useState(1);
  const [editSemester, setEditSemester] = useState(1);
  const [updating, setUpdating] = useState(false);
  // Provision New Faculty / Teacher Modal State
  const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
  const [facultyName, setFacultyName] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyEmpId, setFacultyEmpId] = useState('');
  const [facultyBranch, setFacultyBranch] = useState('CSE');
  const [facultyPhone, setFacultyPhone] = useState('');
  const [facultyPassword, setFacultyPassword] = useState('');
  const [facultyLabCode, setFacultyLabCode] = useState('LAB-301');
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [addFacultyFeedback, setAddFacultyFeedback] = useState({ text: '', isError: false });
  const [labsList, setLabsList] = useState([]);

  // Student Registration Requests & Clearance Queue State
  const [studentRequests, setStudentRequests] = useState([]);
  const [activeAdminSubTab, setActiveAdminSubTab] = useState('requests'); // default to clearance queue so admin immediately sees new applicants
  const [requestFilterStatus, setRequestFilterStatus] = useState('pending'); // 'pending' | 'all' | 'approved' | 'rejected'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [requestFeedback, setRequestFeedback] = useState({ text: '', isError: false });

  const loadData = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const [usersData, statsData, labsData, requestsData] = await Promise.all([
        api.admin.getUsers(filterRole).catch((e) => { console.warn("getUsers error:", e); return []; }),
        api.admin.getStats().catch((e) => { console.warn("getStats error:", e); return {}; }),
        api.labs.getAll().catch(() => []),
        api.admin.getStudentRequests().catch((e) => { console.warn("getStudentRequests error:", e); return []; }),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setStats(statsData || {});
      setLabsList(Array.isArray(labsData) ? labsData : []);
      setStudentRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (err) {
      console.error("Failed to load admin user data:", err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  const handleApproveRequest = async (reqId) => {
    try {
      setActionLoadingId(reqId);
      setRequestFeedback({ text: '', isError: false });
      const res = await api.admin.approveStudentRequest(reqId);
      if (res?.success) {
        setStudentRequests((prev) =>
          prev.map((r) => (r.id === reqId ? { ...r, status: 'approved' } : r))
        );
        if (res.user) {
          setUsers((prev) => [res.user, ...prev]);
        }
        setStats((prev) => ({
          ...prev,
          studentCount: (prev.studentCount || 0) + 1,
          totalUsers: (prev.totalUsers || 0) + 1,
        }));
        setRequestFeedback({ text: res.message || 'Student clearance granted!', isError: false });
        setTimeout(() => setRequestFeedback({ text: '', isError: false }), 4500);
      }
    } catch (err) {
      setRequestFeedback({ text: `Failed to approve student: ${err.message}`, isError: true });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (reqId) => {
    try {
      setActionLoadingId(reqId);
      setRequestFeedback({ text: '', isError: false });
      const res = await api.admin.rejectStudentRequest(reqId);
      if (res?.success) {
        setStudentRequests((prev) =>
          prev.map((r) => (r.id === reqId ? { ...r, status: 'rejected' } : r))
        );
        setRequestFeedback({ text: res.message || 'Student registration request denied.', isError: false });
        setTimeout(() => setRequestFeedback({ text: '', isError: false }), 4500);
      }
    } catch (err) {
      setRequestFeedback({ text: `Failed to reject request: ${err.message}`, isError: true });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenAddFaculty = () => {
    setFacultyName('');
    setFacultyEmail('');
    setFacultyBranch('CSE');
    setFacultyEmpId(`TCH-CSE${Math.floor(100 + Math.random() * 900)}`);
    setFacultyPhone('+91 98000 ' + Math.floor(10000 + Math.random() * 90000));
    setFacultyPassword('');
    setFacultyLabCode(labsList[0]?.id || 'LAB-301');
    setAddFacultyFeedback({ text: '', isError: false });
    setIsAddFacultyOpen(true);
  };

  const handleBranchChange = (branch) => {
    setFacultyBranch(branch);
    setFacultyEmpId(`TCH-${branch}${Math.floor(100 + Math.random() * 900)}`);
    const matchingLab = labsList.find((l) => l.branch === branch);
    if (matchingLab) {
      setFacultyLabCode(matchingLab.id || matchingLab.lab_code);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!facultyName || !facultyEmail) return;
    setAddingFaculty(true);
    setAddFacultyFeedback({ text: '', isError: false });
    try {
      const newFaculty = await api.admin.addFaculty({
        name: facultyName,
        email: facultyEmail,
        employeeId: facultyEmpId,
        branch: facultyBranch,
        dept: `Department of ${facultyBranch}`,
        phone: facultyPhone,
        password: facultyPassword,
        assignedLabCode: facultyLabCode,
      });

      setUsers((prev) => [newFaculty, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalUsers: (prev.totalUsers || 0) + 1,
        facultyCount: (prev.facultyCount || 0) + 1,
      }));

      setAddFacultyFeedback({
        text: `Faculty account provisioned successfully: ${newFaculty.name} (${newFaculty.userId || newFaculty.user_id}) assigned to ${facultyLabCode}.`,
        isError: false,
      });

      setTimeout(() => {
        setIsAddFacultyOpen(false);
        setAddFacultyFeedback({ text: '', isError: false });
      }, 1500);
    } catch (err) {
      setAddFacultyFeedback({
        text: `Failed to provision faculty: ${err.message}`,
        isError: true,
      });
    } finally {
      setAddingFaculty(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh pending registration requests and student entries every 4 seconds
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [filterRole]);

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setEditYear(u.year || 1);
    setEditSemester(u.semester || 1);
    setUpdateMsg('');
  };

  const handleSavePromotion = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setUpdating(true);
      setUpdateMsg('');
      const targetId = editingUser.userId || editingUser.user_id || editingUser.id;
      await api.admin.updateUser(targetId, {
        year: parseInt(editYear, 10),
        semester: parseInt(editSemester, 10),
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) => {
          const uid = u.userId || u.user_id || u.id;
          if (uid === targetId) {
            return { ...u, year: parseInt(editYear, 10), semester: parseInt(editSemester, 10) };
          }
          return u;
        })
      );

      setUpdateMsg('Student academic term & curriculum promoted successfully!');
      setTimeout(() => {
        setEditingUser(null);
        setUpdateMsg('');
      }, 1200);
    } catch (err) {
      setUpdateMsg(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const departmentList = [
    { value: 'all', label: 'All Departments' },
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

  const filteredUsers = users
    .filter((u) => {
      if (filterDept === 'all') return true;
      const b = (u.branch || '').toUpperCase();
      const d = (u.dept || '').toUpperCase();
      return b.includes(filterDept) || d.includes(filterDept);
    })
    .sort((a, b) => {
      const deptA = (a.branch || a.dept || 'ZZZ').toUpperCase();
      const deptB = (b.branch || b.dept || 'ZZZ').toUpperCase();
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return (a.name || '').localeCompare(b.name || '');
    });

  const pendingRequestsCount = studentRequests.filter((r) => r.status === 'pending').length;

  const filteredRequests = studentRequests.filter((r) => {
    if (requestFilterStatus === 'all') return true;
    return r.status === requestFilterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Top Statistical Overview */}
      <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
        <div className="stat-card">
          <span className="font-mono">REGISTERED IDENTITIES</span>
          <strong>{stats.totalUsers || users.length}</strong>
          <p>Total authorized accounts in B.Tech database registry</p>
        </div>
        <div className="stat-card">
          <span className="font-mono">FACULTY / STAFF</span>
          <strong>{stats.facultyCount || 0}</strong>
          <p>Supervisory personnel & lab instructors</p>
        </div>
        <div className="stat-card">
          <span className="font-mono">ACTIVE STUDENTS</span>
          <strong>{stats.studentCount || 0}</strong>
          <p>Enrolled B.Tech students across 10 disciplines</p>
        </div>
        <div
          className="stat-card"
          onClick={() => {
            setActiveAdminSubTab('requests');
            setRequestFilterStatus('pending');
          }}
          style={{
            cursor: 'pointer',
            borderLeft: pendingRequestsCount > 0 ? '4px solid #f59e0b' : '1px solid var(--border-subtle)',
            background: pendingRequestsCount > 0 ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-card)',
            transition: 'all 0.2s ease',
          }}
        >
          <span className="font-mono" style={{ color: pendingRequestsCount > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
            PENDING CLEARANCES
          </span>
          <strong style={{ color: pendingRequestsCount > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
            {pendingRequestsCount}
          </strong>
          <p style={{ color: pendingRequestsCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {pendingRequestsCount > 0 ? "⚠️ New student applicants awaiting admin review" : "All registration requests reviewed"}
          </p>
        </div>
      </div>

      {/* Main Administrative Hub */}
      <div className="panel" style={{ padding: 'var(--space-lg)' }}>
        {/* Sub-Tabs Switcher */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveAdminSubTab('registry')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: activeAdminSubTab === 'registry' ? 'var(--primary)' : 'var(--bg-surface-raised)',
              color: activeAdminSubTab === 'registry' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            👥 Authorized Clearance Directory ({users.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminSubTab('requests')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: activeAdminSubTab === 'requests' ? '#f59e0b' : 'var(--bg-surface-raised)',
              color: activeAdminSubTab === 'requests' ? '#000' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>🛡️ Student Registration Clearance Queue</span>
            {pendingRequestsCount > 0 && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '800',
                  background: activeAdminSubTab === 'requests' ? '#000' : '#f59e0b',
                  color: activeAdminSubTab === 'requests' ? '#f59e0b' : '#000',
                }}
              >
                {pendingRequestsCount} PENDING
              </span>
            )}
          </button>
        </div>

        {/* Global Action Feedback */}
        {requestFeedback.text && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-xs)',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: '600',
              background: requestFeedback.isError ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)',
              border: `1px solid ${requestFeedback.isError ? '#f87171' : '#34d399'}`,
              color: requestFeedback.isError ? '#f87171' : '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{requestFeedback.isError ? '✕' : '✓'}</span>
            <span>{requestFeedback.text}</span>
          </div>
        )}

        {/* SUB-VIEW 1: STUDENT REGISTRATION CLEARANCE QUEUE */}
        {activeAdminSubTab === 'requests' && (
          <div>
            <div className="panel-title-row" style={{ marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                    Student Registration Clearance Review Queue
                  </h3>
                  <span className="brand-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                    Anti-Fraud Gatekeeper
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
                  Per institutional security policy, student accounts cannot self-register directly. Verify and approve applicants before granting site access.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                {[
                  { id: 'pending', label: `Pending (${pendingRequestsCount})` },
                  { id: 'approved', label: 'Approved' },
                  { id: 'rejected', label: 'Denied' },
                  { id: 'all', label: 'All Requests' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRequestFilterStatus(tab.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)',
                      background: requestFilterStatus === tab.id ? 'var(--primary)' : 'var(--bg-app)',
                      color: requestFilterStatus === tab.id ? '#000' : 'var(--text-secondary)',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => loadData(false)}
                  title="Force refresh clearance queue from database"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>⟳</span>
                  <span>Refresh Queue</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading clearance requests...
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Roll / Enrollment ID</th>
                      <th>Applicant Student</th>
                      <th>Curriculum Program</th>
                      <th>Year & Semester</th>
                      <th>Applied At</th>
                      <th>Clearance Status</th>
                      <th style={{ textAlign: 'right' }}>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => {
                      const isPending = req.status === 'pending';
                      const isApproved = req.status === 'approved';
                      const isRejected = req.status === 'rejected';
                      const isLoading = actionLoadingId === req.id;

                      return (
                        <tr
                          key={req.id}
                          style={{
                            background: isPending ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                          }}
                        >
                          <td className="font-mono" style={{ color: 'var(--primary)', fontWeight: '700' }}>
                            {req.user_id || req.userId}
                          </td>
                          <td>
                            <strong>{req.name || req.fullName}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.email}</div>
                            {req.phone && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📞 {req.phone}</div>
                            )}
                          </td>
                          <td>
                            <span className="brand-pill" style={{ fontSize: '11px' }}>
                              {req.branch || 'B.Tech'}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {req.course || req.dept}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              Year {req.year || 1} • Sem {req.semester || 1}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {req.requestedAt || req.created_at ? String(req.requestedAt || req.created_at).replace('T', ' ').substring(0, 19) : 'Just now'}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                background: isPending
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : isApproved
                                  ? 'rgba(52, 211, 153, 0.15)'
                                  : 'rgba(248, 113, 113, 0.15)',
                                color: isPending
                                  ? '#f59e0b'
                                  : isApproved
                                  ? '#34d399'
                                  : '#f87171',
                                border: `1px solid ${
                                  isPending ? 'rgba(245, 158, 11, 0.3)' : isApproved ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'
                                }`,
                              }}
                            >
                              {isPending ? 'Pending Review' : isApproved ? 'Approved & Registered' : 'Denied'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isPending ? (
                              <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => handleApproveRequest(req.id)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: 'var(--radius-xs)',
                                    background: '#34d399',
                                    color: '#060911',
                                    border: 'none',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  {isLoading ? 'Clearing...' : '✓ Approve Clearance'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => handleRejectRequest(req.id)}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: 'var(--radius-xs)',
                                    background: 'rgba(248, 113, 113, 0.15)',
                                    color: '#f87171',
                                    border: '1px solid rgba(248, 113, 113, 0.3)',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  ✕ Deny
                                </button>
                              </div>
                            ) : isApproved ? (
                              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>
                                ✓ Registered on Site
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#f87171' }}>
                                Denied ({req.rejection_reason || 'Denied by Admin'})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          {requestFilterStatus === 'pending'
                            ? "✓ No student registration requests currently pending review."
                            : "No registration requests match this filter."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUB-VIEW 2: AUTHORIZED CLEARANCE DIRECTORY */}
        {activeAdminSubTab === 'registry' && (
          <div>
            <div className="panel-title-row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2>Authorized Lab Users & Academic Term Registry</h2>
                  <span className="brand-pill" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)' }}>
                    Admin Clearance
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Department-sorted authorization registry, access permissions, and student term promotion controls
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleOpenAddFaculty}
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
                  <span>+</span> Provision New Faculty
                </button>

                {/* Department Filter (Requirement 11) */}
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
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

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
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
                  <option value="all">All Clearance Roles</option>
                  <option value="student">Students Only</option>
                  <option value="teacher">Faculty / Teachers</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Fetching registered clearance directory from Django...
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Roll / ID</th>
                      <th>Student / Faculty Name</th>
                      <th>Department & Branch</th>
                      <th>Academic Year</th>
                      <th>Current Semester</th>
                      <th>Clearance Role</th>
                      <th>Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const uid = u.userId || u.user_id || `USR-${u.id}`;
                      const isStudent = u.role === 'student';
                      return (
                        <tr key={u.id || uid}>
                          <td className="font-mono" style={{ color: 'var(--primary)', fontWeight: '700' }}>
                            {uid}
                          </td>
                          <td>
                            <strong>{u.name || u.username}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                          </td>
                          <td>
                            <span className="brand-pill" style={{ fontSize: '11px' }}>
                              {u.branch || u.dept || 'Engineering'}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {u.course || u.dept}
                            </div>
                          </td>
                          <td>
                            {isStudent ? (
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                Year {u.year || 1}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>N/A (Staff)</span>
                            )}
                          </td>
                          <td>
                            {isStudent ? (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: 'rgba(56, 189, 248, 0.1)',
                                color: 'var(--primary)',
                                fontWeight: '700',
                                fontSize: '12px',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                Semester {u.semester || 1}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Faculty</span>
                            )}
                          </td>
                          <td>
                            <span className={`brand-pill ${u.role === 'admin' ? 'status-danger-soft' : ''}`} style={{ textTransform: 'uppercase' }}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            {isStudent ? (
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(u)}
                                style={{
                                  background: 'var(--primary-soft)',
                                  border: '1px solid var(--primary-border)',
                                  color: 'var(--primary)',
                                  borderRadius: 'var(--radius-xs)',
                                  padding: '5px 10px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                ✎ Promote Year / Sem
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Clearance Verified
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No identities found for this clearance filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin Academic Term Promotion Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700' }}>Admin Academic Term Promotion</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Promote or modify student academic year & curriculum semester
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: 'var(--bg-app)',
              padding: '12px',
              borderRadius: 'var(--radius-xs)',
              marginBottom: '16px',
              border: '1px solid var(--border-subtle)',
              fontSize: '13px'
            }}>
              <div><strong>Student:</strong> {editingUser.name}</div>
              <div className="font-mono" style={{ color: 'var(--primary)', marginTop: '2px' }}>
                Roll ID: {editingUser.userId || editingUser.user_id}
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                Discipline: {editingUser.course || 'B.Tech'} - {editingUser.branch || editingUser.dept}
              </div>
            </div>

            <form onSubmit={handleSavePromotion}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Academic Year (1 - 4)
                  </label>
                  <select
                    value={editYear}
                    onChange={(e) => setEditYear(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 10px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    <option value={1}>Year 1 (Freshman)</option>
                    <option value={2}>Year 2 (Sophomore)</option>
                    <option value={3}>Year 3 (Junior)</option>
                    <option value={4}>Year 4 (Senior)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Semester Term (1 - 8)
                  </label>
                  <select
                    value={editSemester}
                    onChange={(e) => setEditSemester(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 10px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                    <option value={3}>Semester 3</option>
                    <option value={4}>Semester 4</option>
                    <option value={5}>Semester 5</option>
                    <option value={6}>Semester 6</option>
                    <option value={7}>Semester 7</option>
                    <option value={8}>Semester 8</option>
                  </select>
                </div>
              </div>

              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '16px',
                lineHeight: '1.4'
              }}>
                ℹ Note: Per university policy, students cannot modify their Year or Semester. Only verified administrators have promotion clearance. Saving will update curriculum laboratory enrollments.
              </div>

              {updateMsg && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  background: updateMsg.includes('failed') ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                  color: updateMsg.includes('failed') ? '#f87171' : '#34d399',
                  fontSize: '12px',
                  marginBottom: '14px'
                }}>
                  {updateMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={updating}
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    background: 'var(--primary)',
                    border: 'none',
                    color: '#000',
                    fontWeight: '700',
                    borderRadius: 'var(--radius-xs)',
                    padding: '8px 18px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {updating ? 'Promoting...' : 'Save Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal 2: Provision New Faculty / Teacher */}
      {isAddFacultyOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                  Provision New Faculty / Teacher
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
                  Register instructor clearance and designate primary laboratory supervision
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFacultyOpen(false)}
                style={{
                  background: 'none',
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

            {addFacultyFeedback.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '16px',
                fontSize: '13px',
                background: addFacultyFeedback.isError ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                border: `1px solid ${addFacultyFeedback.isError ? '#f87171' : '#34d399'}`,
                color: addFacultyFeedback.isError ? '#f87171' : '#34d399',
              }}>
                {addFacultyFeedback.text}
              </div>
            )}

            <form onSubmit={handleCreateFaculty}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Faculty Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    placeholder="e.g. Dr. Vikram Malhotra"
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Department / Branch *
                    </label>
                    <select
                      value={facultyBranch}
                      onChange={(e) => handleBranchChange(e.target.value)}
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
                      {departmentList.filter(d => d.value !== 'all').map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Employee ID / Badge *
                    </label>
                    <input
                      type="text"
                      required
                      value={facultyEmpId}
                      onChange={(e) => setFacultyEmpId(e.target.value)}
                      placeholder="e.g. TCH-CSE205"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Institutional Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={facultyEmail}
                      onChange={(e) => setFacultyEmail(e.target.value)}
                      placeholder="vikram.malhotra@lab.edu"
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

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Initial Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Create temporary password"
                      value={facultyPassword}
                      onChange={(e) => setFacultyPassword(e.target.value)}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={facultyPhone}
                      onChange={(e) => setFacultyPhone(e.target.value)}
                      placeholder="+91 98000 00000"
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

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Designated Laboratory
                    </label>
                    <select
                      value={facultyLabCode}
                      onChange={(e) => setFacultyLabCode(e.target.value)}
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
                      <option value="none">None (General Faculty)</option>
                      {labsList.map((lab) => (
                        <option key={lab.id} value={lab.id}>{lab.id} - {lab.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddFacultyOpen(false)}
                  disabled={addingFaculty}
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingFaculty}
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), #6366f1)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '700',
                    borderRadius: 'var(--radius-xs)',
                    padding: '8px 20px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {addingFaculty ? 'Provisioning...' : 'Provision Faculty Clearance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersTab;
