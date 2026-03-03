import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Warehouses } from './pages/Warehouses';
import { Suppliers } from './pages/Suppliers';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Transfers } from './pages/Transfers';
import { ReorderAlerts } from './pages/ReorderAlerts';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/reorder-alerts" element={<ReorderAlerts />} />
        </Routes>
      </AdminLayout>
    </BrowserRouter>
  );
}

export default App;
