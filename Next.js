// pages/index.js
import { useEffect, useState } from "react";

// 你從 Google Apps Script 得到嘅 Web App URL
const BASE_GAS_URL =
  "https://script.google.com/macros/s/AKfycbxP6Au0rO-gKhlh2hscTf9CCoNLJWC-ZY3zmtX4JlXzQbi5tVA5Uwk6JDn7lYy4d6P2/exec";

export default function Home() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [items, setItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [tab, setTab] = useState("all"); // "all", "toBuy", "done"

  // 1. 初次載入，先拉取「店舖列表」
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    const url = `${BASE_GAS_URL}?path=stores`;
    const res = await fetch(url);
    const json = await res.json();
    setStores(json.stores || []);
  };

  // 2. 點擊某一間店鋪，拉取該店所有商品
  const fetchItemsByStore = async (store) => {
    if (!store) return;

    setSelectedStore(store);
    const url = `${BASE_GAS_URL}?path=items&storeId=${store.storeId}`;
    const res = await fetch(url);
    const json = await res.json();
    setItems(json.items || []);
  };

  // 3. 用來「filter」未買／已買／全部
  const filterItems = (type) => {
    if (type === "all") {
      setTab("all");
      return items;
    } else if (type === "toBuy") {
      setTab("toBuy");
      return items.filter((i) => i.isChecked === "false" || !i.isChecked);
    } else if (type === "done") {
      setTab("done");
      return items.filter((i) => i.isChecked === "true");
    }
    return items;
  };

  // 4. Checkbox 點擊：只改前端 UI，唔即刻儲存
  const handleCheck = (itemId, value) => {
    setCheckedItems(new Set(checkedItems).add(String(itemId)));
    setItems(
      items.map((i) =>
        i.itemId === itemId
          ? { ...i, isChecked: value ? "true" : "false" }
          : i
      )
    );
  };

  // 5. 「一次儲存全部」Button
  const handleSave = async () => {
    if (checkedItems.size === 0) return;

    const toSave = items
      .filter((i) => checkedItems.has(String(i.itemId)))
      .map((i) => ({
        itemId: i.itemId,
        isChecked: i.isChecked === "true",
      }));

    const res = await fetch(BASE_GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: toSave }),
    });

    const json = await res.json();
    if (json.success) {
      alert("已保存全部改動！");
      setCheckedItems(new Set()); // 清空已改動列表
    } else {
      alert("儲存失敗：" + (json.error || "未知錯誤"));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>旅行購物清單（福岡 4月19日）</h1>

      <div>
        {stores.map((store) => (
          <button
            key={store.storeId}
            onClick={() => fetchItemsByStore(store)}
            style={{
              margin: "5px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          >
            {store.storeName}
          </button>
        ))}
      </div>

      {selectedStore && (
        <div>
          <h2>店舖：{selectedStore.storeName}</h2>
          <p>
            <strong>地址：</strong>
            {selectedStore.address}
          </p>
          <p>
            <strong>喺 4月19日星期日營業時間：</strong>
            {selectedStore.openingHours}
          </p>
          <p>
            <strong>預計停留時間：</strong>
            {selectedStore.visitTime}
          </p>

          <div>
            <button onClick={() => filterItems("all")}>全部</button>
            <button onClick={() => filterItems("toBuy")}>未買</button>
            <button onClick={() => filterItems("done")}>已買</button>
            <button
              onClick={handleSave}
              style={{ margin: "10px 0", padding: "8px" }}
            >
              一次儲存全部改動
            </button>
          </div>

          <div>
            {filterItems(tab).map((item) => (
              <div
                key={item.itemId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "10px 0",
                  padding: "10px",
                  border: "1px solid #eee",
                  borderRadius: "5px",
                }}
              >
                <img
                  src={item.imageUrl}
                  width="60"
                  height="60"
                  onError={(e) => {
                    // 如果圖片失效，顯示 placeholder
                    e.target.src =
                      "https://www.freeiconspng.com/uploads/no-image-icon-13.png";
                  }}
                  style={{ marginRight: 10 }}
                />
                <span style={{ marginRight: 10 }}>{item.itemName}</span>
                <input
                  type="checkbox"
                  checked={item.isChecked === "true"}
                  onChange={(e) =>
                    handleCheck(item.itemId, e.target.checked)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
