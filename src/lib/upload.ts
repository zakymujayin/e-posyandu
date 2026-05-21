import { writeFile, mkdir } from "fs/promises"
import path from "path"

export interface UploadResult {
  url: string
  fileName: string
  mimeType: string
  size: number
}

async function uploadLocal(file: File): Promise<UploadResult> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })

  const ext = path.extname(file.name)
  const base = path.basename(file.name, ext)
  const safeName = `${base}-${Date.now()}${ext}`
  const filePath = path.join(uploadDir, safeName)

  await writeFile(filePath, buffer)

  return {
    url: `/uploads/${safeName}`,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  }
}

async function uploadCloudinary(file: File, config: { cloudName: string; apiKey: string; apiSecret: string }): Promise<UploadResult> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const formData = new FormData()
  formData.append("file", new Blob([buffer], { type: file.type }), file.name)
  formData.append("upload_preset", "e-posyandu")

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`,
    { method: "POST", body: formData }
  )

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.statusText}`)
  }

  const data = (await response.json()) as { secure_url: string; original_filename: string }
  return {
    url: data.secure_url,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  }
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
  const maxSize = 5 * 1024 * 1024

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipe file tidak diizinkan. Gunakan JPG, PNG, atau PDF.`)
  }

  if (file.size > maxSize) {
    throw new Error(`Ukuran file maksimal 5MB.`)
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY

  if (cloudName && apiKey) {
    return uploadCloudinary(file, {
      cloudName,
      apiKey,
      apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    })
  }

  return uploadLocal(file)
}

export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  return Promise.all(files.map(uploadFile))
}
