import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'M/S P.RANGANATH',
    address: 'CHIRALA',
    phone: '',
    email: '',
    terms: '**No Replacement for Glass Items and all Fittings Damage on Tranpost**',
    invoicePrefix: 'NO:'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'company_settings', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'company_settings', user.uid), settings, { merge: true });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSyncData = async () => {
    if (!user) return;
    if (!confirm('This will scan all your past bills and automatically add any missing customers and products to your master lists. Proceed?')) return;
    setSyncing(true);
    try {
      const [invSnap, custSnap, prodSnap] = await Promise.all([
        getDocs(query(collection(db, 'invoices'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'customers'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'products'), where('userId', '==', user.uid)))
      ]);

      const existingCustomers = new Set(custSnap.docs.map(d => d.data().name.toLowerCase().trim()));
      const existingProducts = new Set(prodSnap.docs.map(d => d.data().name.toLowerCase().trim()));

      let addedCusts = 0;
      let addedProds = 0;

      for (const invDoc of invSnap.docs) {
        const data = invDoc.data();
        
        // Check customer
        if (data.shopName && data.shopName.trim()) {
          const cName = data.shopName.trim();
          if (!existingCustomers.has(cName.toLowerCase())) {
            await addDoc(collection(db, 'customers'), {
              name: cName,
              phone: data.phone || '',
              address: data.address || '',
              userId: user.uid
            });
            existingCustomers.add(cName.toLowerCase());
            addedCusts++;
          }
        }

        // Check products
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            if (item.description && item.description.trim()) {
              const pName = item.description.trim();
              if (!existingProducts.has(pName.toLowerCase())) {
                await addDoc(collection(db, 'products'), {
                  name: pName,
                  rate: Number(item.rate) || 0,
                  userId: user.uid
                });
                existingProducts.add(pName.toLowerCase());
                addedProds++;
              }
            }
          }
        }
      }

      alert(`Sync Complete! Added ${addedCusts} missing customers and ${addedProds} missing products from your past bills.`);
    } catch (err) {
      console.error(err);
      alert('Failed to sync data.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div>
      <h2 style={{marginBottom: '2rem'}}>Company Settings</h2>
      
      <div className="card" style={{maxWidth: '600px'}}>
        <form onSubmit={handleSave} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
          
          <div>
            <label className="label">Company / Shop Name</label>
            <input className="input-field" name="companyName" value={settings.companyName} onChange={handleChange} required />
          </div>
          
          <div>
            <label className="label">Address / Location</label>
            <input className="input-field" name="address" value={settings.address} onChange={handleChange} required />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input className="input-field" name="phone" value={settings.phone} onChange={handleChange} />
          </div>

          <div>
            <label className="label">Email Address</label>
            <input className="input-field" name="email" value={settings.email} onChange={handleChange} />
          </div>

          <div>
            <label className="label">Invoice Prefix</label>
            <input className="input-field" name="invoicePrefix" value={settings.invoicePrefix} onChange={handleChange} />
          </div>

          <div>
            <label className="label">Terms & Conditions (Printed on Bill)</label>
            <textarea className="input-field" name="terms" value={settings.terms} onChange={handleChange} rows={3}></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{marginTop: '1rem'}} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      <div className="card" style={{maxWidth: '600px', marginTop: '2rem'}}>
        <h3 style={{marginTop: 0, color: 'var(--text-color)'}}>Data Management</h3>
        <p style={{color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem'}}>
          Scan your past bills and automatically add any missing customers and products to your master lists.
        </p>
        <button className="btn btn-secondary" onClick={handleSyncData} disabled={syncing}>
          {syncing ? 'Scanning & Syncing...' : 'Sync Past Data from Bills'}
        </button>
      </div>
    </div>
  );
}
