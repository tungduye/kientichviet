# Supabase setup for Kiến Tích Việt

Never commit `.env.local`, database passwords, service-role keys, OpenAI keys or an admin password.

## 1. Apply the database migrations

Open the Supabase SQL Editor for project `veuzowtvsbxnyrfdbgfz`, copy the entire contents of:

`supabase/migrations/20261028161000_product_catalog_admin.sql`

Run it once. It creates the catalog settings, the admin allowlist, the public product-image bucket and the RLS policies.

Then run `supabase/migrations/20261028234500_site_cms_and_ar.sql`. It creates draft/published website content, revision history and per-product AR configuration with Row Level Security.

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

Set the OpenAI secrets in Supabase; do not put them in Git:

```powershell
supabase secrets set OPENAI_API_KEY=YOUR_KEY OPENAI_MODEL=gpt-5.6-luna --project-ref veuzowtvsbxnyrfdbgfz
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

Open `/quan-tri`, sign in with the administrator account, then use:

- **Sản phẩm** to edit image, price and visibility.
- **Nội dung website** to save drafts, preview with `?preview=draft`, publish, or restore a prior revision.
- **Web AR** to enable each product and configure its `.glb` model and optional compiled `.mind` image target.

MindAR image tracking needs a visually distinctive source image compiled to `.mind`. Until that file is supplied, `/ar/:productId` deliberately falls back to the device's plane-placement AR through `<model-viewer>`. Camera access is requested only after the visitor presses the start button and production must use HTTPS.
