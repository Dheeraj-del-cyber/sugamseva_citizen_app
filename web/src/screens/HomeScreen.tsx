// React import removed due to verbatimModuleSyntax
import { ArrowRight, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', borderRadius: 'var(--radius-lg)', padding: '2.5rem', color: 'white', marginBottom: '2rem', boxShadow: 'var(--shadow-md)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="h2" style={{ color: 'white', marginBottom: '0.5rem' }}>Welcome back, {user?.name?.split(' ')[0] || 'Citizen'} 👋</h1>
          <p style={{ opacity: 0.9, maxWidth: '500px', marginBottom: '2rem', fontSize: '1.125rem' }}>
            Discover and apply for government schemes tailored to your profile.
          </p>
          <button className="btn-primary" style={{ background: 'white', color: 'var(--primary-700)' }}>
            Discover Schemes
            <ArrowRight size={18} />
          </button>
        </div>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', right: '-5%', top: '-20%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Stats Card 1 */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--surface-500)' }}>Active Applications</h3>
            <div style={{ background: 'var(--primary-50)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <FileText size={20} color="var(--primary-600)" />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>2</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--surface-500)', marginTop: '0.5rem' }}>1 pending review</p>
        </div>

        {/* Stats Card 2 */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--surface-500)' }}>Approved Schemes</h3>
            <div style={{ background: '#ecfdf5', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={20} color="var(--success)" />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>1</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--surface-500)', marginTop: '0.5rem' }}>PM Kisan Samman Nidhi</p>
        </div>

        {/* Action Needed */}
        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid #fef3c7', background: '#fffbeb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#b45309' }}>Action Required</h3>
            <div style={{ background: '#fef3c7', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <AlertCircle size={20} color="var(--warning)" />
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '1rem' }}>Your Aadhaar card document is missing. Please upload it to apply for schemes.</p>
          <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', width: '100%', background: '#b45309' }}>Upload Document</button>
        </div>

      </div>

      <h2 className="h3" style={{ marginBottom: '1rem' }}>Recommended for you</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Pradhan Mantri Awas Yojana</h4>
              <p style={{ color: 'var(--surface-500)', fontSize: '0.875rem' }}>Housing scheme for eligible citizens.</p>
            </div>
            <button className="btn-secondary">View Details</button>
          </div>
        ))}
      </div>
      
    </div>
  );
}
