import { useEffect, useState, useMemo } from "react";

const BASE_GAS_URL = "https://script.google.com/macros/s/AKfycbxP6Au0rO-gKhlh2hscTf9CCoNLJWC-ZY3zmtX4JlXzQbi5tVA5Uwk6JDn7lYy4d6P2/exec";

export default function Home() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [items, setItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch(`${BASE_GAS_URL}?path=stores`);
      const json = await res.json();
      setStores(json.stores || []);
    } catch (e) {
      console.error("無法載入店舖列表");
    }
  };

  const fetchItemsByStore = async (store) => {
    setLoading(true);
    setSelectedStore(store);
    try {
      const res = await fetch(`${BASE_GAS_URL}?path=items&storeId=${store.storeId}`);
      const json = await res.json();
      setItems(json.items || []);
      setCheckedItems(new Set()); 
    } catch (e) {
      console.error("無法載入商品清單");
    } finally {
      setLoading(false);
    }
  };

  const displayItems = useMemo(() => {
    if (tab === "toBuy") return items.filter(i => i.isChecked === "false" || !i.isChecked);
    if (tab === "done") return items.filter(i => i.isChecked === "true");
    return items;
  }, [items, tab]);

  const handleCheck = (itemId, isChecked) => {
    setCheckedItems(prev => new Set(prev).add(String(itemId)));
    setItems(prev => prev.map(i => 
      i.itemId === itemId ? { ...i, isChecked: isChecked ? "true" : "false" } : i
    ));
  };

  const handleSave = async () => {
    if (checkedItems.size === 0) return;
    setLoading(true);
    const toSave = items
      .filter(i => checkedItems.has(String(i.itemId)))
      .map(i => ({ itemId: i.itemId, isChecked: i.isChecked === "true" }));

    try {
      // GAS POST 必須使用 no-cors 模式
      await fetch(BASE_GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toSave }),
      });
      alert("儲存成功！");
      setCheckedItems(new Set());
    } catch (e) {
      alert("儲存失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "15px", maxWidth: "500px", margin: "0 auto", backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <h2 style={{ textAlign: "center", color: "#333" }}>福岡購物清單 🇯🇵</h2>
      
      {/* 店舖選擇按鈕 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "15px" }}>
        {stores.map(s => (
          <button 
            key={s.storeId} 
            onClick={() => fetchItemsByStore(s)}
            style={{
              padding: "8px 12px",
              borderRadius: "20px",
              border: "1px solid #ddd",
              backgroundColor: selectedStore?.storeId === s.storeId ? "#007aff" : "#fff",
              color: selectedStore?.storeId === s.storeId ? "#fff" : "#333",
              fontSize: "14px"
            }}
          >
            {s.storeName}
          </button>
        ))}
      </div>

      {selectedStore && (
        <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 5px 0" }}>{selectedStore.storeName}</h3>
          <p style={{ fontSize: "12px", color: "#888", marginBottom: "15px" }}>{selectedStore.address}</p>

          {/* 分頁與儲存 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <div style={{ display: "flex", gap: "5px" }}>
              {["all", "toBuy", "done"].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "5px 10px", fontSize: "12px", borderRadius: "4px", border: "none",
                  backgroundColor: tab === t ? "#eee" : "transparent"
                }}>
                  {t === "all" ? "全部" : t === "toBuy" ? "未買" : "已買"}
                </button>
              ))}
            </div>
            <button 
              onClick={handleSave} 
              disabled={checkedItems.size === 0 || loading}
              style={{ padding: "6px 15px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold" }}
            >
              {loading ? "..." : "儲存"}
            </button>
          </div>

          {/* 商品列表 */}
          {displayItems.map(item => (
            <div key={item.itemId} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              <img src={item.imageUrl} width="45" height="45" style={{ borderRadius: "5px", marginRight: "10px", objectFit: "cover" }} />
              <span style={{ flex: 1, fontSize: "15px", textDecoration: item.isChecked === "true" ? "line-through" : "none", color: item.isChecked === "true" ? "#ccc" : "#333" }}>
                {item.itemName}
              </span>
              <input 
                type="checkbox" 
                checked={item.isChecked === "true"} 
                onChange={(e) => handleCheck(item.itemId, e.target.checked)}
                style={{ width: "20px", height: "20px" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
