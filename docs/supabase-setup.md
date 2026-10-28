# Supabase setup for Kiến Tích Việt

Never commit `.env.local`, database passwords, service-role keys, Gemini keys or an admin password.

## 1. Apply the catalog migration

Open the Supabase SQL Editor for project `veuzowtvsbxnyrfdbgfz`, copy the entire contents of:

`supabase/migrations/20261028161000_product_catalog_admin.sql`

Run it once. It creates the catalog settings, the admin allowlist, the public product-image bucket and the RLS policies.

## 2. Create and authorize the administrator

Create the administrator under **Authentication → Users → Add user**. Then run this in the SQL Editor, replacing the email only:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('admin@example.com')
on conflict (user_id) do nothing;
```

The application has no public signup route. A signed-in user who is absent from `admin_users` cannot read hidden catalog rows, edit products or upload product images.

For production, enable Supabase MFA for the administrator and enforce AAL2 after enrollment. The initial implementation keeps sessions memory-only but does not yet require a second factor.

## 3. Configure the frontend

Copy `.env.example` to `.env.local` and replace the publishable-key placeholder. Restart the Vite server after changing environment variables.

## 4. Deploy Edge Functions

Set the Gemini secret in Supabase; do not put it in Git:

```powershell
supabase secrets set GOOGLE_API_KEY=YOUR_KEY --project-ref veuzowtvsbxnyrfdbgfz
```

Deploy the functions used by the website:

```powershell
supabase functions deploy heritage-chat --project-ref veuzowtvsbxnyrfdbgfz
supabase functions deploy create-order --project-ref veuzowtvsbxnyrfdbgfz
supabase functions deploy upload-product-image --project-ref veuzowtvsbxnyrfdbgfz
```

If the production or preview site uses a different hostname, set the exact preview origin list:

```powershell
supabase secrets set ALLOWED_PREVIEW_ORIGINS=https://your-preview.example --project-ref veuzowtvsbxnyrfdbgfz
```

## 5. Use the admin page

Open `/quan-tri`, sign in with the administrator account, and edit the image, displayed price or visibility. The customer navigation intentionally does not link to this route.
