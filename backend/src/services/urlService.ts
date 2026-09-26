import { UrlModel, UrlDoc } from '../models/urlModel.js';
import { generateShortCode } from '../utils/generateShortCode.js';

export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:'; 
  } catch {
    return false;
  }
}

export const shortenUrl = async (originalUrl: string, host: string) => {
  const clean = originalUrl.trim();
  if (!isValidHttpUrl(clean)) {
    throw new Error('URL inválida');
  }
  
  let shortCode = '';
  let exists = true;
  
  while (exists) {
    shortCode = generateShortCode();
    const found = await UrlModel.findOne({ short_code: shortCode }).lean();
    exists = !!found;
  }
  
  const shortUrl = `${host}/${shortCode}`;
  
  const doc = await UrlModel.create({
    short_code: shortCode,
    original_url: clean,
    short_url: shortUrl,
  });
  
  return toUrlDto(doc);
};

type UrlFields = Pick<UrlDoc, 'short_code' | 'original_url' | 'short_url' | 'clicks' | 'created_at'>;

// Formato que consume el frontend (camelCase), igual en /shorten y /urls
export const toUrlDto = (doc: UrlFields) => ({
  shortCode: doc.short_code,
  originalUrl: doc.original_url,
  shortUrl: doc.short_url,
  clicks: doc.clicks,
  createdAt: doc.created_at,
});

export const getAllUrls = async () => {
  const docs = await UrlModel.find().sort({ created_at: -1 }).lean();
  return docs.map(toUrlDto);
};

export const getUrlByCode = async (code: string) => {
  return await UrlModel.findOne({ short_code: code }).lean();
};