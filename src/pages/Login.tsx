import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h2>Billora</h2>
          <p>Sign in to manage your business</p>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label className="label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className="label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem', padding: '0.75rem'}}>
            Sign In
          </button>
          
          <div style={{textAlign: 'center', marginTop: '1rem'}}>
            <Link to="/register" style={{color: 'var(--primary-color)'}}>Don't have an account? Create one</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
