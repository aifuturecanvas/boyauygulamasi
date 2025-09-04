// screens/FavoritesScreen.js
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { listImages, toggleFavorite, toggleRemoteFavorite } from "../utils/db";

export default function FavoritesScreen({ navigation }) {
  const [items, setItems] = useState(null); // null=ilk yükleme, []=boş
  const [loading, setLoading] = useState(true);

  // Hem yerel hem de uzak favorileri yükle
  const load = useCallback(async () => {
    setLoading(true);
    const rows = await listImages({ onlyFavorites: true });
    setItems(
      (rows || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    );
    setLoading(false);
  }, []);

  // Ekran fokus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Favorilerden kaldırma
  const handleToggleFavorite = async (item) => {
    // remote_id varsa bu bir Supabase favorisidir.
    if (item.remote_id) {
      await toggleRemoteFavorite({ id: item.remote_id });
    } else {
      // Değilse, yerel bir galeriden eklenmiştir.
      await toggleFavorite(item.id, false);
    }
    // Listeyi anında güncelle
    setItems((prev) => (prev || []).filter((x) => x.id !== item.id));
  };

  const handleOpen = (item) => {
    // Favorilerdeki bir resim her zaman remote URI'a sahip olmalı
    // Boyanıp kaydedilmişse bile, orijinaline yönlendiriyoruz
    navigation.navigate("Coloring", {
      image: {
        id: item.remote_id || item.id,
        sayfaAdi: item.name || "Favori",
        resimUrl: item.uri, // Veritabanındaki URI'ı kullan
      },
    });
  };

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
        <Text style={styles.title}>Favorilerim</Text>
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
              <Image source={{ uri: item.uri }} style={styles.image} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => handleToggleFavorite(item)}
            >
              <Feather name="star" size={18} color="#FFD700" fill="#FFD700" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>
              Henüz favorin yok. Beğendiğin resimlerdeki yıldıza dokun.
            </Text>
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
    padding: 20,
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
    position: "relative",
  },
  image: { width: "100%", aspectRatio: 3 / 4, backgroundColor: "#E5E7EB" },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 99,
  },
});
