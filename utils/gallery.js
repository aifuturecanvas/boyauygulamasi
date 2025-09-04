// utils/gallery.js
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

const MAIN_ALBUM = "Boyama Uygulamasi";
const AI_ALBUM = "Boyama Uygulamasi AI";

export async function ensurePermission() {
  const { status, granted } = await MediaLibrary.requestPermissionsAsync();
  if (!granted || status !== "granted")
    throw new Error("Galeri izni verilmedi");
}

/**
 * data:image/png;base64,... görseli:
 * 1) Fotoğraflar kütüphanesine ekler (Recents + varsa albüm)
 * 2) Uygulamanın Documents klasöründe KALICI bir kopya oluşturur (file://)
 *    -> DB'ye BU appUri kaydedilir (ph:// değil!)
 */
export async function saveBase64PNGToGallery(dataUrl, { isAI = false } = {}) {
  await ensurePermission();

  // Base64'ü geçici dosyaya yaz
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const tmpPath = `${FileSystem.cacheDirectory}boyama_${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(tmpPath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Fotoğraflara ekle (Recents)
  const asset = await MediaLibrary.createAssetAsync(tmpPath);

  // Albüme eklemeyi dene (başarısız olabilir; kritik değil)
  try {
    const albumName = isAI ? AI_ALBUM : MAIN_ALBUM;
    let album = await MediaLibrary.getAlbumAsync(albumName);
    if (!album) {
      album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }
  } catch (e) {
    console.warn("Album add skipped:", e?.message ?? e);
  }

  // Uygulama içi KALICI kopya (file://)
  const baseDir = FileSystem.documentDirectory + "boyama/";
  try {
    await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
  } catch {}
  const appUri = baseDir + `${isAI ? "ai_" : "user_"}${Date.now()}.png`;
  await FileSystem.copyAsync({ from: tmpPath, to: appUri });

  return { asset, appUri };
}

export async function deleteAssetById(assetId) {
  await ensurePermission();
  return MediaLibrary.deleteAssetsAsync([assetId]);
}

export { AI_ALBUM, MAIN_ALBUM };
