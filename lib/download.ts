/**
 * Fayllarni to'g'ridan-to'g'ri brauzerda yuklab olish yordamchisi.
 * Yangi tab ochib ketishining oldini oladi va toza fayl nomi bilan saqlaydi.
 */
export async function downloadFile(url: string, suggestedName?: string): Promise<boolean> {
  if (!url) return false;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Faylni yuklab bo'lmadi");

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const extMatch = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : (blob.type.includes("video") ? "mp4" : "jpg");

    let cleanName = suggestedName ? suggestedName.trim().replace(/[^a-zA-Z0-9_\-\u0400-\u04FF ]/g, "_") : "";
    if (!cleanName) {
      cleanName = `urokov-3d-${Date.now()}`;
    }
    if (!cleanName.endsWith(`.${ext}`)) {
      cleanName = `${cleanName}.${ext}`;
    }

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);

    return true;
  } catch (err) {
    console.warn("Direct blob download failed, falling back to anchor:", err);

    // Fallback: brauzer orqali to'g'ridan-to'g'ri yuklash
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName || "urokov-3d";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }
}
