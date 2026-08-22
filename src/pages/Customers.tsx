import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface CustomerWithStats extends Customer {
  totalBills: number;
  totalPurchase: number;
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const custSnapshot = await getDocs(collection(db, 'customers'));
      const invSnapshot = await getDocs(collection(db, 'invoices'));
      
      const invoices = invSnapshot.docs.map(doc => doc.data());
      
      const custs: CustomerWithStats[] = [];
      custSnapshot.forEach((doc) => {
        const data = doc.data() as Customer;
        
        // Calculate stats for this customer
        const customerInvoices = invoices.filter(inv => inv.shopName === data.name);
        const totalBills = customerInvoices.length;
        const totalPurchase = customerInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        
        custs.push({ 
          ...data,
          id: doc.id,
          totalBills,
          totalPurchase
        });
      });
      setCustomers(custs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
      await addDoc(collection(db, 'customers'), {
        name: newName,
        address: newAddress,
        phone: newPhone
      });
      setNewName('');
      setNewAddress('');
      setNewPhone('');
      setShowAdd(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert('Failed to save customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? This will NOT delete their historical bills.')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert('Failed to delete customer');
    }
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
        <h2>Customers</h2>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{marginBottom: '2rem'}}>
          <h3>Add Regular Customer</h3>
          <form onSubmit={handleAdd} style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem'}}>
            <div style={{flex: '1 1 200px'}}>
              <label className="label">Customer / Shop Name</label>
              <input className="input-field" value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>
            <div style={{flex: '1 1 200px'}}>
              <label className="label">Address / Location</label>
              <input className="input-field" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
            </div>
            <div style={{flex: '1 1 200px'}}>
              <label className="label">Phone Number</label>
              <input type="tel" className="input-field" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', flex: '1 1 100%'}}>
              <button type="submit" className="btn btn-primary">Save Customer</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p>Loading customers...</p>
        ) : customers.length === 0 ? (
          <p>No customers found. Add your regular customers here for quick billing.</p>
        ) : (
          <div className="table-responsive">
            <table className="zebra-table">
              <thead>
                <tr>
                  <th style={{padding: '0.75rem'}}>Name</th>
                  <th style={{padding: '0.75rem'}}>Address</th>
                  <th style={{padding: '0.75rem'}}>Phone</th>
                  <th style={{padding: '0.75rem'}}>Total Bills</th>
                  <th style={{padding: '0.75rem'}}>Total Purchase</th>
                  <th style={{width: '120px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td style={{fontWeight: 'bold'}}>{customer.name}</td>
                    <td>{customer.address || '-'}</td>
                    <td>{customer.phone || '-'}</td>
                    <td>{customer.totalBills}</td>
                    <td style={{color: 'var(--success-color)'}}>
                      ₹{customer.totalPurchase.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button className="btn btn-secondary" style={{padding: '0.5rem'}} onClick={() => navigate(`/customers/${customer.id}`)} title="View Details">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-danger" style={{padding: '0.5rem'}} onClick={() => handleDelete(customer.id)} title="Delete Customer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
