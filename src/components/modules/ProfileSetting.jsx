import React, { useState, useEffect } from 'react';
import UploadPhotoModal from './profileSetting/UploadPhoto';
import '../../styles/profileSetting/ProfileSetting.css';

// ── Mirrors the same base URL + token pattern used across the project ─────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

function getToken() {
  return sessionStorage.getItem('access_token');
}

async function request(path, options = {}) {
  const token      = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const contentType = res.headers.get('content-type') || '';
  const parseBody   = async () => {
    if (contentType.includes('application/json')) return res.json();
    const text = await res.text();
    if (/<!doctype html|<html/i.test(text))
      return { detail: 'Server returned HTML — check VITE_API_URL and backend port.' };
    return { detail: text || res.statusText };
  };

  if (!res.ok) {
    const err = await parseBody();
    throw new Error(err.detail || err.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return parseBody();
}

// ── Typed API surface — matches main.py exactly ───────────────────────────────
const profileApi = {
  // GET  /api/users/me
  getMe: () =>
    request('/api/users/me'),

  // PUT  /api/users/me/profile  { first_name, last_name, middle_name, email, contact_number }
  updateProfile: (data) =>
    request('/api/users/me/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // PATCH /api/users/me         { current_password, new_password, confirm_password }
  changePassword: (data) =>
    request('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // POST  /api/users/me/profile-pic  multipart/form-data  field: "file"
  uploadPhoto: (formData) =>
    request('/api/users/me/profile-pic', { method: 'POST', body: formData }),
};

// ─────────────────────────────────────────────────────────────────────────────

const ProfileSetting = ({ onNavigate, onAdminPhotoUpdate }) => {
  // ── Profile state (mirrors Staff model columns) ───────────────────────────
  const [fname,         setFname]         = useState('');
  const [lname,         setLname]         = useState('');
  const [middleName,    setMiddleName]    = useState('');
  const [email,         setEmail]         = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [profilePhoto,  setProfilePhoto]  = useState(null);
  const [accountStatus, setAccountStatus] = useState('');
  const [createdAt,     setCreatedAt]     = useState('');
  const [role,          setRole]          = useState('');

  // ── Password state ─────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showPhotoModal,  setShowPhotoModal]  = useState(false);
  const [toast,           setToast]           = useState('');
  const [profileLoading,  setProfileLoading]  = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [photoLoading,    setPhotoLoading]    = useState(false);
  const [fetchError,      setFetchError]      = useState('');

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const getInitials = () => {
    const f = fname.trim()[0] ?? '';
    const l = lname.trim()[0] ?? '';
    return (f + l).toUpperCase() || '?';
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';

  // ── Load own profile on mount ──────────────────────────────────────────────
  useEffect(() => {
    profileApi.getMe()
      .then((data) => {
        setFname(data.first_name      ?? '');
        setLname(data.last_name       ?? '');
        setMiddleName(data.middle_name  ?? '');
        setEmail(data.email           ?? '');
        setContactNumber(data.contact_number ?? '');
        // Prefix API_BASE when the stored value is a relative server path
        const pic = data.profile_pic ?? null;
        setProfilePhoto(pic && pic.startsWith('/') ? `${API_BASE}${pic}` : pic);
        setAccountStatus(data.account_status ?? '');
        setCreatedAt(data.created_at  ?? '');
        setRole(data.role             ?? '');
      })
      .catch((err) => setFetchError(err.message));
  }, []);

  // ── Save personal info — PUT /api/users/me/profile ────────────────────────
  const handleSaveProfile = async () => {
    if (!fname.trim() || !lname.trim()) {
      showToast('First name and last name are required.');
      return;
    }
    setProfileLoading(true);
    try {
      const updated = await profileApi.updateProfile({
        first_name:     fname.trim(),
        last_name:      lname.trim(),
        middle_name:    middleName.trim() || null,
        email:          email.trim(),
        contact_number: contactNumber.trim(),
      });
      // Sync state with what the server returned
      setFname(updated.first_name      ?? fname);
      setLname(updated.last_name       ?? lname);
      setMiddleName(updated.middle_name  ?? middleName);
      setEmail(updated.email           ?? email);
      setContactNumber(updated.contact_number ?? contactNumber);
      // Keep profile pic in sync if the server updated it
      if (updated.profile_pic) {
        const p = updated.profile_pic;
        setProfilePhoto(p.startsWith('/') ? `${API_BASE}${p}` : p);
      }
      showToast('Profile updated successfully.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Change password — PATCH /api/users/me ─────────────────────────────────
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.');
      return;
    }
    setPasswordLoading(true);
    try {
      // Backend expects: current_password, new_password, confirm_password
      await profileApi.changePassword({
        current_password: currentPassword,
        new_password:     newPassword,
        confirm_password: confirmPassword,
      });
      showToast('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Upload photo — POST /api/users/me/profile-pic ─────────────────────────
  const handlePhotoUpload = async (file) => {
    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const updated = await profileApi.uploadPhoto(formData);
      // Backend returns updated StaffResponse; profile_pic is the new URL path
      const newUrl = updated?.profile_pic
        ? `${API_BASE}${updated.profile_pic}`   // e.g. http://127.0.0.1:8001/uploads/profile_pics/abc.jpg
        : URL.createObjectURL(file);            // fallback: local blob preview
      setProfilePhoto(newUrl);
      if (onAdminPhotoUpdate) onAdminPhotoUpdate(newUrl);
      showToast('Profile photo updated successfully.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setPhotoLoading(false);
      setShowPhotoModal(false);
    }
  };

  // ── Error fallback ─────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{fetchError}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="profile-page">
      <div className="profile-container">

        <button className="back-btn" onClick={() => onNavigate('dashboard')}>
          ← Back to Dashboard
        </button>

        <h1 className="profile-title">Account Settings</h1>
        <p className="profile-subtitle">Manage your personal profile information.</p>

        {/* ── Profile Card ── */}
        <div className="profile-card">
          <div className="card-label">Profile</div>
          <div className="avatar-section">
            <div className="avatar-large">
              {profilePhoto
                ? <img src={profilePhoto} alt="Profile" className="avatar-image" />
                : getInitials()
              }
            </div>
            <div className="avatar-info">
              <h3 className="avatar-name">
                {[fname, middleName, lname].filter(Boolean).join(' ') || '—'}
              </h3>
              <p className="avatar-email">{email || '—'}</p>
              <p className="avatar-role">{role}</p>
              <button
                className="btn-upload"
                onClick={() => setShowPhotoModal(true)}
                disabled={photoLoading}
              >
                {photoLoading ? 'Uploading…' : 'Change photo'}
              </button>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label className="field-label">First Name <span className="required">*</span></label>
              <input
                className="field-input"
                type="text"
                value={fname}
                onChange={e => setFname(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="field">
              <label className="field-label">Last Name <span className="required">*</span></label>
              <input
                className="field-input"
                type="text"
                value={lname}
                onChange={e => setLname(e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div className="field field-full">
              <label className="field-label">Middle Name</label>
              <input
                className="field-input"
                type="text"
                value={middleName}
                onChange={e => setMiddleName(e.target.value)}
                placeholder="Middle name (optional)"
              />
            </div>
          </div>

          <div className="card-actions">
            <button className="btn-secondary" onClick={() => window.location.reload()} disabled={profileLoading}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSaveProfile} disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* ── Contact Info Card ── */}
        <div className="profile-card">
          <div className="card-label">Contact Information</div>
          <div className="field-grid">
            <div className="field field-full">
              <label className="field-label">Email Address <span className="required">*</span></label>
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="field field-full">
              <label className="field-label">Contact Number <span className="required">*</span></label>
              <input
                className="field-input"
                type="tel"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
              />
            </div>
          </div>
          <div className="card-actions">
            <button className="btn-secondary" onClick={() => window.location.reload()} disabled={profileLoading}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSaveProfile} disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* ── Password Card ── */}
        <div className="profile-card">
          <div className="card-label">Password &amp; Security</div>
          {/*
            Wrapped in <form> so browsers/password managers recognise the
            password fields. Clear uses type="button" to avoid accidental submit.
          */}
          <form
            onSubmit={e => { e.preventDefault(); handlePasswordChange(); }}
            autoComplete="on"
          >
            <div className="field-grid">
              <div className="field field-full">
                <label className="field-label">Current Password</label>
                <input
                  className="field-input"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              <div className="field field-full">
                <label className="field-label">New Password</label>
                <input
                  className="field-input"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="field field-full">
                <label className="field-label">Confirm New Password</label>
                <input
                  className="field-input"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="password-hint">Password must be at least 8 characters.</div>
            <div className="card-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                disabled={passwordLoading}
              >
                Clear
              </button>
              <button type="submit" className="btn-primary" disabled={passwordLoading}>
                {passwordLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Account Details Card ── */}
        <div className="profile-card">
          <div className="card-label">Account Details</div>
          <div className="info-row">
            <span className="info-key">Account Status</span>
            <span className={`badge ${accountStatus === 'active' || accountStatus === 'approved' ? 'badge-success' : 'badge-warning'}`}>
              ● {accountStatus === 'approved' ? 'Active' : capitalize(accountStatus)}
            </span>
          </div>
          <div className="info-row">
            <span className="info-key">Role</span>
            <span className="info-value">{capitalize(role)}</span>
          </div>
          <div className="info-row info-row-last">
            <span className="info-key">Member Since</span>
            <span className="info-value">{formatDate(createdAt)}</span>
          </div>
        </div>
      </div>

      <UploadPhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onUpload={handlePhotoUpload}
      />

      {toast && <div className="profile-toast">{toast}</div>}
    </div>
  );
};

export default ProfileSetting;