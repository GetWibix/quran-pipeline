import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const API_VERSION = "v22.0";

export interface TokenRefreshResult {
  userToken: string;
  userTokenExpiresAt: number;
  pageToken: string;
  pageTokenExpiresAt: number;
}

export async function debugToken(token: string): Promise<{
  type: string;
  expiresAt: number;
  scopes: string[];
  isValid: boolean;
}> {
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const url = `https://graph.facebook.com/${API_VERSION}/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`;
  const res = await fetch(url);
  const data = (await res.json()) as any;
  if (data.error) throw new Error(`debug_token: ${data.error.message}`);
  return {
    type: data.data.type,
    expiresAt: data.data.expires_at,
    scopes: data.data.scopes,
    isValid: data.data.is_valid,
  };
}

export async function refreshFacebookToken(): Promise<TokenRefreshResult> {
  const appId = process.env.META_APP_ID ?? "";
  const appSecret = process.env.META_APP_SECRET ?? "";
  const pageId = process.env.META_PAGE_ID ?? "";
  const userToken = process.env.META_USER_ACCESS_TOKEN ?? "";

  if (!appId || !appSecret) throw new Error("META_APP_ID أو META_APP_SECRET غير موجودين");
  if (!pageId) throw new Error("META_PAGE_ID غير موجود");
  if (!userToken) throw new Error("META_USER_ACCESS_TOKEN غير موجود");

  const exchangeUrl = `https://graph.facebook.com/${API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${userToken}`;
  const exchangeRes = await fetch(exchangeUrl);
  const exchangeData = (await exchangeRes.json()) as any;
  if (exchangeData.error) throw new Error(`فشل تمديد التوكن: ${exchangeData.error.message}`);

  const newUserToken = exchangeData.access_token;
  const expiresIn = exchangeData.expires_in ?? 5184000; // 60 يوم افتراضي
  const userTokenExpiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  const accountsUrl = `https://graph.facebook.com/${API_VERSION}/me/accounts?access_token=${newUserToken}`;
  const accountsRes = await fetch(accountsUrl);
  const accountsData = (await accountsRes.json()) as any;
  if (accountsData.error) throw new Error(`فشل جلب الصفحات: ${accountsData.error.message}`);

  const page = accountsData.data?.find((p: any) => p.id === pageId);
  if (!page) throw new Error(`الصفحة ${pageId} غير موجودة في قائمة الصفحات`);
  if (!page.access_token) throw new Error(`الصفحة ${pageId} ليس لها Page Access Token`);

  return {
    userToken: newUserToken,
    userTokenExpiresAt,
    pageToken: page.access_token,
    pageTokenExpiresAt: userTokenExpiresAt,
  };
}

export async function updateEnvInPlace(
  updates: Record<string, string>,
): Promise<void> {
  const envPath = join(process.cwd(), ".env");
  const content = await readFile(envPath, "utf-8");
  const lines = content.split("\n");

  const updatedLines = lines.map((line) => {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) return line;
    const key = line.slice(0, eqIdx).trim();
    if (updates[key] !== undefined) {
      return `${key}="${updates[key]}"`;
    }
    return line;
  });

  await writeFile(envPath, updatedLines.join("\n"), "utf-8");
}

export async function checkTokenHealth(): Promise<{
  daysRemaining: number;
  shouldRefresh: boolean;
  type: string;
  isValid: boolean;
}> {
  const token = process.env.META_PAGE_ACCESS_TOKEN ?? "";
  if (!token) return { daysRemaining: 0, shouldRefresh: true, type: "NONE", isValid: false };

  const info = await debugToken(token);
  const now = Math.floor(Date.now() / 1000);
  const daysRemaining = info.expiresAt ? Math.floor((info.expiresAt - now) / 86400) : 0;

  return {
    daysRemaining,
    shouldRefresh: !info.isValid || info.type !== "PAGE" || daysRemaining < 10,
    type: info.type,
    isValid: info.isValid,
  };
}
