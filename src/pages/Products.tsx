import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  rate: number;
  packageSize?: string;
  unit?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newPackageSize, setNewPackageSize] = useState('');
  const [newUnit, setNewUnit] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setNewName('');
    setNewRate('');
    setNewPackageSize('');
    setNewUnit('');
    setEditingId(null);
    setShowAdd(false);
  };

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
      if (editingId) {
        // Update existing
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'products', editingId), {
          name: newName,
          rate: Number(newRate),
          packageSize: newPackageSize,
          unit: newUnit
        });
      } else {
        // Add new
        await addDoc(collection(db, 'products'), {
          name: newName,
          rate: Number(newRate),
          packageSize: newPackageSize,
          unit: newUnit
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
              <label className="label">Default Rate (₹)</label>
              <input type="number" className="input-field" value={newRate} onChange={e => setNewRate(e.target.value)} required />
            </div>
            <div style={{flex: '1 1 150px'}}>
              <label className="label">Package / Box Size</label>
              <input type="text" className="input-field" value={newPackageSize} onChange={e => setNewPackageSize(e.target.value)} placeholder="e.g. 25 KG, 1 Box" />
            </div>
            <div style={{flex: '1 1 100px'}}>
              <label className="label">Unit</label>
              <input type="text" className="input-field" value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="e.g. PCS, KG" />
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
                  <th>Package Size</th>
                  <th>Unit</th>
                  <th>Default Rate (₹)</th>
                  <th style={{width: '100px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td style={{fontWeight: 'bold'}}>{product.name}</td>
                    <td>{product.packageSize || '-'}</td>
                    <td>{product.unit || '-'}</td>
                    <td style={{color: 'var(--success-color)', fontWeight: '500'}}>{product.rate.toFixed(2)}</td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button className="btn btn-secondary" style={{padding: '0.4rem'}} onClick={() => {
                          setNewName(product.name);
                          setNewRate(String(product.rate));
                          setNewPackageSize(product.packageSize || '');
                          setNewUnit(product.unit || '');
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
