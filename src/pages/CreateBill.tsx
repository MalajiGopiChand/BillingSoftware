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
  phone: string;
}

interface Product {
  id: string;
  name: string;
  rate: number;
}

export default function CreateBill() {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Custom header fields (Editable per bill)
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [gbSlipNo, setGbSlipNo] = useState('');
  const [transport, setTransport] = useState('');
  const [lrNo, setLrNo] = useState('');
  const [globalBoxes, setGlobalBoxes] = useState('');
  const [terms, setTerms] = useState('**No Replacement for Glass Items and all Fittings Damage on Tranpost**');
  const [isSaving, setIsSaving] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Autocomplete states
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const resetForm = () => {
    setShopName('');
    setPhone('');
    setAddress('');
    setInvoiceNo('');
    setGbSlipNo('');
    setTransport('');
    setLrNo('');
    setGlobalBoxes('');
    setCustomerSearch('');
    setItems([]);
    setTax(0);
    setHamali(0);
  };

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
        
        // Fetch Products
        const prodSnap = await getDocs(collection(db, 'products'));
        const prodList: Product[] = [];
        prodSnap.forEach(pDoc => prodList.push({ id: pDoc.id, ...pDoc.data() } as Product));
        setProducts(prodList);
        
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    setShopName(customer.name);
    setCustomerSearch(customer.name);
    setPhone(customer.phone || '');
    setAddress(customer.address || '');
    setShowCustomerDropdown(false);
  };
  
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const [tax, setTax] = useState(0);
  const [hamali, setHamali] = useState(0);
  const [hamaliLabel, setHamaliLabel] = useState('HAMALI');
  
  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', box: 0, qty: 0, rate: 0, discount: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Auto-fill rate if description exactly matches a product
        if (field === 'description') {
          const matchedProduct = products.find(p => p.name.toLowerCase() === String(value).toLowerCase());
          if (matchedProduct) {
            updatedItem.rate = matchedProduct.rate;
          }
        }
        return updatedItem;
      }
      return item;
    }));
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
        phone,
        address,
        date,
        invoiceNo,
        gbSlipNo,
        transport,
        lrNo,
        globalBoxes,
        terms,
        items: processedItems,
        tax,
        hamali,
        hamaliLabel,
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
            <button className="btn btn-secondary" onClick={resetForm}><Plus size={18} /> New Bill</button>
            <button className="btn btn-secondary" onClick={handlePrint}><Printer size={18} /> Print</button>
            <button className="btn btn-secondary" onClick={handleDownloadPDF}><Download size={18} /> PDF</button>
            <button className="btn btn-primary" onClick={handleSaveBill} disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Saving...' : 'Save Bill'}
            </button>
          </div>
        </div>

        <div className={styles.grid2}>
          <div style={{position: 'relative'}}>
            <label className="label">Customer / Shop Name</label>
            <input 
              className="input-field" 
              value={customerSearch} 
              onChange={e => {
                setCustomerSearch(e.target.value);
                setShopName(e.target.value); // Sync manual typing
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
              placeholder="Type to search customers..."
            />
            {showCustomerDropdown && customerSearch && (
              <div style={{position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', zIndex: 100, maxHeight: '200px', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-md)'}}>
                {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                  <div 
                    key={c.id} 
                    style={{padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)'}}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevents input onBlur from firing first
                      handleCustomerSelect(c);
                    }}
                  >
                    <div style={{fontWeight: 'bold'}}>{c.name}</div>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{c.phone} - {c.address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} />
          </div>
          <div style={{gridColumn: '1 / -1'}}>
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
            <label className="label">GB Slip No.</label>
            <input className="input-field" value={gbSlipNo} onChange={e => setGbSlipNo(e.target.value)} />
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
          <div style={{gridColumn: '1 / -1'}}>
            <label className="label">Terms & Conditions</label>
            <input className="input-field" value={terms} onChange={e => setTerms(e.target.value)} />
          </div>
        </div>

        <div className={styles.itemsSection}>
          <h3 style={{color: 'var(--primary-color)', marginBottom: '1rem'}}>Items</h3>
          <div className="table-responsive">
            <table className="zebra-table" style={{minWidth: '600px'}}>
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
                    <td style={{position: 'relative'}}>
                      <input 
                        className="input-field" 
                        value={item.description} 
                        onChange={e => updateItem(item.id, 'description', e.target.value)} 
                        list="product-list"
                      />
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
                      <button className="btn btn-danger" style={{padding: '0.4rem'}} onClick={() => removeItem(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <datalist id="product-list">
            {products.map(p => <option key={p.id} value={p.name} />)}
          </datalist>
          <button className="btn btn-secondary" style={{marginTop: '1rem'}} onClick={addItem}>
            <Plus size={18} /> Add Item
          </button>
        </div>

        <div className={styles.totalsEditor}>
          <div style={{display: 'flex', gap: '1rem'}}>
            <div>
              <label className="label">Tax (₹)</label>
              <input type="number" className="input-field" value={tax} onChange={e => setTax(Number(e.target.value))} />
            </div>
            <div>
              <input 
                className="input-field" 
                style={{padding: '0 0.5rem', marginBottom: '0.25rem', fontWeight: '500', width: '150px'}} 
                value={hamaliLabel} 
                onChange={e => setHamaliLabel(e.target.value)} 
              />
              <input type="number" className="input-field" style={{width: '150px'}} value={hamali} onChange={e => setHamali(Number(e.target.value))} />
            </div>
          </div>
          
          <div style={{
            background: 'var(--success-light)',
            border: '2px solid var(--success-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.5rem',
            textAlign: 'right',
            minWidth: '250px'
          }}>
            <div style={{color: 'var(--success-hover)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase'}}>Grand Total</div>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)'}}>
              ₹{(items.reduce((sum, item) => sum + (item.qty * item.rate) - ((item.qty * item.rate * item.discount) / 100), 0) + tax + hamali).toLocaleString('en-IN', {maximumFractionDigits: 2})}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Preview Section */}
      <div className={styles.previewSection}>
        <div ref={invoiceRef} className={styles.invoiceWrapper}>
          <InvoiceTemplate 
            shopName={shopName}
            phone={phone}
            address={address}
            date={date}
            invoiceNo={invoiceNo}
            gbSlipNo={gbSlipNo}
            transport={transport}
            lrNo={lrNo}
            globalBoxes={globalBoxes}
            terms={terms}
            items={items}
            tax={tax}
            hamali={hamali}
            hamaliLabel={hamaliLabel}
          />
        </div>
      </div>
    </div>
  );
}
