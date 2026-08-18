import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoiceNo: string;
  shopName: string;
  date: string;
  grandTotal: number;
  createdAt: string;
}

export default function AllBills() {
  const [bills, setBills] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    setLoading(true);
    try {
      // Order by creation time descending (newest first)
      const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedBills: Invoice[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBills.push({ id: doc.id, ...doc.data() } as Invoice);
      });
      setBills(fetchedBills);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'invoices', id));
      fetchBills(); // Refresh list after deletion
    } catch (err) {
      console.error(err);
      alert('Failed to delete bill.');
    }
  };

  if (loading) return <div>Loading bills...</div>;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
        <h2>All Bills</h2>
      </div>

      <div className="card">
        {bills.length === 0 ? (
          <div style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>
            <FileText size={48} style={{opacity: 0.5, marginBottom: '1rem'}} />
            <p>No bills found. Create a new bill to see it here.</p>
          </div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px'}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                  <th style={{padding: '1rem', background: 'var(--bg-secondary)'}}>Date</th>
                  <th style={{padding: '1rem', background: 'var(--bg-secondary)'}}>Invoice No.</th>
                  <th style={{padding: '1rem', background: 'var(--bg-secondary)'}}>Shop Name</th>
                  <th style={{padding: '1rem', background: 'var(--bg-secondary)'}}>Amount (₹)</th>
                  <th style={{padding: '1rem', background: 'var(--bg-secondary)', width: '100px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} style={{borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s'}} className="hover-bg">
                    <td style={{padding: '1rem'}}>
                      {bill.date ? format(new Date(bill.date), 'dd MMM yyyy') : 'N/A'}
                    </td>
                    <td style={{padding: '1rem', fontWeight: 'bold'}}>{bill.invoiceNo}</td>
                    <td style={{padding: '1rem'}}>{bill.shopName}</td>
                    <td style={{padding: '1rem', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                      {bill.grandTotal ? bill.grandTotal.toLocaleString('en-IN', {maximumFractionDigits: 2}) : '0.00'}
                    </td>
                    <td style={{padding: '1rem'}}>
                      <button 
                        className="btn btn-danger" 
                        style={{padding: '0.5rem'}} 
                        onClick={() => handleDelete(bill.id)}
                        title="Delete Bill"
                      >
                        <Trash2 size={16} />
                      </button>
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
