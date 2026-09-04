## EXE Download Setup

The EXE (`Habico Portal-Setup-1.0.0.exe`) is copied from `desktop/release/` into `public/` so Vercel serves it as a static asset at `/Habico%20Portal-Setup-1.0.0.exe`.

- **Vercel Hobby limitation**: static files over 40MB may not be served. The EXE is ~100MB.
- **If download fails** (404 / "app not available"): Upload the EXE to Supabase Storage (`public` bucket) and update the URL in `__root.tsx:129` and `download.tsx:26`.
- To upload to Supabase Storage, run: `node scripts/upload-exe.mjs` (requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars in your shell).
- The bucket must allow `application/x-msdownload` MIME type and have `file_size_limit >= 200MB`. Run `supabase/fix_all_rls_and_migrations.sql` in Supabase SQL Editor (includes the EXE migration).

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
