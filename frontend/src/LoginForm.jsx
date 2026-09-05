import React, { useState, useEffect } from "react";
import api from "./services/api";

export const BTECH_COURSES = [
  { code: 'CSE', name: 'B.Tech - Computer Science & Engineering (CSE)', dept: 'Computer Science & Engineering' },
  { code: 'AIML', name: 'B.Tech - CSE (Artificial Intelligence & Machine Learning)', dept: 'Computer Science & Engineering' },
  { code: 'DS', name: 'B.Tech - CSE (Data Science)', dept: 'Computer Science & Engineering' },
  { code: 'IT', name: 'B.Tech - Information Technology (IT)', dept: 'Information Technology' },
  { code: 'ECE', name: 'B.Tech - Electronics & Communication Engineering (ECE)', dept: 'Electronics & Communication Engineering' },
  { code: 'EEE', name: 'B.Tech - Electrical & Electronics Engineering (EEE)', dept: 'Electrical & Electronics Engineering' },
  { code: 'ME', name: 'B.Tech - Mechanical Engineering (ME)', dept: 'Mechanical Engineering' },
  { code: 'CIVIL', name: 'B.Tech - Civil Engineering (Civil / CE)', dept: 'Civil Engineering' },
  { code: 'ECM', name: 'B.Tech - Electronics & Computer Engineering (ECM)', dept: 'Electronics & Computer Engineering' },
  { code: 'RA', name: 'B.Tech - Robotics & Automation / Mechatronics (RA)', dept: 'Mechanical & Robotics Engineering' },
];

export function deriveYearAndSem(idStr) {
  if (!idStr) return { year: 1, semester: 1 };
  const raw = idStr.toUpperCase().trim();
  const match = raw.match(/(?:20)?(2[1-6])/);
  if (match) {
    const yy = parseInt(match[1], 10);
    if (yy >= 26) return { year: 1, semester: 1 };
    if (yy === 25) return { year: 2, semester: 3 };
    if (yy === 24) return { year: 2, semester: 3 };
    if (yy === 23) return { year: 3, semester: 5 };
    if (yy <= 22) return { year: 4, semester: 7 };
  }
  return { year: 1, semester: 1 };
}

function LoginForm({ role = "student", onLoginSuccess, onBack }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("Computer Science & Engineering");
  const [selectedCourse, setSelectedCourse] = useState(BTECH_COURSES[0].name);
  const [derivedYearSem, setDerivedYearSem] = useState({ year: 2, semester: 3 });
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2-Step OTP Verification State (Requirement 4)
  const [otpStep, setOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpUserId, setOtpUserId] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(300);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  const [emailDispatched, setEmailDispatched] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState("");
  const [devOtp, setDevOtp] = useState(null);

  useEffect(() => {
    if (role === "admin" || role === "teacher") {
      setIsSignUp(false);
    }
    setOtpStep(false);
    setOtpInput("");
    setEmailDispatched(false);
    setEmailStatusMsg("");
    setDevOtp(null);
  }, [role]);

  useEffect(() => {
    if (!otpStep) return;
    const interval = setInterval(() => {
      setOtpTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpStep]);

  const formatTimer = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleUserIdChange = (val) => {
    setUserId(val);
    if (role === "student") {
      const { year, semester } = deriveYearAndSem(val);
      setDerivedYearSem({ year, semester });

      // Automatically auto-suggest course if branch code is present in ID
      const upper = val.toUpperCase();
      const matched = BTECH_COURSES.find(c => upper.includes(c.code));
      if (matched) {
        setSelectedCourse(matched.name);
        setDept(matched.dept);
      }
    }
  };

  const handleCourseChange = (courseName) => {
    setSelectedCourse(courseName);
    const matched = BTECH_COURSES.find(c => c.name === courseName);
    if (matched) {
      setDept(matched.dept);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", isError: false });
    setLoading(true);

    if (isSignUp) {
      try {
        const matchedCourse = BTECH_COURSES.find(c => c.name === selectedCourse) || BTECH_COURSES[0];
        const data = await api.auth.register({
          email,
          password,
          role,
          userId,
          name,
          dept: role === "student" ? matchedCourse.dept : dept,
          course: role === "student" ? selectedCourse : dept,
          branch: role === "student" ? matchedCourse.code : "FACULTY",
          year: role === "student" ? parseInt(derivedYearSem.year, 10) : undefined,
          semester: role === "student" ? parseInt(derivedYearSem.semester, 10) : undefined,
          phone,
        });

        if (data.otp_required) {
          setOtpStep(true);
          setOtpUserId(data.userId || data.user_id || userId);
          setOtpEmail(data.email || email);
          setEmailDispatched(!!data.email_dispatched);
          setEmailStatusMsg(data.email_status_msg || "");
          setDevOtp(data.dev_otp || null);
          setOtpTimeLeft(300);
          setMessage({
            text: data.message || `2-Step verification code dispatched to ${data.email || email}.`,
            isError: false,
          });
          return;
        }

        if (data.pending_approval) {
          setMessage({
            text: `📋 Registration Request Submitted! Student account for ${data.name || name} (${data.userId || data.user_id || userId}) is pending Institutional Administrator approval. Once approved, you can log in with your password and email OTP.`,
            isError: false,
          });
          setIsSignUp(false);
          setPassword("");
        } else {
          setMessage({
            text: `Account created successfully for ${data.email} (${data.userId || data.user_id}). Enrolled in ${selectedCourse}. You can now log in.`,
            isError: false,
          });
          setIsSignUp(false);
          setPassword("");
        }
      } catch (error) {
        setMessage({
          text: error.message || "Registration failed. Please check your details.",
          isError: true,
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const data = await api.auth.login(email, password, role);

      // Check if 2-Step OTP verification is required (students and teachers)
      if (data.otp_required) {
        setOtpStep(true);
        setOtpUserId(data.userId);
        setOtpEmail(data.email);
        setEmailDispatched(!!data.email_dispatched);
        setEmailStatusMsg(data.email_status_msg || "");
        setDevOtp(data.dev_otp || null);
        setOtpTimeLeft(300);
        setMessage({
          text: data.message || `2-Step verification code dispatched to ${data.email}.`,
          isError: false,
        });
        setLoading(false);
        return;
      }

      onLoginSuccess({
        id: data.id,
        token: data.token,
        username: data.username,
        role: data.role,
        userId: data.userId || data.user_id,
        user_id: data.user_id || data.userId,
        name: data.name,
        dept: data.dept,
        course: data.course || "B.Tech - Computer Science & Engineering (CSE)",
        branch: data.branch || "CSE",
        year: data.year || 2,
        semester: data.semester || 3,
        email: data.email,
        phone: data.phone,
        grade: data.grade,
        attendance_rate: data.attendance_rate,
      });
    } catch (error) {
      setMessage({
        text: error.message || `Invalid credentials for the ${role} portal.`,
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.length !== 6) {
      setMessage({ text: "Please enter the complete 6-digit verification token.", isError: true });
      return;
    }
    setOtpLoading(true);
    setMessage({ text: "", isError: false });
    try {
      const data = await api.auth.verifyOtp({
        userId: otpUserId,
        email: otpEmail,
        otp: otpInput,
        role,
      });

      // If registration OTP verified: Administrator approval is mandatory before portal entry!
      if (data.pending_approval || data.is_registration) {
        setOtpStep(false);
        setIsSignUp(false);
        setPassword("");
        setOtpInput("");
        setMessage({
          text: data.message || "Email verified! Your student registration has been submitted to the Institutional Administrator. Mandatory administrator clearance is required before portal access. Please wait for approval before signing in.",
          isError: false,
        });
        return;
      }

      onLoginSuccess({
        id: data.id,
        token: data.token,
        username: data.username,
        role: data.role,
        userId: data.userId || data.user_id,
        user_id: data.user_id || data.userId,
        name: data.name,
        dept: data.dept,
        course: data.course || "B.Tech - Computer Science & Engineering (CSE)",
        branch: data.branch || "CSE",
        year: data.year || 2,
        semester: data.semester || 3,
        email: data.email,
        phone: data.phone,
        grade: data.grade,
        attendance_rate: data.attendance_rate,
      });
    } catch (error) {
      setMessage({
        text: error.message || "Invalid or expired verification token.",
        isError: true,
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpResending(true);
    try {
      const res = await api.auth.resendOtp({
        userId: otpUserId,
        email: otpEmail,
        role,
      });
      setEmailDispatched(!!res?.email_dispatched);
      setEmailStatusMsg(res?.email_status_msg || "");
      if (res?.dev_otp) setDevOtp(res.dev_otp);
      setOtpTimeLeft(300);
      setMessage({ text: res.message || "Fresh authentication token dispatched.", isError: false });
    } catch (error) {
      setMessage({ text: error.message || "Failed to reissue verification token.", isError: true });
    } finally {
      setOtpResending(false);
    }
  };

  const getRoleName = () => {
    return role === "admin" ? "Facilities & Admin" : role === "teacher" ? "Faculty / Instructor" : "Student";
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <span className="auth-eyebrow">
          {isSignUp ? "B.Tech Account Provisioning" : "Session Authorization"}
        </span>
        <h2>{isSignUp ? `Register ${getRoleName()}` : `${getRoleName()} Login`}</h2>
        <p>
          {isSignUp
            ? `Enroll verified ${role === 'student' ? 'B.Tech Student' : role} identity into college curriculum registry.`
            : `Authenticate through Django Backend (Port 8000) for the ${role} console.`}
        </p>
      </div>

      {message.text && (
        <p className={message.isError ? "form-message error" : "form-message success"}>
          {message.text}
        </p>
      )}

      {otpStep ? (
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            marginBottom: '14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
              🔐 2-Step OTP Security Verification
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Verifying identity for <strong>{otpEmail}</strong>
            </p>
          </div>

          <div style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-sm)',
            background: emailDispatched ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: emailDispatched ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            lineHeight: 1.5,
            textAlign: 'center'
          }}>
            {emailDispatched ? (
              <div>
                <div style={{ fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
                  📬 Real Email Dispatched!
                </div>
                <span>A 6-digit authentication token was sent to <strong>{otpEmail}</strong> via SMTP. Please check your inbox or spam folder.</span>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: '700', color: '#f59e0b', marginBottom: '4px' }}>
                  ⚠️ Real Email Inactive: SMTP Not Configured
                </div>
                <span style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                  To send real emails to your personal inbox, configure <code>EMAIL_HOST_USER</code> and <code>EMAIL_HOST_PASSWORD</code> in <code>backend/.env</code>.
                </span>
                {devOtp && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px dashed rgba(56, 189, 248, 0.4)',
                    borderRadius: 'var(--radius-xs)',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generated Test Code: </span>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--primary)', letterSpacing: '2px' }}>{devOtp}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpInput(devOtp)}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Fill Code
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <label>
            Enter 6-Digit Authentication Code
            <input
              type="text"
              maxLength="6"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
              placeholder="• • • • • •"
              autoFocus
              required
              style={{
                letterSpacing: '8px',
                textAlign: 'center',
                fontSize: '22px',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)',
                height: '48px',
              }}
            />
          </label>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '6px'
          }}>
            <span>
              ⏱️ Expires in: <strong style={{ color: otpTimeLeft < 60 ? '#f87171' : 'var(--text-primary)' }}>{formatTimer(otpTimeLeft)}</strong>
            </span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={otpResending || otpTimeLeft > 240}
              style={{
                background: 'none',
                border: 'none',
                color: otpTimeLeft > 240 ? 'var(--text-muted)' : 'var(--primary)',
                cursor: otpTimeLeft > 240 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                padding: 0
              }}
            >
              {otpResending ? "Dispatching..." : "Resend Token"}
            </button>
          </div>

          <button
            type="submit"
            className="primary-login-button"
            disabled={otpLoading || otpInput.length !== 6}
            style={{ marginTop: '16px' }}
          >
            {otpLoading ? "Verifying Code..." : `Verify & Enter ${getRoleName()} Console`}
          </button>



          <button
            type="button"
            onClick={() => {
              setOtpStep(false);
              setOtpInput("");
              setDevOtp(null);
              setMessage({ text: "", isError: false });
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              marginTop: '10px',
              textAlign: 'center',
              width: '100%'
            }}
          >
            ← Back to Password Login
          </button>
        </form>
      ) : (
      <form onSubmit={handleSubmit} className="auth-form">
        {isSignUp && (
          <>
            <label>
              {role === "student" ? "Student ID / Roll Number" : "Faculty / Badge ID"}
              <input
                type="text"
                value={userId}
                onChange={(e) => handleUserIdChange(e.target.value)}
                required
                placeholder={role === "student" ? "e.g. 2024CSE0101" : role === "teacher" ? "e.g. TCH-1001" : "e.g. ADM-1001"}
              />
            </label>

            {role === "student" && (
              <>
                {/* 10 Most Sought After B.Tech Courses Dropdown */}
                <label>
                  B.Tech Engineering Branch / Course
                  <select
                    value={selectedCourse}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    required
                    style={{
                      height: '42px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0 12px',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    {BTECH_COURSES.map((course) => (
                      <option key={course.code} value={course.name}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Pre-filled from ID, editable during registration; locked post-registration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label>
                    Academic Year
                    <select
                      value={derivedYearSem.year}
                      onChange={(e) => setDerivedYearSem((prev) => ({ ...prev, year: parseInt(e.target.value, 10) }))}
                      style={{
                        height: '44px',
                        background: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0 10px',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      <option value={1}>Year 1 (Freshman)</option>
                      <option value={2}>Year 2 (Sophomore)</option>
                      <option value={3}>Year 3 (Junior)</option>
                      <option value={4}>Year 4 (Senior)</option>
                    </select>
                  </label>
                  <label>
                    Current Semester
                    <select
                      value={derivedYearSem.semester}
                      onChange={(e) => setDerivedYearSem((prev) => ({ ...prev, semester: parseInt(e.target.value, 10) }))}
                      style={{
                        height: '44px',
                        background: 'var(--bg-app)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0 10px',
                        fontWeight: 600,
                        fontSize: '13px',
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
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '4px' }}>
                  <span>✓</span>
                  <span>Pre-filled from ID. You can adjust your Year & Semester now; once account is created, only an Administrator can modify it.</span>
                </div>
              </>
            )}

            <label>
              Full Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={role === "student" ? "Student Full Name" : "Prof. / Dr. Full Name"}
              />
            </label>

            {role !== "student" && (
              <label>
                Department / Faculty Division
                <input
                  type="text"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  required
                  placeholder="e.g. Department of Computer Science & Engineering"
                />
              </label>
            )}

            <label>
              Emergency Contact / Phone
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
              />
            </label>
          </>
        )}

        <label>
          Institutional Email Address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={role === "student" ? "student@institution.edu" : role === "teacher" ? "faculty@institution.edu" : "admin@institution.edu"}
          />
        </label>

        <label>
          Authorization Password
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••••••"
            className="password-input"
          />
          <button
            type="button"
            className="button1"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </label>

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Authorizing with Server..." : isSignUp ? "Enroll & Provision Identity" : `Access ${getRoleName()} Console`}
        </button>
      </form>
      )}

      <div className="auth-card-actions">
        {role === "admin" ? (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            lineHeight: '1.4',
            textAlign: 'center'
          }}>
            🔒 <strong>Administrator Clearance Restricted</strong><br/>
            New admin identities cannot be self-registered. Admin credentials must be provisioned directly by backend facilities management.
          </div>
        ) : role === "teacher" ? (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            lineHeight: '1.4',
            textAlign: 'center'
          }}>
            🔒 <strong>Faculty Clearance Restricted</strong><br/>
            Faculty and instructor accounts must be provisioned directly by Institutional Administrators via the Admin Console. Self-registration is restricted.
          </div>
        ) : (
          <button
            type="button"
            className="switch-auth-button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage({ text: "", isError: false });
            }}
          >
            {isSignUp ? "Return to Login" : "New User? Register Identity"}
          </button>
        )}

        <button type="button" className="back-to-portals-btn" onClick={onBack}>
          &larr; Switch Console Portal
        </button>
      </div>
    </div>
  );
}

export default LoginForm;