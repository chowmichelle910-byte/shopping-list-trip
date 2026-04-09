"use client";
import React, { useState, useEffect } from 'react';

const GAS_URL = "https://script.google.com/macros/s/AKfycbxP6Au0rO-gKhlh2hscTf9CCoNLJWC-ZY3zmtX4JlXzQbi5tVA5Uwk6JDn7lYy4d6P2/exec";

export default function FukuokaPlanner() {
  const [stores, setStores] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [filter, setFilter] = useState('All'); // 'All', 'To Buy', 'Done'
  const [pendingChanges, setPendingChanges] = useState({}); // 暫存未儲存的改動
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. 初始化載入數據
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(GAS_URL);
    const data = await res.json();
    setStores(data.stores);
    setAllItems(data.items);
    if (data.stores.length > 0) setSelectedStoreId(data.stores[0].storeId);
    setLoading(false);
  };

  // 2. 處理 Checkbox 改動 (僅暫存在 state)
  const handleCheck = (itemId, currentStatus) => {
    const newStatus = !currentStatus;
    // 更新本地顯示
    setAllItems(prev => prev.map(item => 
      item.itemId === itemId ? { ...item, isChecked: newStatus } : item
    ));
    // 記錄待儲存項
    setPendingChanges(prev => ({ ...prev, [itemId]: newStatus }));
  };

  // 3. 批次同步回 Google Sheets
  const handleSync = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setSaving(true);
    const payload = Object.keys(pendingChanges).map(id => ({
      itemId: id,
      isChecked: pendingChanges[id]
    }));

    await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    setPendingChanges({});
    setSaving(false);
    alert("同步成功！");
  };

  if (loading) return <div className="p-10 text-center">讀取福岡行程中...</div>;

  const currentStore = stores.find(s => s.storeId === selectedStoreId);
  const filteredItems = allItems.filter(item => {
    if (item.storeId !== selectedStoreId) return false;
    if (filter === 'To Buy') return !item.isChecked;
    if (filter === 'Done') return item.isChecked;
    return true;
  });

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20">
      {/* 店舖導航 */}
      <div className="sticky top-0 bg-white shadow-md z-10">
        <div className="flex overflow-x-auto p-2 gap-2 border-b">
          {stores.map(store => (
            <button
              key={store.storeId}
              onClick={() => setSelectedStoreId(store.storeId)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${
                selectedStoreId === store.storeId ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              {store.storeName}
            </button>
          ))}
        </div>

        {/* 店舖資訊 */}
        {currentStore && (
          <div className="p-3 text-xs text-gray-600 bg-blue-50">
            <p>📍 {currentStore.address}</p>
            <p>⏰ {currentStore.openingHours} | 🕒 預計停留: {currentStore.visitTime}</p>
          </div>
        )}

        {/* 狀態過濾器 */}
        <div className="flex border-b">
          {['All', 'To Buy', 'Done'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-sm ${filter === f ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : ''}`}
            >
              {f === 'All' ? '全部' : f === 'To Buy' ? '未買' : '已買'}
            </button>
          ))}
        </div>
      </div>

      {/* 購物清單 */}
      <div className="p-4 space-y-4">
        {filteredItems.map(item => (
          <div key={item.itemId} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
            <img 
              src={item.imageUrl || 'https://via.placeholder.com/60'} 
              alt={item.itemName}
              className="w-16 h-16 object-cover rounded mr-4"
              onError={(e) => e.target.src = 'https://via.placeholder.com/60'}
            />
            <div className="flex-1">
              <h3 className={`font-medium ${item.isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {item.itemName}
              </h3>
            </div>
            <input 
              type="checkbox" 
              checked={item.isChecked}
              onChange={() => handleCheck(item.itemId, item.isChecked)}
              className="w-6 h-6 rounded border-gray-300 text-blue-600"
            />
          </div>
        ))}
      </div>

      {/* 底部同步按鈕 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t max-w-md mx-auto">
        <button
          onClick={handleSync}
          disabled={Object.keys(pendingChanges).length === 0 || saving}
          className={`w-full py-3 rounded-xl font-bold text-white transition ${
            Object.keys(pendingChanges).length === 0 ? 'bg-gray-400' : 'bg-green-600 active:bg-green-700'
          }`}
        >
          {saving ? '同步中...' : `儲存改動 (${Object.keys(pendingChanges).length})`}
        </button>
      </div>
    </div>
  );
}
