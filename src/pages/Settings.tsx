import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      try {
        const docRef = doc(db, 'company_settings', 'default');
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
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'company_settings', 'default'), settings, { merge: true });
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
    </div>
  );
}
