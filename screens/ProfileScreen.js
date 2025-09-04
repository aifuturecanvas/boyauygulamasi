import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  AVATAR_CATEGORIES,
  AVATAR_MAP,
  DEFAULT_AVATAR_KEY,
} from "../constants/avatars";
import { getUser, updateUser } from "../utils/db";

const ProfileScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [selectedAvatarKey, setSelectedAvatarKey] =
    useState(DEFAULT_AVATAR_KEY);
  const [activeTab, setActiveTab] = useState(AVATAR_CATEGORIES[0].title);

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        const user = await getUser();
        if (user) {
          setName(user.name || "");
          setSelectedAvatarKey(user.avatar || DEFAULT_AVATAR_KEY);
        }
      };
      loadUser();
    }, [])
  );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Hata", "Lütfen bir isim girin.");
      return;
    }
    try {
      await updateUser(name.trim(), selectedAvatarKey);
      Alert.alert("Başarılı", "Profilin güncellendi!", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Profil güncellenirken hata:", error);
      Alert.alert("Hata", "Profil güncellenirken bir sorun oluştu.");
    }
  };

  const currentAvatars =
    AVATAR_CATEGORIES.find((cat) => cat.title === activeTab)?.data || [];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={28} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>Profilim</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Kaydet</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.label}>Adın</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Adını buraya yaz"
              placeholderTextColor="#9CA3AF"
              maxLength={20}
            />
            <Text style={styles.hint}>Bu ad ana ekranda görünecek.</Text>

            <Text style={[styles.label, { marginTop: 24 }]}>
              Profil Resmini Seç
            </Text>

            <View style={styles.tabContainer}>
              {AVATAR_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.title}
                  style={[
                    styles.tab,
                    activeTab === cat.title && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab(cat.title)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === cat.title && styles.activeTabText,
                    ]}
                  >
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView contentContainerStyle={styles.avatarGrid}>
              {currentAvatars.map((avatarKey) => (
                <TouchableOpacity
                  key={avatarKey}
                  style={[
                    styles.avatarWrapper,
                    selectedAvatarKey === avatarKey && styles.avatarSelected,
                  ]}
                  onPress={() => setSelectedAvatarKey(avatarKey)}
                >
                  <Image
                    source={AVATAR_MAP[avatarKey]}
                    style={styles.avatarImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
  },
  backButton: { paddingRight: 10 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
  saveButton: { fontSize: 16, fontWeight: "bold", color: "#10B981" },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  label: { fontSize: 16, color: "#4B5563", marginBottom: 8 },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  hint: { marginTop: 8, fontSize: 14, color: "#6B7280" },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 99,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 99,
  },
  activeTab: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  tabText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#4B5563",
  },
  activeTabText: {
    color: "#8B5CF6",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingBottom: 40,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    margin: 8,
    borderRadius: 36,
    borderWidth: 2, // Kalınlığı azalttık
    borderColor: "#F3F4F6", // Varsayılan ince çerçeve
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF", // Arka planı beyaz yaptık
    // Hafif bir gölge ekledik
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarSelected: {
    borderColor: "#FBBF24",
    borderWidth: 3, // Seçiliyken biraz daha kalın
    // Seçiliyken gölgeyi belirginleştirdik
    shadowColor: "#FBBF24",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarImage: {
    width: 62, // Çerçeveye sığması için küçülttük
    height: 62,
    borderRadius: 31,
  },
});

export default ProfileScreen;
