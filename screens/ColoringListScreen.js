import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
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
import { supabase } from "../supabaseClient";
import {
  getFavoriteStatusForRemoteIds,
  toggleRemoteFavorite,
} from "../utils/db";

const ColoringListScreen = ({ route, navigation }) => {
  const { categoryName } = route.params;
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set()); // Favori ID'lerini tutacak set

  const loadFavorites = async (imageIds) => {
    if (imageIds.length === 0) return;
    const favoriteSet = await getFavoriteStatusForRemoteIds(imageIds);
    setFavorites(favoriteSet);
  };

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("coloring_pages")
        .select("*")
        .eq("kategori", categoryName);
      if (error) throw error;
      if (data) {
        setImages(data);
        const imageIds = data.map((img) => img.id);
        await loadFavorites(imageIds);
      }
    } catch (error) {
      console.error(
        "Supabase'den veri çekilirken hata oluştu: ",
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [categoryName]);

  useFocusEffect(
    useCallback(() => {
      if (images.length > 0) {
        const imageIds = images.map((img) => img.id);
        loadFavorites(imageIds);
      }
    }, [images])
  );

  const handleImagePress = (imageItem) => {
    navigation.navigate("Coloring", { image: imageItem });
  };

  const handleToggleFavorite = async (item) => {
    const isCurrentlyFavorite = favorites.has(item.id);
    await toggleRemoteFavorite(item);
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyFavorite) {
        newSet.delete(item.id);
      } else {
        newSet.add(item.id);
      }
      return newSet;
    });
  };

  const renderImageCard = ({ item }) => {
    const isFavorite = favorites.has(item.id);
    return (
      <View style={styles.imageCard}>
        <TouchableOpacity onPress={() => handleImagePress(item)}>
          <Image source={{ uri: item.resimUrl }} style={styles.image} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleToggleFavorite(item)}
        >
          <Feather
            name="star"
            size={20}
            color={isFavorite ? "#FFD700" : "#9CA3AF"}
            // iOS'te dolgu efekti için fill kullanılıyor, Android'de sadece renk değişimi yeterli olur
            fill={isFavorite ? "#FFD700" : "none"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text>Resimler Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={28} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{categoryName}</Text>
        </View>
        <FlatList
          data={images}
          renderItem={renderImageCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text>Bu kategoride henüz resim yok.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
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
  listContainer: { padding: 16 },
  imageCard: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    position: "relative",
  },
  image: { width: "100%", aspectRatio: 3 / 4, borderRadius: 16 },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 6,
    borderRadius: 999,
  },
});

export default ColoringListScreen;
