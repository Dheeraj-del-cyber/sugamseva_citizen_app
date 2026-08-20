import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, User, Phone, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthScreen() {
  const { login, register, authError, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    let success = false;
    
    if (mode === 'login') {
      success = await login(phone, password);
    } else {
      success = await register(name, phone, password);
    }

    if (success) {
      navigate('/onboarding'); // Let protected route logic handle actual destination
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div className="flex-center" style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'var(--primary-100)', color: 'var(--primary-600)',
            margin: '0 auto 1rem auto' 
          }}>
            <ShieldCheck size={32} />
          </div>
          <h1 className="h2">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>
            {mode === 'login' 
              ? 'Sign in to access Sugam Seva services'
              : 'Join Sugam Seva to discover government schemes'}
          </p>
        </div>

        {authError && (
          <div style={{ 
            background: '#fef2f2', color: 'var(--danger)', 
            padding: '1rem', borderRadius: 'var(--radius-md)', 
            marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 
          }}>
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '2.75rem' }} 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Mobile Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)' }} />
              <input 
                type="tel" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }} 
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
            {isLoading ? <div className="spinner" /> : (mode === 'login' ? 'Sign In' : 'Sign Up')}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '2rem' }}>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); clearError(); }}
              style={{ color: 'var(--primary-600)', fontWeight: 600, background: 'none', border: 'none' }}
            >
              {mode === 'login' ? 'Register now' : 'Sign In'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
