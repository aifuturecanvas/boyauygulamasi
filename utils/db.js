// utils/db.js  (SDK 53 uyumlu, async API)
import * as SQLite from "expo-sqlite";

// Tek bir kez aç, her yerde await ile kullan
const dbPromise = SQLite.openDatabaseAsync("boyama.db");

// Sütunların var olup olmadığını kontrol edip ekleyen yardımcı fonksiyon
async function addColumnIfNotExists(db, tableName, columnName, columnType) {
  const columns = await db.getAllAsync(`PRAGMA table_info(${tableName});`);
  if (!columns.some((column) => column.name === columnName)) {
    await db.execAsync(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType};`
    );
    console.log(`"${columnName}" sütunu "${tableName}" tablosuna eklendi.`);
  }
}

export async function initDb() {
  const db = await dbPromise;
  // Ana Schema
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY NOT NULL,
      assetId TEXT,
      uri TEXT,
      album TEXT,
      favorite INTEGER DEFAULT 0,
      createdAt INTEGER
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT,
      avatar TEXT
    );
  `);

  // Gerekli sütunları kontrol et ve ekle
  await addColumnIfNotExists(db, "images", "remote_id", "TEXT");
  await addColumnIfNotExists(db, "images", "name", "TEXT");
  await addColumnIfNotExists(db, "user", "avatar", "TEXT");
}

// --- User Fonksiyonları ---
export async function getUser() {
  const db = await dbPromise;
  return await db.getFirstAsync("SELECT * FROM user WHERE id = 1");
}

export async function updateUser(name, avatar) {
  const db = await dbPromise;
  return await db.runAsync(
    `INSERT INTO user (id, name, avatar) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar;`,
    [name, avatar]
  );
}

// --- Image Fonksiyonları ---

export const uid = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export async function insertImage({
  id,
  assetId,
  uri,
  album,
  createdAt,
  remote_id,
  name,
}) {
  const db = await dbPromise;
  await db.runAsync(
    "INSERT INTO images (id, assetId, uri, album, createdAt, remote_id, name) VALUES (?,?,?,?,?,?,?)",
    [id, assetId, uri, album, createdAt, remote_id, name]
  );
}

export async function updateImageRecord(id, newAssetId, newUri) {
  const db = await dbPromise;
  const now = Date.now();
  await db.runAsync(
    "UPDATE images SET assetId = ?, uri = ?, createdAt = ? WHERE id = ?",
    [newAssetId, newUri, now, id]
  );
}

export async function listImages({ onlyFavorites = false, album } = {}) {
  const db = await dbPromise;
  let sql = "SELECT * FROM images";
  const cond = [];
  const args = [];

  if (onlyFavorites) {
    cond.push("favorite = 1 AND remote_id IS NOT NULL");
  }

  if (album) {
    cond.push("album = ?");
    args.push(album);
  }
  if (cond.length) {
    sql += " WHERE " + cond.join(" AND ");
  }
  sql += " ORDER BY createdAt DESC";

  const rows = await db.getAllAsync(sql, args);
  return rows;
}

export async function isFavorite(remote_id) {
  const db = await dbPromise;
  const result = await db.getFirstAsync(
    "SELECT favorite FROM images WHERE remote_id = ?",
    [remote_id]
  );
  return result ? result.favorite === 1 : false;
}

export async function toggleFavorite(imageItem) {
  const db = await dbPromise;
  const { remote_id, sayfaAdi, resimUrl } = imageItem;

  const existing = await db.getFirstAsync(
    "SELECT id, favorite FROM images WHERE remote_id = ?",
    [remote_id]
  );

  if (existing) {
    const newFavState = existing.favorite ? 0 : 1;
    await db.runAsync("UPDATE images SET favorite = ? WHERE id = ?", [
      newFavState,
      existing.id,
    ]);
    return newFavState === 1;
  } else {
    await insertImage({
      id: uid(),
      remote_id: remote_id,
      name: sayfaAdi,
      uri: resimUrl,
      album: "REMOTE_FAVORITE",
      favorite: 1,
      createdAt: Date.now(),
    });
    return true;
  }
}

export async function removeImage(id) {
  const db = await dbPromise;
  await db.runAsync("DELETE FROM images WHERE id = ?", [id]);
}

// Ödüller için fonksiyonlar
export async function countImages() {
  const db = await dbPromise;
  const result = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM images WHERE album = 'USER'"
  );
  return result ? result.count : 0;
}

export async function countFavorites() {
  const db = await dbPromise;
  const result = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM images WHERE favorite = 1 AND remote_id IS NOT NULL"
  );
  return result ? result.count : 0;
}
