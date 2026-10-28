export function assertPublicSupabaseKey(value: string): string {
  const isPlaceholder = value === "placeholder-anon-key"
  const isPublishableKey = value.startsWith("sb_publishable_")
  const jwtRole = readJwtRole(value)

  if (!isPlaceholder && !isPublishableKey && jwtRole !== "anon") {
    throw new Error(
      "VITE_SUPABASE_PUBLISHABLE_KEY must be a public publishable/anon key, never a secret or service-role key.",
    )
  }

  return value
}

function readJwtRole(value: string): string | null {
  const parts = value.split(".")
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
    const payload = JSON.parse(atob(padded)) as { role?: unknown }
    return typeof payload.role === "string" ? payload.role : null
  } catch {
    return null
  }
}
