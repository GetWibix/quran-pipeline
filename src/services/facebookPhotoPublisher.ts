export interface FacebookPhotoResult {
  facebookPhotoId: string;
  postUrl: string;
}

const PAGE_ID = process.env.META_PAGE_ID ?? "";
const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN ?? "";
const API_VERSION = "v22.0";

function isConfigured(): boolean {
  return Boolean(PAGE_ID && ACCESS_TOKEN);
}

export async function publishPhotoToFacebook(
  imageBuffer: Buffer,
  caption: string
): Promise<FacebookPhotoResult> {
  if (!isConfigured()) {
    console.warn("⚠️ Facebook Photo: META_PAGE_ID أو ACCESS_TOKEN غير موجودين — تخطي");
    return { facebookPhotoId: "", postUrl: "" };
  }

  const form = new FormData();
  form.append("source", new Blob([imageBuffer]), "poster.png");
  form.append("message", caption);
  form.append("published", "true");

  const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/photos?access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json() as any;

  if (data.error) throw new Error(`Facebook Photo API: ${data.error.message}`);

  const photoId = String(data.id ?? "");

  return {
    facebookPhotoId: photoId,
    postUrl: photoId ? `https://facebook.com/photo.php?fbid=${photoId}` : "",
  };
}
