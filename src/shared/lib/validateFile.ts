const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Solo se permiten imágenes JPG, PNG o WEBP')
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('La imagen no puede superar 10MB')
  }
}
