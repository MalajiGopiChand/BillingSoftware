import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Package, Settings as SettingsIcon, LogOut, FilePlus2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h2>BillingPro</h2>
        </div>
        <nav className={styles.nav}>
          <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} end>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/create-bill" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <FilePlus2 size={20} /> Create New Bill
          </NavLink>
          <NavLink to="/bills" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <FileText size={20} /> All Bills
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <Users size={20} /> Customers
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <Package size={20} /> Products
          </NavLink>
          <div className={styles.divider} />
          <NavLink to="/settings" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <SettingsIcon size={20} /> Company Settings
          </NavLink>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
