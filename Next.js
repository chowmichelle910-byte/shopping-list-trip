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
      console.error("Fetch stores error:", e);
    }
  };

  const fetchItemsByStore = async (store) => {
    if (!store) return;
    setLoading(true);
    setSelectedStore(store);
    try {
      const res = await fetch(`${BASE_GAS_URL}?path=items&storeId=${store.storeId}`);
      const json = await res.json();
      setItems(json.items || []);
      setCheckedItems(new Set()); // 切換店舖時清空未儲存的暫存
    } catch (e) {
      console.error("Fetch items error:", e);
    } finally {
      setLoading(false);
    }
  };

  // 使用 useMemo 處理過濾，效能更好
  const displayItems = useMemo(() => {
    if (tab === "toBuy") return items.filter((i) => i.isChecked === "false" || !i.isChecked);
    if (tab === "done") return items.filter((i) => i.isChecked === "true");
    return items;
  }, [items, tab]);

  const handleCheck = (itemId, isChecked) => {
    // 記錄哪些 ID 被改動過
    const newCheckedSet = new Set(checkedItems);
    newCheckedSet.add(String(itemId));
    setCheckedItems(newCheckedSet);

    // 更新本地 state 讓 UI 即時反應
    setItems(prev => prev.map(i => 
      i.itemId === itemId ? { ...i, isChecked: isChecked ? "true" : "false" } : i
    ));
  };

  const handleSave = async () => {
    if (checkedItems.size === 0) {
      alert("沒有改動需要儲存");
      return;
    }

    setLoading(true);
    const toSave = items
      .filter((i) => checkedItems.has(String(i.itemId)))
      .map((i) => ({
        itemId: i.itemId,
        isChecked: i.isChecked === "true",
      }));

    try {
      // GAS POST 必須處理轉址與 mode
      const res = await fetch(BASE_GAS_URL, {
        method: "POST",
        mode: "no-cors", // 注意：no-cors 會導致無法讀取 response json，但保證能送出
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toSave }),
      });

      // 由於 no-cors 讀不到 json.success，我們假設成功或手動重拉數據
      alert("已送出儲存請求！");
      setCheckedItems(new Set());
      // 建議：儲存後重新拉取該店數據以確保同步
      fetchItemsByStore(selectedStore);
    } catch (e) {
      alert("儲存失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "24px" }}>福岡購物清單 🇯🇵</h1>

      <div style={{ marginBottom: "20px" }}>
        {stores.map((store) => (
          <button
            key={store.storeId}
            onClick={() => fetchItemsByStore(store)}
            style={{
              margin: "5px",
              padding: "10px",
              backgroundColor: selectedStore?.storeId === store.storeId ? "#0070f3" : "#fff",
              color: selectedStore?.storeId === store.storeId ? "#white" : "#000",
              border: "1px solid #ccc",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            {store.storeName}
          </button>
        ))}
      </div>

      {selectedStore && (
        <div style={{ borderTop: "2px solid #eee", paddingTop: "20px" }}>
          <h2>{selectedStore.storeName}</h2>
          <p style={{ fontSize: "14px", color: "#666" }}>📍 {selectedStore.address}</p>

          <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
            <button onClick={() => setTab("all")} style={tabStyle(tab === "all")}>全部</button>
            <button onClick={() => setTab("toBuy")} style={tabStyle(tab === "toBuy")}>未買</button>
            <button onClick={() => setTab("done")} style={tabStyle(tab === "done")}>已買</button>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || checkedItems.size === 0}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: checkedItems.size > 0 ? "#28a745" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold"
            }}
          >
            {loading ? "儲存中..." : `儲存 ${checkedItems.size} 項改動`}
          </button>

          <div style={{ marginTop: "20px" }}>
            {displayItems.map((item) => (
              <div
                key={item.itemId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={item.imageUrl}
                    alt={item.itemName}
                    width="50"
                    height="50"
                    style={{ borderRadius: "4px", marginRight: "12px", objectFit: "cover" }}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/50"; }}
                  />
                  <span style={{ textDecoration: item.isChecked === "true" ? "line-through" : "none" }}>
                    {item.itemName}
                  </span>
                </div>
                <input
                  type="checkbox"
                  style={{ transform: "scale(1.5)" }}
                  checked={item.isChecked === "true"}
                  onChange={(e) => handleCheck(item.itemId, e.target.checked)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const tabStyle = (active) => ({
  flex: 1,
  padding: "8px",
  backgroundColor: active ? "#eee" : "#fff",
  border: "1px solid #ccc",
  borderRadius: "4px",
  cursor: "pointer"
});
