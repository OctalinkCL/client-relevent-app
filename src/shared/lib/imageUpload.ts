import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'
import { validateImageFile } from './validateFile'

const PRESETS = {
  flyer:      { maxSizeMB: 0.5, maxWidthOrHeight: 1200, initialQuality: 0.80 },
  screenshot: { maxSizeMB: 1.0, maxWidthOrHeight: 1920, initialQuality: 0.88 },
  avatar:     { maxSizeMB: 0.3, maxWidthOrHeight: 400,  initialQuality: 0.85 },
} as const

type Preset = keyof typeof PRESETS

export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from('relevent-media').remove([path])
  if (error) throw error
}

export async function uploadImage(
  file: File,
  path: string,
  preset: Preset = 'flyer',
): Promise<{ url: string; path: string }> {
  validateImageFile(file)

  const compressed = await imageCompression(file, {
    ...PRESETS[preset],
    useWebWorker: true,
    fileType: 'image/jpeg',
  })

  const { error } = await supabase.storage
    .from('relevent-media')
    .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })

  if (error) throw error

  const { data } = supabase.storage.from('relevent-media').getPublicUrl(path)
  return { url: data.publicUrl, path }
}
