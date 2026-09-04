import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const exePath = resolve('desktop/release/Habico Portal-Setup-1.0.0.exe')
const fileBuffer = readFileSync(exePath)
const filePath = 'Habico Portal-Setup-1.0.0.exe'

console.log(`Uploading ${filePath} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)...`)

const { data, error } = await supabase.storage
  .from('public')
  .upload(filePath, fileBuffer, {
    contentType: 'application/x-msdownload',
    upsert: true
  })

if (error) {
  console.error('Upload failed:', error)
  process.exit(1)
}

const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath)
console.log('Upload succeeded!')
console.log('Public URL:', urlData.publicUrl)
