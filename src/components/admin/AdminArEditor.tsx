import { useEffect, useRef, useState } from "react"

import { supabase } from "../../integrations/supabase/client"
import type { Tables } from "../../integrations/supabase/types"
import {
  AR_PARAMETER_GUIDE,
  getArParameterGuide,
  type ArNumericParameter,
} from "../../features/ar/arGuidance"

type ArRow = Tables<"ar_experiences">

export default function AdminArEditor() {
  const [items, setItems] = useState<ArRow[]>([])
  const [status, setStatus] = useState("")
  const [showGuide, setShowGuide] = useState(false)
  const guideButtonRef = useRef<HTMLButtonElement>(null)

  const closeGuide = () => {
    setShowGuide(false)
    requestAnimationFrame(() => guideButtonRef.current?.focus())
  }

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
    <div className="admin-section-intro">
      <div><h2>Trải nghiệm Web AR</h2><p>Ảnh mục tiêu cần được biên dịch thành tệp .mind; mô hình dùng GLB. Khi chưa có .mind, trang dùng chế độ đặt mô hình trên mặt phẳng.</p></div>
      <button ref={guideButtonRef} className="admin-help-button" type="button" aria-expanded={showGuide} aria-controls="ar-configuration-guide" onClick={() => setShowGuide((value) => !value)}>{showGuide ? "Đóng hướng dẫn" : "? Hướng dẫn cấu hình AR"}</button>
    </div>
    {showGuide && <aside className="admin-ar-guide" id="ar-configuration-guide">
      <div className="admin-ar-guide-heading"><div><p className="admin-kicker">Hướng dẫn từng bước</p><h3>Cấu hình AR dễ hiểu</h3></div><button type="button" onClick={closeGuide} aria-label="Đóng hướng dẫn">×</button></div>
      <ol className="admin-ar-steps">
        <li><strong>Chuẩn bị mô hình 3D:</strong> dùng tệp <code>.glb</code>, tối ưu dung lượng và đặt trong thư mục <code>public/models</code> hoặc một URL HTTPS công khai.</li>
        <li><strong>Chọn cách chạy:</strong> chỉ có GLB thì điện thoại đặt mô hình trên mặt phẳng. Muốn mô hình bám theo một hình ảnh, hãy biên dịch ảnh rõ nét thành tệp <code>.mind</code> rồi nhập URL tệp đó.</li>
        <li><strong>Bật AR và lưu:</strong> tích “Bật AR”, nhập URL, bấm “Lưu AR”, sau đó mở trang AR để kiểm tra trên điện thoại.</li>
        <li><strong>Căn chỉnh:</strong> thay đổi từng thông số một với bước nhỏ. Góc xoay dùng radian: <code>1,57 ≈ 90°</code>, <code>3,14 ≈ 180°</code>, <code>6,28 ≈ 360°</code>.</li>
      </ol>
      <div className="admin-ar-guide-grid">{AR_PARAMETER_GUIDE.map((guide) => <article key={guide.key}><strong>{guide.label}</strong><p>{guide.description}</p><small>Giá trị thử: <code>{guide.example}</code></small></article>)}</div>
      <div className="admin-ar-troubleshooting"><strong>Nếu không nhận diện được ảnh:</strong> dùng ảnh có nhiều chi tiết và độ tương phản, tránh ảnh trơn/lặp họa tiết, đủ ánh sáng, giữ toàn bộ ảnh trong camera và kiểm tra URL <code>.mind</code> mở được công khai.</div>
    </aside>}
    <div className="admin-ar-grid">{items.map((item) => <article className="admin-ar-card" key={item.product_id}>
      <h3>Sản phẩm {item.product_id}</h3>
      <label className="admin-visibility-field"><input type="checkbox" checked={item.enabled} onChange={(e) => update(item.product_id, { enabled: e.target.checked })} /> Bật AR</label>
      <label>URL mục tiêu .mind<input value={item.target_url ?? ""} onChange={(e) => update(item.product_id, { target_url: e.target.value || null })} placeholder="https://.../target.mind" /></label>
      <label>URL mô hình .glb<input value={item.model_url ?? ""} onChange={(e) => update(item.product_id, { model_url: e.target.value || null })} placeholder="/models/model.glb" /></label>
      <label>Tỷ lệ<input type="number" min="0.01" max="10" step="0.01" value={item.scale} onChange={(e) => update(item.product_id, { scale: Number(e.target.value) })} /></label>
      <div className="admin-ar-numbers">{(["offset_x","offset_y","offset_z","rotation_x","rotation_y","rotation_z"] as ArNumericParameter[]).map((key) => { const guide = getArParameterGuide(key); const descriptionId = `ar-${item.product_id}-${key}-help`; return <label key={key}>{guide.label}<input type="number" step="0.01" value={item[key]} aria-describedby={descriptionId} onChange={(e) => update(item.product_id, { [key]: Number(e.target.value) })} /><small className="admin-field-help" id={descriptionId}>{guide.description}</small></label> })}</div>
      <div className="admin-card-actions"><button type="button" onClick={() => void save(item)}>Lưu AR</button><a href={`/ar/${item.product_id}`} target="_blank" rel="noreferrer">Mở trang AR</a></div>
    </article>)}</div>
    {status && <p role="status" className="admin-save-status">{status}</p>}
  </section>
}
