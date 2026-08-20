import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, CheckCircle2, UploadCloud, Camera, Check } from 'lucide-react';

export default function OnboardingScreen() {
  const { user, updateProfile, markOnboardingComplete, isLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [documents, setDocuments] = useState<{ id: string, name: string, uri: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile({ name, email });
    if (success) setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setDocuments(prev => [...prev, { id: Date.now().toString(), name: file.name, uri: url }]);
    }
  };

  const finishOnboarding = async () => {
    await markOnboardingComplete();
    navigate('/');
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '3rem' }}>
        
        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
            {step > 1 ? <Check size={18} /> : '1'}
          </div>
          <div className={`step-line ${step > 1 ? 'done' : ''}`} />
          <div className={`step-dot ${step === 2 ? 'active' : ''}`}>2</div>
        </div>

        {step === 1 ? (
          <div className="animate-fade-in">
            <h2 className="h2 text-center" style={{ marginBottom: '0.5rem' }}>Personal Details</h2>
            <p className="text-muted text-center" style={{ marginBottom: '2rem' }}>
              Confirm your details to personalize your experience.
            </p>

            <form onSubmit={handleSaveDetails}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)' }} />
                  <input type="text" className="input-field" style={{ paddingLeft: '2.75rem' }} value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)' }} />
                  <input type="email" className="input-field" style={{ paddingLeft: '2.75rem' }} value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)' }} />
                  <input type="text" className="input-field" style={{ paddingLeft: '2.75rem', backgroundColor: 'var(--surface-100)', color: 'var(--surface-500)' }} value={user?.phone} readOnly />
                  <Lock size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--surface-400)' }}>Linked to Aadhaar and cannot be changed.</p>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={isLoading}>
                {isLoading ? <div className="spinner" /> : 'Save & Continue'}
              </button>
            </form>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h2 className="h2 text-center" style={{ marginBottom: '0.5rem' }}>Upload Documents</h2>
            <p className="text-muted text-center" style={{ marginBottom: '2rem' }}>
              Add your ID documents to find government schemes.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ flexDirection: 'column', padding: '1.5rem', gap: '1rem' }}>
                <UploadCloud size={32} color="var(--primary-500)" />
                <span>Upload File</span>
              </button>
              
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ flexDirection: 'column', padding: '1.5rem', gap: '1rem' }}>
                <Camera size={32} color="var(--primary-500)" />
                <span>Camera</span>
              </button>
              
              {/* Hidden file input handling both camera and files */}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
            </div>

            {documents.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--surface-500)', marginBottom: '1rem', textTransform: 'uppercase' }}>Uploaded</h4>
                {documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid var(--surface-200)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                    <img src={doc.uri} alt="doc" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginRight: '1rem' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600 }}>{doc.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Uploaded</p>
                    </div>
                    <CheckCircle2 color="var(--success)" />
                  </div>
                ))}
              </div>
            )}

            <button onClick={finishOnboarding} className="btn-primary" style={{ width: '100%' }}>
              {documents.length > 0 ? 'Finish Setup' : 'Skip & Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
