import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Printer, Download, Save } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { doc, getDoc, getDocs, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import InvoiceTemplate from '../components/InvoiceTemplate';
import styles from './CreateBill.module.css';

interface InvoiceItem {
  id: string;
  description: string;
  box: number;
  qty: number;
  rate: number;
  discount: number;
}

interface Customer {
  id: string;
  name: string;
  address: string;
}

export default function CreateBill() {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Custom header fields (Editable per bill)
  const [shopName, setShopName] = useState('M/S P.RANGANATH');
  const [address, setAddress] = useState('CHIRALA');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('1173');
  const [transport, setTransport] = useState('VALI LORRY');
  const [lrNo, setLrNo] = useState('');
  const [globalBoxes, setGlobalBoxes] = useState('2 G/B');
  const [terms, setTerms] = useState('**No Replacement for Glass Items and all Fittings Damage on Tranpost**');
  const [isSaving, setIsSaving] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Settings
        const docSnap = await getDoc(doc(db, 'company_settings', 'default'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.companyName) setShopName(data.companyName);
          if (data.address) setAddress(data.address);
          if (data.terms) setTerms(data.terms);
        }
        
        // Fetch Customers
        const custSnap = await getDocs(collection(db, 'customers'));
        const custList: Customer[] = [];
        custSnap.forEach(cDoc => custList.push({ id: cDoc.id, ...cDoc.data() } as Customer));
        setCustomers(custList);
        
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    
    const customer = customers.find(c => c.id === selectedId);
    if (customer) {
      setShopName(customer.name);
      setAddress(customer.address || '');
    }
  };
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'GI TOP LIGHT PIPES "1" 5FT', box: 1, qty: 30, rate: 175, discount: 0 },
    { id: '2', description: 'ANCHOR ""10"" HOOKES', box: 4, qty: 100, rate: 15, discount: 0 },
  ]);

  const [tax, setTax] = useState(0);
  const [hamali, setHamali] = useState(120);
  
  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', box: 0, qty: 0, rate: 0, discount: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${shopName}-${invoiceNo}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  const handleSaveBill = async () => {
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    
    setIsSaving(true);
    try {
      const processedItems = items.map(item => {
        const gross = item.qty * item.rate;
        const discountAmt = (gross * item.discount) / 100;
        return {
          ...item,
          gross,
          amount: gross - discountAmt
        };
      });
      
      const totalAmountBeforeExtras = processedItems.reduce((sum, item) => sum + item.amount, 0);
      const grandTotal = totalAmountBeforeExtras + tax + hamali;
      
      await addDoc(collection(db, 'invoices'), {
        shopName,
        address,
        date,
        invoiceNo,
        transport,
        lrNo,
        globalBoxes,
        terms,
        items: processedItems,
        tax,
        hamali,
        grandTotal,
        createdAt: new Date().toISOString()
      });
      alert('Bill saved successfully!');
      navigate('/bills'); // Redirect to All Bills page
    } catch (err) {
      console.error(err);
      alert('Failed to save bill');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Editor Section (Hidden on Print) */}
      <div className={`card ${styles.editorSection} no-print`}>
        <div className={styles.header}>
          <h2>Create New Bill</h2>
          <div className={styles.actions}>
            <button className="btn btn-secondary" onClick={handlePrint}><Printer size={18} /> Print</button>
            <button className="btn btn-secondary" onClick={handleDownloadPDF}><Download size={18} /> PDF</button>
            <button className="btn btn-primary" onClick={handleSaveBill} disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Saving...' : 'Save Bill'}
            </button>
          </div>
        </div>

        <div className={styles.grid2}>
          <div>
            <label className="label" style={{display: 'flex', justifyContent: 'space-between'}}>
              Customer / Shop Name
              {customers.length > 0 && (
                <select 
                  onChange={handleCustomerSelect} 
                  style={{fontSize: '0.8rem', padding: '2px', marginLeft: '10px', borderRadius: '4px'}}
                >
                  <option value="">Load Saved Customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </label>
            <input className="input-field" value={shopName} onChange={e => setShopName(e.target.value)} />
          </div>
          <div>
            <label className="label">Address / Location</label>
            <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </div>

        <div className={styles.formGrid}>
          <div>
            <label className="label">Invoice No.</label>
            <input className="input-field" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Transport</label>
            <input className="input-field" value={transport} onChange={e => setTransport(e.target.value)} />
          </div>
          <div>
            <label className="label">LR No.</label>
            <input className="input-field" value={lrNo} onChange={e => setLrNo(e.target.value)} />
          </div>
          <div>
            <label className="label">No of Boxes (Header)</label>
            <input className="input-field" value={globalBoxes} onChange={e => setGlobalBoxes(e.target.value)} />
          </div>
        </div>

        <div className={styles.itemsSection}>
          <h3>Items</h3>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ width: '80px' }}>Box</th>
                <th style={{ width: '100px' }}>Qty</th>
                <th style={{ width: '120px' }}>Rate</th>
                <th style={{ width: '80px' }}>Dis %</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input className="input-field" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" className="input-field" value={item.box} onChange={e => updateItem(item.id, 'box', Number(e.target.value))} />
                  </td>
                  <td>
                    <input type="number" className="input-field" value={item.qty} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} />
                  </td>
                  <td>
                    <input type="number" className="input-field" value={item.rate} onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} />
                  </td>
                  <td>
                    <input type="number" className="input-field" value={item.discount} onChange={e => updateItem(item.id, 'discount', Number(e.target.value))} />
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{padding: '0.5rem'}} onClick={() => removeItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-secondary" style={{marginTop: '1rem'}} onClick={addItem}>
            <Plus size={18} /> Add Item
          </button>
        </div>

        <div className={styles.totalsEditor}>
          <div>
            <label className="label">Tax (₹)</label>
            <input type="number" className="input-field" value={tax} onChange={e => setTax(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Hamali (₹)</label>
            <input type="number" className="input-field" value={hamali} onChange={e => setHamali(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Invoice Preview Section */}
      <div className={styles.previewSection}>
        <div ref={invoiceRef} className={styles.invoiceWrapper}>
          <InvoiceTemplate 
            shopName={shopName}
            address={address}
            date={date}
            invoiceNo={invoiceNo}
            transport={transport}
            lrNo={lrNo}
            globalBoxes={globalBoxes}
            items={items}
            tax={tax}
            hamali={hamali}
          />
        </div>
      </div>
    </div>
  );
}
