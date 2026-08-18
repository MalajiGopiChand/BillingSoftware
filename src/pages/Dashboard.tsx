import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { FileText, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalBills: 0,
    thisMonthSales: 0,
    todaySales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'invoices'));
        let total = 0;
        let count = 0;
        let thisMonth = 0;
        let today = 0;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const todayStr = format(now, 'yyyy-MM-dd');

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const amount = data.grandTotal || 0;
          total += amount;
          count += 1;
          
          if (data.date) {
            const dateObj = new Date(data.date);
            if (dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear) {
              thisMonth += amount;
            }
            if (data.date === todayStr) {
              today += amount;
            }
          }
        });

        setStats({
          totalSales: total,
          totalBills: count,
          thisMonthSales: thisMonth,
          todaySales: today
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h2 style={{marginBottom: '2rem'}}>Dashboard Overview</h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        
        <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <div style={{background: 'var(--primary-light)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-color)'}}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500}}>Today's Sales</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>₹{stats.todaySales.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
          </div>
        </div>
        
        <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <div style={{background: 'var(--success-light)', padding: '1rem', borderRadius: '50%', color: 'var(--success-color)'}}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500}}>This Month</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>₹{stats.thisMonthSales.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
          </div>
        </div>

        <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <div style={{background: 'var(--warning-light)', padding: '1rem', borderRadius: '50%', color: 'var(--warning-color)'}}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500}}>Total Bills</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{stats.totalBills}</div>
          </div>
        </div>
        
        <div className="card" style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
          <div style={{background: 'var(--primary-light)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-color)'}}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500}}>Total Turnover</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>₹{stats.totalSales.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
          </div>
        </div>

      </div>
      
      <div className="card" style={{minHeight: '300px'}}>
        <h3 style={{marginBottom: '1rem'}}>Recent Activity</h3>
        <p style={{color: 'var(--text-muted)'}}>The dashboard overview shows a quick snapshot of your billing statistics based on your saved invoices.</p>
      </div>
    </div>
  );
}
