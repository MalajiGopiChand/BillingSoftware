import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { FileText, DollarSign, TrendingUp, Users, Package, Plus } from 'lucide-react';
import { format, subDays, startOfMonth, isAfter, subMonths, startOfYear } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  shopName: string;
  date: string;
  grandTotal: number;
  items: InvoiceItem[];
}


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [trendFilter, setTrendFilter] = useState('30days'); // 7days, 30days, thisMonth, 3months, 6months, thisYear

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch Invoices
        const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
        const invSnapshot = await getDocs(q);
        const invList: Invoice[] = [];
        invSnapshot.forEach(doc => invList.push({ id: doc.id, ...doc.data() } as Invoice));
        invList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setInvoices(invList);

        // Fetch Counts
        const custSnap = await getDocs(query(collection(db, 'customers'), where('userId', '==', user.uid)));
        setCustomersCount(custSnap.size);
        
        const prodSnap = await getDocs(query(collection(db, 'products'), where('userId', '==', user.uid)));
        setProductsCount(prodSnap.size);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    } else {
      setInvoices([]);
      setCustomersCount(0);
      setProductsCount(0);
      setLoading(false);
    }
  }, [user]);

  // --- STATS CALCULATIONS ---
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const startOfThisMonth = startOfMonth(now);
  
  let totalSales = 0;
  let todaySales = 0;
  let thisMonthSales = 0;
  
  invoices.forEach(inv => {
    totalSales += inv.grandTotal;
    if (inv.date === todayStr) {
      todaySales += inv.grandTotal;
    }
    if (inv.date && isAfter(new Date(inv.date), startOfThisMonth)) {
      thisMonthSales += inv.grandTotal;
    }
  });


  // --- TREND CHART DATA ---
  const trendData = useMemo(() => {
    if (invoices.length === 0) return [];
    
    let startDate = new Date();
    if (trendFilter === '7days') startDate = subDays(now, 7);
    else if (trendFilter === '30days') startDate = subDays(now, 30);
    else if (trendFilter === 'thisMonth') startDate = startOfMonth(now);
    else if (trendFilter === '3months') startDate = subMonths(now, 3);
    else if (trendFilter === '6months') startDate = subMonths(now, 6);
    else if (trendFilter === 'thisYear') startDate = startOfYear(now);

    // Group by date
    const daily: Record<string, number> = {};
    invoices.forEach(inv => {
      const d = new Date(inv.date);
      if (d >= startDate) {
        if (!daily[inv.date]) daily[inv.date] = 0;
        daily[inv.date] += inv.grandTotal;
      }
    });

    // Sort and format for Recharts
    const sortedDates = Object.keys(daily).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return sortedDates.map(date => ({
      date: format(new Date(date), 'dd MMM'),
      sales: daily[date]
    }));
  }, [invoices, trendFilter]);

  // --- TOP CUSTOMERS ---
  const topCustomers = useMemo(() => {
    const custMap: Record<string, number> = {};
    invoices.forEach(inv => {
      if (!custMap[inv.shopName]) custMap[inv.shopName] = 0;
      custMap[inv.shopName] += inv.grandTotal;
    });
    const sorted = Object.entries(custMap).map(([name, total]) => ({ name, value: total })).sort((a, b) => b.value - a.value);
    return sorted.slice(0, 5);
  }, [invoices]);

  // --- TOP PRODUCTS ---
  const topProducts = useMemo(() => {
    const prodMap: Record<string, { qty: number, total: number }> = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!prodMap[item.description]) prodMap[item.description] = { qty: 0, total: 0 };
        prodMap[item.description].qty += item.qty;
        prodMap[item.description].total += item.amount;
      });
    });
    const sorted = Object.entries(prodMap).map(([name, stats]) => ({ name, ...stats, value: stats.total })).sort((a, b) => b.value - a.value);
    return sorted.slice(0, 5);
  }, [invoices]);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
      
      {/* Quick Actions */}
      <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
        <button className="btn btn-primary" onClick={() => navigate('/app/create-bill')}><Plus size={18} /> Create New Bill</button>
        <button className="btn btn-secondary" onClick={() => navigate('/app/customers')}><Plus size={18} /> Add Customer</button>
        <button className="btn btn-secondary" onClick={() => navigate('/app/products')}><Plus size={18} /> Add Product</button>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}>
        <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <div style={{background: 'var(--primary-light)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-color)'}}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500}}>Today's Sales</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>₹{todaySales.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
          </div>
        </div>
        
        <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <div style={{background: 'var(--success-light)', padding: '1rem', borderRadius: '50%', color: 'var(--success-color)'}}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500}}>This Month</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>₹{thisMonthSales.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
          </div>
        </div>

        <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <div style={{background: 'var(--warning-light)', padding: '1rem', borderRadius: '50%', color: 'var(--warning-color)'}}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500}}>Overall Turnover</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>₹{totalSales.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
          </div>
        </div>

        <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <div style={{background: 'var(--primary-light)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-color)'}}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500}}>Total Bills</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{invoices.length}</div>
          </div>
        </div>
        
        <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <div style={{background: 'var(--success-light)', padding: '1rem', borderRadius: '50%', color: 'var(--success-color)'}}>
            <Users size={24} />
          </div>
          <div>
            <div style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500}}>Total Customers</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{customersCount}</div>
          </div>
        </div>

        <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <div style={{background: 'var(--warning-light)', padding: '1rem', borderRadius: '50%', color: 'var(--warning-color)'}}>
            <Package size={24} />
          </div>
          <div>
            <div style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500}}>Total Products</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{productsCount}</div>
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="card" style={{textAlign: 'center', padding: '4rem 2rem'}}>
          <FileText size={48} style={{opacity: 0.3, margin: '0 auto 1rem'}} />
          <h3>No sales data available yet</h3>
          <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>Create your first bill to see analytics and charts.</p>
          <button className="btn btn-primary" onClick={() => navigate('/app/create-bill')} style={{margin: '0 auto'}}>
            <Plus size={18} /> Create your first bill
          </button>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem'}}>
            <div className="card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3 style={{margin: 0}}>Sales Trend</h3>
                <select className="input-field" style={{width: 'auto', padding: '0.25rem'}} value={trendFilter} onChange={e => setTrendFilter(e.target.value)}>
                  <option value="7days">7 Days</option>
                  <option value="30days">30 Days</option>
                  <option value="thisMonth">This Month</option>
                  <option value="3months">3 Months</option>
                  <option value="6months">6 Months</option>
                  <option value="thisYear">This Year</option>
                </select>
              </div>
              <div style={{height: 300}}>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-muted)'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-muted)'}} tickFormatter={(value) => `₹${value}`} />
                      <RechartsTooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Sales']} />
                      <Area type="monotone" dataKey="sales" stroke="var(--primary-color)" fill="var(--primary-light)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>
                    No sales data available for this period.
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{marginBottom: '1rem'}}>Sales by Product (Top 5)</h3>
              <div style={{height: 300}}>
                {topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topProducts}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {topProducts.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Sales']} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '12px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>
                    No sales data available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tables Row */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem'}}>
            <div className="card">
              <h3 style={{marginBottom: '1rem'}}>Top Customers</h3>
              <div className="table-responsive">
                <table className="zebra-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th style={{textAlign: 'right'}}>Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((cust, i) => (
                      <tr key={i}>
                        <td style={{fontWeight: 'bold'}}>{cust.name}</td>
                        <td style={{textAlign: 'right', color: 'var(--success-color)'}}>
                          ₹{cust.value.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h3 style={{marginBottom: '1rem'}}>Best Selling Products</h3>
              <div className="table-responsive">
              <table className="zebra-table">
                <thead>
                  <tr>
                    <th style={{padding: '0.75rem', color: 'var(--text-muted)'}}>Product</th>
                    <th style={{padding: '0.75rem', color: 'var(--text-muted)', textAlign: 'right'}}>Qty Sold</th>
                    <th style={{padding: '0.75rem', color: 'var(--text-muted)', textAlign: 'right'}}>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((prod, i) => (
                    <tr key={i}>
                      <td style={{fontWeight: 'bold'}}>{prod.name}</td>
                      <td style={{textAlign: 'right'}}>{prod.qty}</td>
                      <td style={{textAlign: 'right', color: 'var(--success-color)'}}>
                        ₹{prod.value.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            
            <div className="card" style={{gridColumn: '1 / -1'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3 style={{margin: 0}}>Recent Bills</h3>
                <button className="btn btn-secondary" style={{padding: '0.25rem 0.75rem', fontSize: '0.85rem'}} onClick={() => navigate('/app/bills')}>
                  View All
                </button>
              </div>
              <div className="table-responsive">
                <table className="zebra-table">
                  <thead>
                    <tr>
                      <th style={{padding: '0.75rem', color: 'var(--text-muted)'}}>Date</th>
                      <th style={{padding: '0.75rem', color: 'var(--text-muted)'}}>Bill No</th>
                      <th style={{padding: '0.75rem', color: 'var(--text-muted)'}}>Customer</th>
                      <th style={{padding: '0.75rem', color: 'var(--text-muted)', textAlign: 'right'}}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 5).map((inv, i) => (
                      <tr key={i}>
                        <td>{format(new Date(inv.date), 'dd MMM yyyy')}</td>
                        <td style={{fontWeight: 'bold'}}>{inv.invoiceNo}</td>
                        <td>{inv.shopName}</td>
                        <td style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--success-color)'}}>
                          ₹{inv.grandTotal.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
