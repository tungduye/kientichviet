import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { buildContentSnapshot, type ContentEntry, type ContentSnapshot } from "../features/cms/siteContent"
import { SITE_CONTENT_FIELDS } from "../features/cms/siteContentDefinitions"
import { supabase } from "../integrations/supabase/client"
import { useLocation } from "react-router-dom"

interface SiteContentValue {
  content: ContentSnapshot
  text: (key: string) => string
  visible: (key: string) => boolean
  refresh: () => Promise<void>
  previewingDraft: boolean
}

const defaults = buildContentSnapshot(SITE_CONTENT_FIELDS, [], "published")
const SiteContentContext = createContext<SiteContentValue | null>(null)

function displayText(key: string, value: string): string {
  if (key === "nav.heritage" && value.trim().toLocaleLowerCase("vi") === "di sản số") {
    return "Khám phá di sản"
  }
  return value
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState(defaults)
  const location = useLocation()
  const previewingDraft = new URLSearchParams(location.search).get("preview") === "draft"

  const refresh = useCallback(async () => {
    let entries: ContentEntry[] = []
    if (previewingDraft) {
      const { data, error } = await supabase.from("site_content_drafts").select("content_key,draft_value,is_visible")
      if (error) return
      entries = (data ?? []).map((row) => ({ contentKey: row.content_key, draftValue: row.draft_value, publishedValue: row.draft_value, revision: 0, isVisible: row.is_visible }))
    } else {
      const { data, error } = await supabase.from("site_content_public").select("content_key,published_value,is_visible,revision")
      if (error) return
      entries = (data ?? []).filter((row) => row.content_key !== null).map((row) => ({ contentKey: row.content_key!, draftValue: row.published_value ?? "", publishedValue: row.published_value ?? "", revision: row.revision ?? 0, isVisible: row.is_visible ?? false }))
    }
    setContent(buildContentSnapshot(SITE_CONTENT_FIELDS, entries, previewingDraft ? "draft" : "published"))
  }, [previewingDraft])

  useEffect(() => { void refresh() }, [refresh])

  const value = useMemo<SiteContentValue>(() => ({
    content,
    text: (key) => content[key]?.isVisible === false ? "" : displayText(key, content[key]?.value ?? ""),
    visible: (key) => content[key]?.isVisible ?? true,
    refresh,
    previewingDraft,
  }), [content, refresh, previewingDraft])

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent() {
  const context = useContext(SiteContentContext)
  if (!context) throw new Error("useSiteContent must be used inside SiteContentProvider")
  return context
}
