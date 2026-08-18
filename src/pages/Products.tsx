import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  rate: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const prods: Product[] = [];
      querySnapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRate) return;
    try {
      await addDoc(collection(db, 'products'), {
        name: newName,
        rate: Number(newRate)
      });
      setNewName('');
      setNewRate('');
      setShowAdd(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
        <h2>Products</h2>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{marginBottom: '2rem'}}>
          <h3>Add New Product</h3>
          <form onSubmit={handleAdd} style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
            <div style={{flex: 1}}>
              <label className="label">Product Name</label>
              <input className="input-field" value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>
            <div style={{width: '200px'}}>
              <label className="label">Default Rate (₹)</label>
              <input type="number" className="input-field" value={newRate} onChange={e => setNewRate(e.target.value)} required />
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end'}}>
              <button type="submit" className="btn btn-primary">Save Product</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found. Add some to get started.</p>
        ) : (
          <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                <th style={{padding: '0.75rem'}}>Product Name</th>
                <th style={{padding: '0.75rem'}}>Default Rate (₹)</th>
                <th style={{padding: '0.75rem', width: '100px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                  <td style={{padding: '0.75rem'}}>{product.name}</td>
                  <td style={{padding: '0.75rem'}}>{product.rate.toFixed(2)}</td>
                  <td style={{padding: '0.75rem'}}>
                    <button className="btn btn-danger" style={{padding: '0.5rem'}} onClick={() => handleDelete(product.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
