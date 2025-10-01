import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  role: string;
  createdAt: string;
}

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      navigate('/signin');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    authService.signOut();
    navigate('/signin');
  };

  if (loading) {
    return (
      <div className="auth-container">
        <p style={{ textAlign: 'center' }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Welcome to TaskFlow Dashboard</h1>
        <button
          onClick={handleSignOut}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Your Profile</h2>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <strong>Name:</strong> {user.firstName} {user.lastName}
          </div>

          <div>
            <strong>Email:</strong> {user.email}
            {user.isEmailVerified ? (
              <span style={{ color: '#28a745', marginLeft: '0.5rem' }}>✓ Verified</span>
            ) : (
              <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>⚠ Not Verified</span>
            )}
          </div>

          <div>
            <strong>Role:</strong> {user.role}
          </div>

          <div>
            <strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>

        {!user.isEmailVerified && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px'
          }}>
            <p style={{ margin: 0, color: '#856404' }}>
              Please verify your email address to access all features.
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Quick Actions</h2>
        <p style={{ color: '#666' }}>
          Your TaskFlow workspace is ready! This is where you'll manage your tasks and projects.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;