// screens/MyGalleryScreen.js
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  LogBox,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { listImages, removeImage, toggleFavorite } from "../utils/db";
import { deleteAssetById } from "../utils/gallery";

// Eski kayıtlar için olabilecek ph:// uyarısını geçici sustur (migrasyon sonrası kaldırılabilir)
LogBox.ignoreLogs(["No suitable URL request handler found for ph://"]);

export default function MyGalleryScreen({ navigation }) {
  const [items, setItems] = useState(null); // null=ilk yükleme, []=boş
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null); // kart üstünde spinner

  // ph:// uri'ı varsa assetInfo ile file://'a çöz
  async function ensureFileUri(row) {
    if (row?.uri?.startsWith("file://")) return row.uri;
    if (!row?.assetId) return row.uri;
    try {
      const info = await MediaLibrary.getAssetInfoAsync(row.assetId);
      const uri = info?.localUri || info?.uri || row.uri;
      return uri;
    } catch {
      return row.uri;
    }
  }

  // Kart tıklandığında: resmi base64'e çevir → Coloring'e gönder
  const handleOpen = async (row) => {
    try {
      setOpeningId(row.id);
      const fileUri = await ensureFileUri(row);
      // iOS WKWebView'de güvenli olması için data URI ile gönder
      const b64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = `data:image/png;base64,${b64}`;

      navigation.navigate("Coloring", {
        image: {
          ...row, // Var olan resmin tüm bilgilerini gönderiyoruz (id, assetId, uri vb.)
          sayfaAdi: "Kaydedilen Çizim",
          resimUrl: dataUrl,
          isSaved: true,
        },
      });
    } catch (e) {
      console.error("Resim açılırken hata:", e);
      Alert.alert("Açılamadı", "Dosya okunurken sorun oluştu.");
    } finally {
      setOpeningId(null);
    }
  };

  // Sil: Fotoğraflar (asset) + uygulama dosyası + DB
  const handleDelete = async (row) => {
    Alert.alert(
      "Silinsin mi?",
      "Bu resmi kalıcı olarak silmek istiyor musun?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              // 1) Fotoğraflar'dan sil (varsa)
              if (row.assetId) {
                try {
                  await deleteAssetById(row.assetId);
                } catch {}
              }
              // 2) Uygulama içi dosyayı sil (file:// ise)
              if (row.uri?.startsWith("file://")) {
                try {
                  await FileSystem.deleteAsync(row.uri, { idempotent: true });
                } catch {}
              }
              // 3) DB'den kaldır
              await removeImage(row.id);

              // 4) Listeyi yenile
              setItems((prev) => (prev || []).filter((x) => x.id !== row.id));
            } catch (e) {
              Alert.alert("Hata", "Silme sırasında bir sorun oluştu.");
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (item) => {
    const newFavoriteState = !item.favorite;
    await toggleFavorite(item.id, newFavoriteState);
    setItems((prev) =>
      (prev || []).map((x) =>
        x.id === item.id ? { ...x, favorite: newFavoriteState } : x
      )
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await listImages({ album: "USER" }); // Kaydet ile eklediklerimiz
    setItems(
      (rows || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    );
    setLoading(false);
  }, []);

  // Ekran fokus olduğunda (veya geri dönüldüğünde) yenile
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || items === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Yükleniyor…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={28} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Galerim</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleOpen(item)}
            >
              <Image
                source={{ uri: item.uri }}
                style={styles.image}
                onError={async () => {
                  // Görsel yüklenemezse bir kez daha file:// çözmeyi dene
                  const uri = await ensureFileUri(item);
                  if (uri && uri !== item.uri) {
                    setItems((prev) =>
                      (prev || []).map((x) =>
                        x.id === item.id ? { ...x, uri } : x
                      )
                    );
                  }
                }}
              />
              {openingId === item.id && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => handleToggleFavorite(item)}
            >
              <Feather
                name="star"
                size={18}
                color={item.favorite ? "#FFD700" : "#fff"}
                fill={item.favorite ? "#FFD700" : "none"}
              />
            </TouchableOpacity>

            {/* Çöp kutusu */}
            <TouchableOpacity
              style={styles.trashBtn}
              onPress={() => handleDelete(item)}
            >
              <Feather name="trash-2" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>Henüz çizim yok. Bir çizim kaydetmeyi dener misin?</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
  },
  backButton: { marginRight: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  image: { width: "100%", aspectRatio: 3 / 4, backgroundColor: "#E5E7EB" },
  trashBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(224, 49, 49, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 99,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
});
