// app/utils/createAiPage.js
import { supabase } from '../supabaseClient';

/**
 * Edge Function 'ai-svg-generator'ı çağırır ve { url, path, width, height } döner.
 * topic: kullanıcının girdiği konu (örn: "friendly astronaut")
 * level: "simple" bırak (çocuk boyaması için sade çizgiler)
 */
export async function createAiPage({ topic, level = 'simple' }) {
  // Supabase Functions -> ai-svg-generator
  const { data, error } = await supabase.functions.invoke('ai-svg-generator', {
    body: { topic, level },
  });

  if (error) {
    // hata mesajını yukarıya fırlat, ekranda göstereceğiz
    throw new Error(error.message || 'Edge Function hatası');
  }
  if (!data?.url) {
    throw new Error('Beklenmedik yanıt: url gelmedi.');
  }

  return data; // { url, path, width, height }
}
