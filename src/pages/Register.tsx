import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import styles from './Login.module.css'; // Reusing Login styles for consistency

export default function Register() {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save user details to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        companyName,
        phone,
        email,
        createdAt: new Date().toISOString()
      });
      
      // Also save to company settings initially
      await setDoc(doc(db, 'company_settings', 'default'), {
        companyName,
        phone,
        email,
        address: '',
        gst: ''
      }, { merge: true });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h2>Create Account</h2>
          <p>Sign up to start billing</p>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.formGroup}>
            <label className="label">Full Name</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className="label">Company Name</label>
            <input className="input-field" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className="label">Phone Number</label>
            <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className="label">Email Address</label>
            <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className="label">Password</label>
            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem', padding: '0.75rem'}} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
          
          <div style={{textAlign: 'center', marginTop: '1rem'}}>
            <Link to="/login" style={{color: 'var(--primary-color)'}}>Already have an account? Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
