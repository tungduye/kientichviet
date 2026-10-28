import { useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Link } from "react-router-dom"

import { sanitizeContentValue } from "../../features/cms/siteContent"
import { SITE_CONTENT_FIELDS } from "../../features/cms/siteContentDefinitions"
import { supabase } from "../../integrations/supabase/client"

interface DraftState { value: string; isVisible: boolean }
interface RevisionRow { id: number; content_key: string; revision: number; created_at: string }

export default function AdminContentEditor({ user }: { user: User }) {
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({})
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const [revisions, setRevisions] = useState<RevisionRow[]>([])

  const load = async () => {
    const [draftResult, publishedResult, revisionResult] = await Promise.all([
      supabase.from("site_content_drafts").select("content_key,draft_value,is_visible"),
      supabase.from("site_content").select("content_key,published_value,is_visible"),
      supabase.from("site_content_revisions").select("id,content_key,revision,created_at").order("created_at", { ascending: false }).limit(20),
    ])
    if (draftResult.error || publishedResult.error || revisionResult.error) {
      setStatus(`Không tải được dữ liệu CMS: ${draftResult.error?.message ?? publishedResult.error?.message ?? revisionResult.error?.message}`)
      return
    }
    const draftRows = draftResult.data
    const publishedRows = publishedResult.data
    const revisionRows = revisionResult.data
    const draftMap = new Map((draftRows ?? []).map((row) => [row.content_key, row]))
    const publishedMap = new Map((publishedRows ?? []).map((row) => [row.content_key, row]))
    setDrafts(Object.fromEntries(SITE_CONTENT_FIELDS.map((field) => {
      const draft = draftMap.get(field.key)
      const published = publishedMap.get(field.key)
      return [field.key, {
        value: draft?.draft_value ?? published?.published_value ?? field.defaultValue,
        isVisible: draft?.is_visible ?? published?.is_visible ?? true,
      }]
    })))
    setRevisions(revisionRows ?? [])
  }

  useEffect(() => { void load() }, [])

  const groups = useMemo(() => {
    const result = new Map<string, typeof SITE_CONTENT_FIELDS>()
    SITE_CONTENT_FIELDS.forEach((field) => {
      const key = `${field.page} · ${field.group}`
      result.set(key, [...(result.get(key) ?? []), field])
    })
    return [...result.entries()]
  }, [])

  const saveDrafts = async (): Promise<boolean> => {
    setSaving(true)
    setStatus("")
    const rows = []
    for (const field of SITE_CONTENT_FIELDS) {
      const current = drafts[field.key] ?? { value: field.defaultValue, isVisible: true }
      const result = sanitizeContentValue(field.type, current.value)
      if (!result.ok) {
        setStatus(`${field.label}: ${result.error}`)
        setSaving(false)
        return false
      }
      rows.push({ content_key: field.key, draft_value: result.value, is_visible: current.isVisible, updated_by: user.id, updated_at: new Date().toISOString() })
    }
    const { error } = await supabase.from("site_content_drafts").upsert(rows)
    setStatus(error ? `Không thể lưu bản nháp: ${error.message}` : "Đã lưu bản nháp.")
    setSaving(false)
    return !error
  }

  const publish = async () => {
    const saved = await saveDrafts()
    if (!saved) return
    const { data, error } = await supabase.rpc("publish_all_site_content")
    setStatus(error ? `Không thể xuất bản: ${error.message}` : `Đã xuất bản ${data} mục nội dung.`)
    if (!error) await load()
  }

  const restore = async (row: RevisionRow) => {
    const { error } = await supabase.rpc("restore_site_content_revision", { target_key: row.content_key, target_revision: row.revision })
    if (error) setStatus(`Không thể khôi phục: ${error.message}`)
    else { setStatus(`Đã đưa phiên bản ${row.revision} của ${row.content_key} về bản nháp.`); await load() }
  }

  return (
    <section className="admin-content-editor">
      <div className="admin-section-intro">
        <div><h2>Nội dung website</h2><p>Sửa bản nháp, xem trước rồi xuất bản cho khách hàng.</p></div>
        <div className="admin-header-actions">
          <Link to="/?preview=draft">Xem trước bản nháp</Link>
          <button type="button" onClick={() => void saveDrafts()} disabled={saving}>Lưu bản nháp</button>
          <button type="button" onClick={() => void publish()} disabled={saving}>Xuất bản</button>
        </div>
      </div>
      {groups.map(([group, fields]) => (
        <fieldset className="admin-content-group" key={group}>
          <legend>{group}</legend>
          {fields.map((field) => {
            const current = drafts[field.key] ?? { value: field.defaultValue, isVisible: true }
            const Input = field.type === "textarea" ? "textarea" : "input"
            return <div className="admin-content-field" key={field.key}>
              <label>{field.label}<Input value={current.value} rows={field.type === "textarea" ? 4 : undefined} onChange={(event) => setDrafts((old) => ({ ...old, [field.key]: { ...current, value: event.target.value } }))} /></label>
              <label className="admin-visibility-field"><input type="checkbox" checked={current.isVisible} onChange={(event) => setDrafts((old) => ({ ...old, [field.key]: { ...current, isVisible: event.target.checked } }))} /> Hiển thị</label>
            </div>
          })}
        </fieldset>
      ))}
      {revisions.length > 0 && <section className="admin-content-group">
        <h3>Lịch sử xuất bản gần đây</h3>
        <div className="admin-revision-list">{revisions.map((row) => <div key={row.id}><span><strong>{row.content_key}</strong> · bản {row.revision} · {new Date(row.created_at).toLocaleString("vi-VN")}</span><button type="button" onClick={() => void restore(row)}>Khôi phục vào bản nháp</button></div>)}</div>
      </section>}
      {status && <p role="status" className="admin-save-status">{status}</p>}
    </section>
  )
}
