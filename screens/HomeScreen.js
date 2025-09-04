import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AVATAR_MAP, DEFAULT_AVATAR_KEY } from "../constants/avatars";
import { getUser } from "../utils/db";

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        const userData = await getUser();
        if (userData) {
          setUser({
            name: userData.name || "Merhaba!",
            // Veritabanından gelen anahtarı kullanarak haritadan doğru resmi buluyoruz.
            avatar:
              AVATAR_MAP[userData.avatar] || AVATAR_MAP[DEFAULT_AVATAR_KEY],
          });
        } else {
          setUser({
            name: "Merhaba!",
            avatar: AVATAR_MAP[DEFAULT_AVATAR_KEY],
          });
        }
      };
      loadUser();
    }, [])
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFBEB" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.profileContainer}
              onPress={() => navigation.navigate("Profile")}
            >
              <Image source={user.avatar} style={styles.avatar} />
              <View style={styles.profileTextContainer}>
                <Text style={styles.greetingText}>Merhaba, {user.name}!</Text>
                <View style={styles.editProfileRow}>
                  <Feather
                    name="edit-3"
                    size={12}
                    color="#6B7280"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.editProfileText}>Profili düzenle</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.parentalControlButton}
              onPress={() => navigation.navigate("ParentalLock")}
            >
              <Feather name="lock" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => navigation.navigate("Category")}
            >
              <Text style={styles.mainButtonText}>Hadi Boyayalım!</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => navigation.navigate("AiComingSoon")}
            >
              <FontAwesome5 name="magic" size={22} color="white" />
              <Text style={styles.aiButtonText}>Yapay Zeka ile Yarat</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate("Home")}
            >
              <FontAwesome5 name="home" size={28} color="#F59E0B" />
              <Text style={[styles.navText, { color: "#F59E0B" }]}>
                Anasayfa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate("MyGalleryScreen")}
            >
              <Feather name="image" size={28} color="#9CA3AF" />
              <Text style={styles.navText}>Galerim</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate("Favorites")}
            >
              <Feather name="star" size={28} color="#9CA3AF" />
              <Text style={styles.navText}>Favoriler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate("Awards")}
            >
              <Feather name="award" size={28} color="#9CA3AF" />
              <Text style={styles.navText}>Ödüllerim</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate("Gallery")}
            >
              <Feather name="image" size={28} color="#9CA3AF" />
              <Text style={styles.navText}>Galeri (AI)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFBEB" },
  container: { flex: 1, flexDirection: "column" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  profileContainer: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "#FBBF24",
  },
  profileTextContainer: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  editProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  editProfileText: {
    fontSize: 12,
    color: "#6B7280",
  },
  parentalControlButton: {
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 999,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  mainButton: {
    width: "100%",
    paddingVertical: 24,
    backgroundColor: "#FBBF24",
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  mainButtonText: { fontSize: 28, fontWeight: "800", color: "white" },
  aiButton: {
    width: "100%",
    paddingVertical: 20,
    backgroundColor: "#8B5CF6",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonText: { fontSize: 20, fontWeight: "bold", color: "white" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  navItem: { alignItems: "center", gap: 2 },
  navText: { fontSize: 10, color: "#6B7280", fontWeight: "600" },
});

export default HomeScreen;
