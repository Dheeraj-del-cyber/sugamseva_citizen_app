import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, Search, Bell, Home, Compass, FileText, User } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '280px', backgroundColor: 'var(--surface-900)', color: 'white', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <div style={{ background: 'var(--primary-600)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <ShieldCheck size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Sugam Seva</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {[
            { icon: Home, label: 'Dashboard', active: true },
            { icon: Compass, label: 'Discover Schemes', active: false },
            { icon: FileText, label: 'My Applications', active: false },
            { icon: User, label: 'Profile & Documents', active: false },
          ].map((item, i) => (
            <button key={i} style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', 
              padding: '1rem', borderRadius: 'var(--radius-md)', 
              color: item.active ? 'white' : 'var(--surface-400)',
              backgroundColor: item.active ? 'var(--surface-800)' : 'transparent',
              fontWeight: 500, textAlign: 'left', transition: 'all 0.2s'
            }}>
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--surface-800)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name || 'Citizen'}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--surface-400)' }}>{user?.phone}</p>
            </div>
          </div>
          <button onClick={logout} style={{ color: 'var(--surface-400)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Navbar */}
        <header style={{ height: '80px', background: 'white', borderBottom: '1px solid var(--surface-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--surface-400)' }} />
            <input type="text" placeholder="Search schemes, services..." style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--surface-200)', background: 'var(--surface-50)' }} />
          </div>
          <button style={{ position: 'relative', padding: '0.5rem', color: 'var(--surface-500)', background: 'var(--surface-100)', borderRadius: '50%' }}>
            <Bell size={20} />
            <span style={{ position: 'absolute', top: '0', right: '0', width: '10px', height: '10px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }} />
          </button>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
