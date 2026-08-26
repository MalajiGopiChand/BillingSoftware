import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: string;
  name: string;
  rate: number;
}

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setNewName('');
    setNewRate('');
    setEditingId(null);
    setShowAdd(false);
  };

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'products'));
      const querySnapshot = await getDocs(q);
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
    if (user) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRate || !user) return;
    try {
      if (editingId) {
        // Update existing
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'products', editingId), {
          name: newName,
          rate: Number(newRate)
        });
      } else {
        // Add new
        await addDoc(collection(db, 'products'), {
          name: newName,
          rate: Number(newRate),
          userId: user.uid
        });
      }
      resetForm();
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
        {!showAdd && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      {showAdd && (
        <div className="card" style={{marginBottom: '2rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={{margin: 0}}>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
            <button className="btn btn-secondary" style={{padding: '0.4rem'}} onClick={resetForm}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleAdd} style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem'}}>
            <div style={{flex: '1 1 250px'}}>
              <label className="label">Product Name</label>
              <input className="input-field" value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>
            <div style={{flex: '1 1 150px'}}>
              <label className="label">Rate (₹)</label>
              <input type="number" step="0.01" className="input-field" value={newRate} onChange={e => setNewRate(e.target.value)} />
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', flex: '1 1 100%', gap: '1rem'}}>
              <button type="submit" className="btn btn-primary">{editingId ? 'Update Product' : 'Save Product'}</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
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
          <div className="table-responsive">
            <table className="zebra-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Rate (₹)</th>
                  <th style={{width: '100px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td style={{fontWeight: 'bold'}}>{product.name}</td>
                    <td style={{color: 'var(--success-color)', fontWeight: '500'}}>{product.rate.toFixed(2)}</td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button className="btn btn-secondary" style={{padding: '0.4rem'}} onClick={() => {
                          setNewName(product.name);
                          setNewRate(String(product.rate));
                          setEditingId(product.id);
                          setShowAdd(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} title="Edit Product">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-danger" style={{padding: '0.4rem'}} onClick={() => handleDelete(product.id)} title="Delete Product">
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
