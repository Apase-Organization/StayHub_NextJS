import { randomUUID, createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type UploadResult = {
  url: string;
  publicId: string;
};

const useCloudinary = process.env.UPLOAD_USE_CLOUDINARY === "true";

export async function uploadImage(
  buffer: Buffer,
  folder = "stayhub"
): Promise<UploadResult> {
  return useCloudinary
    ? uploadToCloudinary(buffer, folder)
    : uploadLocal(buffer, folder);
}

export async function deleteImage(publicId: string) {
  if (!publicId) return;
  return useCloudinary ? deleteFromCloudinary(publicId) : deleteLocal(publicId);
}

async function uploadLocal(
  buffer: Buffer,
  folder: string
): Promise<UploadResult> {
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "-");
  const uploadRoot = process.env.UPLOAD_LOCAL_DIRECTORY ?? "public/uploads";
  const dir = path.join(process.cwd(), uploadRoot, safeFolder);
  const fileName = `${randomUUID()}.jpg`;

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);

  const publicId = path.posix.join(safeFolder, fileName);
  return { url: `/uploads/${publicId}`, publicId };
}

async function deleteLocal(publicId: string) {
  const uploadRoot = process.env.UPLOAD_LOCAL_DIRECTORY ?? "public/uploads";
  await rm(path.join(process.cwd(), uploadRoot, publicId), { force: true });
}

async function uploadToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<UploadResult> {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = sign({ folder, timestamp });
  const form = new FormData();

  form.append("file", new Blob([Uint8Array.from(buffer)]), "image.jpg");
  form.append("folder", folder);
  form.append("timestamp", timestamp);
  form.append("api_key", apiKey);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    }
  );
  const data = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.secure_url || !data.public_id) {
    throw new Error(data.error?.message ?? "Cloudinary upload failed");
  }

  return { url: data.secure_url, publicId: data.public_id };
}

async function deleteFromCloudinary(publicId: string) {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = sign({ public_id: publicId, timestamp });
  const form = new FormData();

  form.append("public_id", publicId);
  form.append("timestamp", timestamp);
  form.append("api_key", apiKey);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!response.ok) throw new Error("Cloudinary delete failed");
}

function sign(params: Record<string, string>) {
  const query = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(`${query}${requiredEnv("CLOUDINARY_API_SECRET")}`)
    .digest("hex");
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
