import { useState } from 'react'
import * as apiService from '../../api.js'
import './LoginPage.css'

export default function LoginPage({ mode, onLogin, onSetupComplete }) {
  // ── Setup state ──────────────────────────────────────────
  const [setupName, setSetupName] = useState('')
  const [setupPassword, setSetupPassword] = useState('')
  const [setupConfirm, setSetupConfirm] = useState('')

  // ── Login state ──────────────────────────────────────────
  const [type, setType] = useState('student')
  const [roll, setRoll] = useState('')
  const [dob, setDob] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [hodName, setHodName] = useState('')
  const [hodPassword, setHodPassword] = useState('')

  // ── Password setup (first-time teacher) ─────────────────
  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pendingUser, setPendingUser] = useState(null)
  const [pendingToken, setPendingToken] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ══════════════════════════════════════════════════════════
  //  SYSTEM SETUP — first-time HOD registration
  // ══════════════════════════════════════════════════════════
  const handleSetup = async () => {
    setError('')
    if (!setupName.trim()) { setError('Please enter the HOD name'); return }
    if (!setupPassword) { setError('Please enter a password'); return }
    if (setupPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (setupPassword !== setupConfirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const response = await apiService.registerHOD(setupName.trim(), setupPassword)
      onSetupComplete(response.user, response.token)
    } catch (err) {
      setError(err.message || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'setup') {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-head">

            <h1>System Setup</h1>
            <p className="subtitle">Welcome! Create the HOD account to get started.</p>
          </div>
          <div className="login-form">
            {error && <div className="error-message">{error}</div>}
            <label>
              HOD Name
              <input
                type="text"
                value={setupName}
                onChange={e => setSetupName(e.target.value)}
                placeholder="e.g. Dr. Smith"
                autoFocus
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={setupPassword}
                onChange={e => setSetupPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                value={setupConfirm}
                onChange={e => setSetupConfirm(e.target.value)}
                placeholder="Re-enter password"
              />
            </label>
            <button className="login-btn" onClick={handleSetup} disabled={loading}>
              {loading ? 'Creating account...' : 'Create HOD Account & Start'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  //  FIRST-TIME PASSWORD SETUP for teacher
  // ══════════════════════════════════════════════════════════
  const handlePasswordSetup = async () => {
    setError('')
    if (!newPassword || !confirmPassword) { setError('Please fill in both fields'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      if (pendingToken) localStorage.setItem('token', pendingToken)
      await apiService.setupUserPassword(pendingUser.id, newPassword)
      const response = await apiService.authenticateUser('teacher', {
        name: pendingUser.name.trim(),
        password: newPassword
      })
      onLogin(response.user, response.token)
    } catch (err) {
      setError(err.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  if (showPasswordSetup) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-head">
            <span className="icon">🔐</span>
            <h1>Set Your Password</h1>
            <p className="subtitle">Welcome! Create a password to secure your account.</p>
          </div>
          <div className="login-form">
            {error && <div className="error-message">{error}</div>}
            <label>
              New Password
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" />
            </label>
            <label>
              Confirm Password
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </label>
            <div className="form-actions">
              <button className="cancel-btn" disabled={loading} onClick={() => {
                setShowPasswordSetup(false); setPendingUser(null); setPendingToken(null)
                setNewPassword(''); setConfirmPassword('')
              }}>Cancel</button>
              <button className="submit-btn" onClick={handlePasswordSetup} disabled={loading}>
                {loading ? 'Setting...' : 'Set Password & Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  //  NORMAL LOGIN
  // ══════════════════════════════════════════════════════════
  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      if (type === 'student') {
        if (!roll || !dob) { setError('Enter roll number and date of birth'); setLoading(false); return }
        const response = await apiService.authenticateUser('student', { roll: Number(roll), dob })
        onLogin(response.user, response.token)
        return
      }
      if (type === 'teacher') {
        const trimmedName = teacherName.trim();
        if (!trimmedName) { setError('Enter your name'); setLoading(false); return }
        const response = await apiService.authenticateUser('teacher', { name: trimmedName, password: teacherPassword })
        if (response.needsSetup) {
          setPendingUser(response.user)
          setPendingToken(response.token)
          setShowPasswordSetup(true)
          setLoading(false)
          return
        }
        onLogin(response.user, response.token)
        return
      }
      if (type === 'hod') {
        const trimmedName = hodName.trim();
        if (!trimmedName) { setError('Enter HOD name'); setLoading(false); return }
        const response = await apiService.authenticateUser('hod', { name: trimmedName, password: hodPassword })
        onLogin(response.user, response.token)
        return
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-head">

          <h1>Digital Routine & Attendance Management System</h1>
        </div>

        <div className="role-select">
          {['student', 'teacher', 'hod'].map(t => (
            <button key={t} className={type === t ? 'active' : ''} onClick={() => { setType(t); setError('') }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="login-form">
          {error && <div className="error-message">{error}</div>}

          {type === 'student' && (
            <>
              <label>Roll Number<input type="number" value={roll} onChange={e => setRoll(e.target.value)} placeholder="e.g. 1" /></label>
              <label>Date of Birth<input type="date" value={dob} onChange={e => setDob(e.target.value)} /></label>
            </>
          )}
          {type === 'teacher' && (
            <>
              <label>Teacher Name<input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="Enter your name" /></label>
              <label>Password<input type="password" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} placeholder="Enter your password" /></label>
              <div className="teacher-hint"><small>💡 First time? Enter your name — you'll be prompted to set a password</small></div>
            </>
          )}
          {type === 'hod' && (
            <>
              <label>HOD Name<input type="text" value={hodName} onChange={e => setHodName(e.target.value)} placeholder="Enter your name" /></label>
              <label>Password<input type="password" value={hodPassword} onChange={e => setHodPassword(e.target.value)} placeholder="Enter your password" /></label>
            </>
          )}

          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  )
}
