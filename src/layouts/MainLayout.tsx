import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings as SettingsIcon, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={styles.layout}>
      
      {/* Mobile Overlay */}
      <div 
        className={`${styles.overlay} ${sidebarOpen ? styles.open : ''}`} 
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.logo}>
          <h2 style={{color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <img src="/logo.jpg" alt="Billora Logo" width="28" height="28" style={{borderRadius: '6px'}} />
            Billora
          </h2>
          <button className={styles.closeBtn} onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>
        
        <nav className={styles.nav}>
          <NavLink to="/app" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} end onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/app/create-bill" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} onClick={closeSidebar}>
            <FileText size={20} />
            <span>Create Bill</span>
          </NavLink>
          <NavLink to="/app/bills" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} onClick={closeSidebar}>
            <FileText size={20} />
            <span>All Bills</span>
          </NavLink>
          
          <div className={styles.divider}></div>
          
          <NavLink to="/app/customers" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} onClick={closeSidebar}>
            <Users size={20} />
            <span>Customers</span>
          </NavLink>
          <NavLink to="/app/products" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} onClick={closeSidebar}>
            <Package size={20} />
            <span>Products</span>
          </NavLink>
          
          <div className={styles.divider}></div>
          
          <NavLink to="/app/settings" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} onClick={closeSidebar}>
            <SettingsIcon size={20} />
            <span>Settings</span>
          </NavLink>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className={styles.mobileHeader}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <img src="/logo.jpg" alt="Billora Logo" width="28" height="28" style={{borderRadius: '6px'}} />
            <h2 style={{margin: 0, fontSize: '1.25rem'}}>Billora</h2>
          </div>
          <button className={styles.hamburger} onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
        </div>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
