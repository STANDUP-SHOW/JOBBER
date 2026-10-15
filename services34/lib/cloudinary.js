const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// `folder` keeps each platform's uploads in its own Cloudinary tree (e.g.
// "jobber/missions", "corporate/services34/missions") so nothing from one
// corporate platform ever lands mixed in with another's or with jobber.city's
// own — same isolation principle as the corporateAgencyId tagging in
// Postgres, just applied to file storage. Requires the unsigned upload
// preset to allow a caller-supplied folder (check the preset's "Asset
// Folder" setting in the Cloudinary dashboard if this silently has no effect).
export async function uploadImage(file, folder) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Le stockage d'images n'est pas configuré.");
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  if (folder) formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Échec de l'envoi de l'image");
  return data.secure_url;
}
