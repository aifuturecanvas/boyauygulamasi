import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../supabaseClient";

// Stili backend'in anladığı 'level' parametresine çevirir.
const styleKeyToLevel = (key) => (key === "simple" ? "simple" : "detail");

// Supabase Edge Function'ını çağırarak görsel üretir.
const generateAiImage = async ({ topic, level }) => {
  const { data, error } = await supabase.functions.invoke("ai-svg-generator", {
    body: { topic, level },
  });

  if (error) {
    throw new Error(error.message || "Edge Function bir hata döndürdü.");
  }
  if (!data?.url) {
    throw new Error("Beklenmedik yanıt: URL bulunamadı.");
  }

  // Coloring ekranının beklediği obje yapısını döndür
  return {
    id: `ai-${Date.now()}`,
    sayfaAdi: topic || "AI Çizim",
    resimUrl: data.url,
  };
};

const AiResultScreen = ({ route, navigation }) => {
  const { image: initialImage, prompt, styleKey } = route.params;
  const [image, setImage] = useState(initialImage);
  const [loading, setLoading] = useState(false);

  const handleGeneration = async (isVariation = false) => {
    setLoading(true);
    try {
      // Varyasyon için prompt'u hafifçe değiştirebiliriz.
      const topic = isVariation ? `${prompt}, farklı bir stilde` : prompt;
      const level = styleKeyToLevel(styleKey);

      const newImage = await generateAiImage({ topic, level });
      setImage(newImage);
    } catch (e) {
      console.error("AI Oluşturma Hatası:", e);
      Alert.alert("Hata", "Görsel oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const goColoring = () => {
    navigation.navigate("Coloring", { image });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          disabled={loading}
        >
          <Feather name="arrow-left" size={28} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Sonuç</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.previewBox}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={{ marginTop: 8, color: "#6B7280" }}>
                Oluşturuluyor…
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: image.resimUrl }}
              style={styles.preview}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, loading && { opacity: 0.6 }]}
            onPress={() => handleGeneration(false)}
            disabled={loading}
          >
            <Text style={styles.secondaryText}>Yeniden Oluştur</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, loading && { opacity: 0.6 }]}
            onPress={() => handleGeneration(true)}
            disabled={loading}
          >
            <Text style={styles.secondaryText}>Varyasyon Üret</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          onPress={goColoring}
          disabled={loading}
        >
          <Text style={styles.primaryText}>Boyamaya Başla</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { paddingRight: 8, paddingVertical: 4 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  container: { padding: 16, gap: 16 },
  previewBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    minHeight: 380,
    justifyContent: "center",
    alignItems: "center",
  },
  preview: { width: "100%", height: 420 },
  loadingBox: { height: 420, justifyContent: "center", alignItems: "center" },
  btnRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#4F46E5", fontWeight: "700" },
  primaryBtn: {
    paddingVertical: 16,
    backgroundColor: "#8B5CF6",
    borderRadius: 999,
    alignItems: "center",
  },
  primaryText: { color: "white", fontSize: 16, fontWeight: "800" },
});

export default AiResultScreen;
