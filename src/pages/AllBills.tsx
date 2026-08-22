import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash2, FileText, Search, Filter, Eye, Printer, Download, Image as ImageIcon, X } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, isThisYear, subMonths } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import InvoiceTemplate from '../components/InvoiceTemplate';

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
  shopName: string;
  address: string;
  phone?: string;
  date: string;
  grandTotal: number;
  createdAt: string;
  items: InvoiceItem[];
  transport: string;
  lrNo: string;
  globalBoxes: string;
  tax: number;
  hamali: number;
}

export default function AllBills() {
  const [bills, setBills] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, yesterday, week, month, 3months, 6months, year
  
  // Preview Modal
  const [previewBill, setPreviewBill] = useState<Invoice | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const fetchBills = async () => {
    setLoading(true);
    try {
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
      fetchBills();
    } catch (err) {
      console.error(err);
      alert('Failed to delete bill.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !previewBill) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${previewBill.shopName}-${previewBill.invoiceNo}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  const handleDownloadImage = async () => {
    if (!invoiceRef.current || !previewBill) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `Bill_${previewBill.invoiceNo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate Image', err);
    }
  };

  // Apply filters
  const filteredBills = bills.filter(bill => {
    // Text search
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      bill.invoiceNo?.toLowerCase().includes(searchLower) ||
      (bill.gbSlipNo && bill.gbSlipNo.toLowerCase().includes(searchLower)) ||
      bill.shopName?.toLowerCase().includes(searchLower);
      
    if (!matchesSearch) return false;
    
    // Date filter
    if (dateFilter === 'all') return true;
    
    if (!bill.date) return false;
    const billDate = new Date(bill.date);
    
    if (dateFilter === 'today') return isToday(billDate);
    if (dateFilter === 'yesterday') return isYesterday(billDate);
    if (dateFilter === 'week') return isThisWeek(billDate);
    if (dateFilter === 'month') return isThisMonth(billDate);
    
    const now = new Date();
    if (dateFilter === '3months') return billDate >= subMonths(now, 3);
    if (dateFilter === '6months') return billDate >= subMonths(now, 6);
    if (dateFilter === 'year') return isThisYear(billDate);
    
    return true;
  });

  if (loading) return <div>Loading bills...</div>;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h2>All Bills</h2>
      </div>

      <div className="card" style={{marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
        <div style={{flex: '1 1 300px', display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px'}}>
          <Search size={18} style={{color: 'var(--text-muted)', marginRight: '0.5rem'}} />
          <input 
            type="text" 
            placeholder="Search by Bill No, GB Slip, or Customer..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{border: 'none', background: 'transparent', outline: 'none', width: '100%'}}
          />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Filter size={18} style={{color: 'var(--text-muted)'}} />
          <select className="input-field" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{padding: '0.5rem'}}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Current Week</option>
            <option value="month">Current Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">Current Year</option>
          </select>
        </div>
      </div>

      <div className="card">
        {filteredBills.length === 0 ? (
          <div style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>
            <FileText size={48} style={{opacity: 0.5, marginBottom: '1rem'}} />
            <p>No bills found matching your criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="zebra-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill No.</th>
                  <th>GB Slip</th>
                  <th>Customer</th>
                  <th>Amount (₹)</th>
                  <th style={{width: '150px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id}>
                    <td>
                      {bill.date ? format(new Date(bill.date), 'dd MMM yyyy') : 'N/A'}
                    </td>
                    <td style={{fontWeight: 'bold'}}>{bill.invoiceNo}</td>
                    <td>{bill.gbSlipNo || '-'}</td>
                    <td>{bill.shopName}</td>
                    <td style={{fontWeight: 'bold', color: 'var(--success-color)'}}>
                      {bill.grandTotal ? bill.grandTotal.toLocaleString('en-IN', {maximumFractionDigits: 2}) : '0.00'}
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button className="btn btn-secondary" style={{padding: '0.4rem'}} onClick={() => setPreviewBill(bill)} title="Preview Bill">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-danger" style={{padding: '0.4rem'}} onClick={() => handleDelete(bill.id)} title="Delete Bill">
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

      {/* Preview Modal */}
      {previewBill && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '8px', 
            width: '100%', maxWidth: '900px', maxHeight: '90vh', 
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div className="no-print" style={{padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0}}>Preview Bill #{previewBill.invoiceNo}</h3>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <button className="btn btn-secondary" onClick={handlePrint} title="Print"><Printer size={18} /> Print</button>
                <button className="btn btn-secondary" onClick={handleDownloadImage} title="Download Image"><ImageIcon size={18} /> Image</button>
                <button className="btn btn-secondary" onClick={handleDownloadPDF} title="Download PDF"><Download size={18} /> PDF</button>
                <button className="btn btn-danger" style={{padding: '0.5rem'}} onClick={() => setPreviewBill(null)}><X size={18} /></button>
              </div>
            </div>
            
            {/* Modal Body / Invoice */}
            <div style={{overflowY: 'auto', padding: '2rem', background: '#f5f5f5'}} className="print-area">
              <div ref={invoiceRef} style={{background: 'white', margin: '0 auto', boxShadow: '0 0 10px rgba(0,0,0,0.1)'}}>
                <InvoiceTemplate 
                  shopName={previewBill.shopName}
                  phone={previewBill.phone || ''}
                  address={previewBill.address}
                  date={previewBill.date}
                  invoiceNo={previewBill.invoiceNo}
                  gbSlipNo={previewBill.gbSlipNo || ''}
                  transport={previewBill.transport}
                  lrNo={previewBill.lrNo}
                  globalBoxes={previewBill.globalBoxes}
                  items={previewBill.items}
                  tax={previewBill.tax}
                  hamali={previewBill.hamali}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
