import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  box: number;
  qty: number;
  rate: number;
  discount: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  gbSlipNo: string;
  date: string;
  grandTotal: number;
  items: InvoiceItem[];
  shopName: string;
  address: string;
  phone?: string;
  transport: string;
  lrNo: string;
  globalBoxes: string;
  tax: number;
  hamali: number;
}

export default function CustomerProfile() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all'); // all, 30days, 3months, 6months, 1year

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!id || !user) return;
      try {
        const custDoc = await getDoc(doc(db, 'customers', id));
        if (!custDoc.exists()) {
          setLoading(false);
          return;
        }
        
        const custData = { id: custDoc.id, ...custDoc.data() } as Customer;
        setCustomer(custData);

        // Fetch all invoices and filter locally for case-insensitivity
        const querySnapshot = await getDocs(query(collection(db, 'invoices')));
        const invs: Invoice[] = [];
        querySnapshot.forEach((doc) => {
          const invData = doc.data();
          if ((invData.shopName || '').toLowerCase().trim() === (custData.name || '').toLowerCase().trim()) {
            invs.push({ id: doc.id, ...invData } as Invoice);
          }
        });
        
        // Sort manually by date descending
        invs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setInvoices(invs);
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerData();
  }, [id, user]);

  if (loading) return <div>Loading customer profile...</div>;
  if (!customer) return <div>Customer not found.</div>;

  // Analytics Calculations
  const totalBills = invoices.length;
  const totalPurchase = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const avgBill = totalBills > 0 ? totalPurchase / totalBills : 0;
  const lastPurchase = invoices.length > 0 ? invoices[0].date : null;
  const firstPurchase = invoices.length > 0 ? invoices[invoices.length - 1].date : null;

  // Filter invoices by date
  const now = new Date();
  const filteredInvoices = invoices.filter(inv => {
    if (dateFilter === 'all') return true;
    const invDate = new Date(inv.date);
    const diffTime = Math.abs(now.getTime() - invDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (dateFilter === '30days') return diffDays <= 30;
    if (dateFilter === '3months') return diffDays <= 90;
    if (dateFilter === '6months') return diffDays <= 180;
    if (dateFilter === '1year') return diffDays <= 365;
    return true;
  });

  // Product Purchase Summary
  const productSummary: Record<string, { qty: number, total: number, lastDate: string }> = {};
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      const name = item.description;
      if (!productSummary[name]) {
        productSummary[name] = { qty: 0, total: 0, lastDate: inv.date };
      }
      productSummary[name].qty += item.qty;
      productSummary[name].total += item.amount;
      // Update last date if this invoice is newer
      if (new Date(inv.date) > new Date(productSummary[name].lastDate)) {
        productSummary[name].lastDate = inv.date;
      }
    });
  });
  const productsArray = Object.entries(productSummary).map(([name, stats]) => ({ name, ...stats }));
  productsArray.sort((a, b) => b.total - a.total); // Sort by highest spend

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
        <button className="btn btn-secondary" onClick={() => navigate('/app/customers')} style={{padding: '0.5rem'}}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{margin: 0}}>{customer.name}</h2>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
        <div className="card">
          <div style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>Total Purchase</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)'}}>
            ₹{totalPurchase.toLocaleString('en-IN', {maximumFractionDigits: 2})}
          </div>
        </div>
        <div className="card">
          <div style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>Total Bills</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{totalBills}</div>
        </div>
        <div className="card">
          <div style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>Average Bill</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>
            ₹{avgBill.toLocaleString('en-IN', {maximumFractionDigits: 2})}
          </div>
        </div>
        <div className="card">
          <div style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>First Purchase</div>
          <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>
            {firstPurchase ? format(new Date(firstPurchase), 'dd MMM yyyy') : '-'}
          </div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
        <div className="card" style={{borderTop: '4px solid var(--success-color)'}}>
          <h3 style={{margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase'}}>Total Purchase</h3>
          <p style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)', margin: '0.5rem 0 0'}}>₹{totalPurchase.toLocaleString('en-IN', {maximumFractionDigits: 2})}</p>
        </div>
        <div className="card" style={{borderTop: '4px solid var(--primary-color)'}}>
          <h3 style={{margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase'}}>Total Bills</h3>
          <p style={{fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0'}}>{totalBills}</p>
        </div>
        <div className="card" style={{borderTop: '4px solid var(--warning-color)'}}>
          <h3 style={{margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase'}}>Average Bill</h3>
          <p style={{fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0'}}>₹{avgBill.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
        </div>
        <div className="card" style={{borderTop: '4px solid var(--info-color)'}}>
          <h3 style={{margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase'}}>Last Purchase</h3>
          <p style={{fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0 0'}}>
            {lastPurchase ? format(new Date(lastPurchase), 'dd MMM yyyy') : '-'}
          </p>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem'}}>
        <div className="card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3 style={{margin: 0, color: 'var(--primary-color)'}}>Purchase History</h3>
            <select className="input-field" style={{width: 'auto', padding: '0.4rem'}} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="year">Last 1 Year</option>
            </select>
          </div>
          
          <div className="table-responsive">
            <table className="zebra-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill No</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{textAlign: 'center', padding: '2rem'}}>No bills found for this period.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{format(new Date(inv.date), 'dd MMM yyyy')}</td>
                      <td style={{fontWeight: 'bold'}}>{inv.invoiceNo}</td>
                      <td style={{color: 'var(--success-color)', fontWeight: 'bold'}}>
                        {inv.grandTotal.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{margin: '0 0 1.5rem 0', color: 'var(--primary-color)'}}>Top Products Purchased</h3>
          <div className="table-responsive">
            <table className="zebra-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{textAlign: 'right'}}>Qty</th>
                  <th style={{textAlign: 'right'}}>Total Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                {productsArray.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{textAlign: 'center', padding: '2rem'}}>No product data found.</td>
                  </tr>
                ) : (
                  productsArray.map((prod, i) => (
                    <tr key={i}>
                      <td style={{fontWeight: 'bold'}}>{prod.name}</td>
                      <td style={{textAlign: 'right'}}>{prod.qty}</td>
                      <td style={{textAlign: 'right', color: 'var(--success-color)'}}>
                        {prod.total.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
