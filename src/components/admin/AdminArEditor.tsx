import { useEffect, useState } from "react"

import { supabase } from "../../integrations/supabase/client"
import type { Tables } from "../../integrations/supabase/types"

type ArRow = Tables<"ar_experiences">

export default function AdminArEditor() {
  const [items, setItems] = useState<ArRow[]>([])
  const [status, setStatus] = useState("")

  const load = async () => {
    const { data, error } = await supabase.from("ar_experiences").select("*").order("product_id")
    if (error) setStatus(`Không tải được cấu hình AR: ${error.message}`)
    else setItems(data ?? [])
  }
  useEffect(() => { void load() }, [])

  const update = (productId: string, patch: Partial<ArRow>) => setItems((old) => old.map((item) => item.product_id === productId ? { ...item, ...patch } : item))
  const save = async (item: ArRow) => {
    const { error } = await supabase.from("ar_experiences").update({ ...item, updated_at: new Date().toISOString() }).eq("product_id", item.product_id)
    setStatus(error ? `Không thể lưu: ${error.message}` : `Đã lưu AR cho ${item.product_id}.`)
  }

  return <section className="admin-content-editor">
    <div className="admin-section-intro"><div><h2>Trải nghiệm Web AR</h2><p>Ảnh mục tiêu cần được biên dịch thành tệp .mind; mô hình dùng GLB. Khi chưa có .mind, trang dùng chế độ đặt mô hình trên mặt phẳng.</p></div></div>
    <div className="admin-ar-grid">{items.map((item) => <article className="admin-ar-card" key={item.product_id}>
      <h3>Sản phẩm {item.product_id}</h3>
      <label className="admin-visibility-field"><input type="checkbox" checked={item.enabled} onChange={(e) => update(item.product_id, { enabled: e.target.checked })} /> Bật AR</label>
      <label>URL mục tiêu .mind<input value={item.target_url ?? ""} onChange={(e) => update(item.product_id, { target_url: e.target.value || null })} placeholder="https://.../target.mind" /></label>
      <label>URL mô hình .glb<input value={item.model_url ?? ""} onChange={(e) => update(item.product_id, { model_url: e.target.value || null })} placeholder="/models/model.glb" /></label>
      <label>Tỷ lệ<input type="number" min="0.01" max="10" step="0.01" value={item.scale} onChange={(e) => update(item.product_id, { scale: Number(e.target.value) })} /></label>
      <div className="admin-ar-numbers">{(["offset_x","offset_y","offset_z","rotation_x","rotation_y","rotation_z"] as const).map((key) => <label key={key}>{key}<input type="number" step="0.01" value={item[key]} onChange={(e) => update(item.product_id, { [key]: Number(e.target.value) })} /></label>)}</div>
      <div className="admin-card-actions"><button type="button" onClick={() => void save(item)}>Lưu AR</button><a href={`/ar/${item.product_id}`} target="_blank" rel="noreferrer">Mở trang AR</a></div>
    </article>)}</div>
    {status && <p role="status" className="admin-save-status">{status}</p>}
  </section>
}
