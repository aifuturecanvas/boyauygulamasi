import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../supabaseClient";

/**
 * MOCK anahtarı:
 * - true  => örnek (placeholder) görsel döner, backend'e istek atılmaz.
 * - false => Supabase Edge Function'a gerçek istek atılır.
 */
const USE_MOCK = false;

/** Hazır konu etiketleri */
const TOPIC_CHIPS = [
  "Kedi",
  "Dinozor",
  "Araba",
  "Prenses",
  "Uzay",
  "Çiftlik",
  "Robot",
  "Meyve",
];

/** Stil seçenekleri */
const STYLES = [
  { key: "line", label: "Çizgi Boyama" },
  { key: "kawaii", label: "Kawaii" },
  { key: "simple", label: "Süper Basit (3-6)" },
];

const AiCreationScreen = ({ navigation }) => {
  const [prompt, setPrompt] = useState("");
  const [styleKey, setStyleKey] = useState("line");
  const [loading, setLoading] = useState(false);

  const addChip = (chip) => setPrompt((p) => (p ? `${p}, ${chip}` : chip));

  /** Stil ipuçlarını tek yerde tutalım (şimdilik görsel amaçlı; backend kendi prompt’unu kuruyor) */
  const styleHints = useMemo(
    () => ({
      line: "clean bold outlines, simple shapes",
      kawaii: "kawaii style, cute faces, rounded shapes",
      simple: "very simple shapes for toddlers, minimal details",
    }),
    []
  );

  /** (Artık kullanılmıyor) — backend prompt’u kendi kuruyor
   * İstersen silmezsen de sorun değil. */
  const buildFullPrompt = () => {
    const clean = (text) =>
      String(text || "")
        .replace(/\s+/g, " ")
        .replace(/[^\p{L}\p{N}\s,.-]/gu, "") // emoji vs. çıkar
        .trim()
        .slice(0, 180); // aşırı uzunlukları kes
    return `coloring page for kids, black and white, bold clean lines, no background, ${
      styleHints[styleKey]
    }, ${clean(prompt)}`;
  };

  /** MOCK: gerçek API yerine örnek görsel */
  const mockCreate = async () => {
    await new Promise((r) => setTimeout(r, 1200));
    const imageUrl =
      "https://placehold.co/800x1000/FFFFFF/000000?text=Coloring+Preview";
    return {
      id: `ai-${Date.now()}`,
      sayfaAdi: prompt || "AI Çizim",
      resimUrl: imageUrl,
    };
  };

  // 'simple' → sade çizim, diğerleri → biraz detay
  const styleKeyToLevel = (key) => (key === "simple" ? "simple" : "detail");

  /** Gerçek çağrı: Supabase Edge Function (ai-svg-generator) */
  const realCreate = async ({ topic, level }) => {
    const { data, error } = await supabase.functions.invoke(
      "ai-svg-generator",
      {
        body: { topic, level },
      }
    );

    if (error) {
      throw new Error(error.message || "Edge Function hata döndürdü");
    }
    if (!data?.url) throw new Error("Beklenmedik yanıt: url gelmedi.");

    // Coloring ekranının beklediği obje yapısı
    return {
      id: `ai-${Date.now()}`,
      sayfaAdi: topic || "AI Çizim",
      resimUrl: data.url, // PNG HTTPS URL
    };
  };

  const handleCreate = async () => {
    const userText = (prompt || "").trim();
    if (!userText) {
      Alert.alert("Uyarı", "Önce kutucuğa ne çizmemi istediğini yaz 🙂");
      return;
    }

    setLoading(true);
    try {
      const topic = userText;
      const level = styleKeyToLevel(styleKey);

      const aiImage = USE_MOCK
        ? await mockCreate()
        : await realCreate({ topic, level });

      // Geliştirme: Direkt boyama yerine sonuç ekranına yönlendir
      navigation.navigate("AiResult", {
        image: aiImage,
        prompt: userText,
        styleKey,
      });
    } catch (e) {
      console.error("AI hata:", e);
      const msg =
        typeof e?.message === "string"
          ? e.message
          : "Oluşturma sırasında bir sorun oldu. Birazdan tekrar dene.";
      Alert.alert("Hata", msg);
    } finally {
      setLoading(false);
    }
  };

  const renderChip = ({ item }) => (
    <TouchableOpacity style={styles.chip} onPress={() => addChip(item)}>
      <Text style={styles.chipText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            disabled={loading}
          >
            <Feather name="arrow-left" size={28} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Hayalini Anlat</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <FontAwesome5 name="magic" size={44} color="#8B5CF6" />
          <Text style={styles.subtitle}>Ne çizmemi istersin?</Text>

          <FlatList
            data={TOPIC_CHIPS}
            renderItem={renderChip}
            keyExtractor={(it) => it}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          />

          <View style={styles.stylesRow}>
            {STYLES.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.styleBtn,
                  styleKey === s.key && styles.styleBtnActive,
                ]}
                onPress={() => setStyleKey(s.key)}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.styleText,
                    styleKey === s.key && styles.styleTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Uçan bir kedi veya uzayda bir dinozor..."
            placeholderTextColor="#9CA3AF"
            multiline
            editable={!loading}
            value={prompt}
            onChangeText={setPrompt}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (loading || !prompt.trim()) && styles.disabledButton,
            ]}
            onPress={handleCreate}
            disabled={loading || !prompt.trim()}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.createButtonText}>Oluştur</Text>
            )}
          </TouchableOpacity>
          {USE_MOCK ? (
            <Text style={styles.mockBadge}>TEST MODU (mock)</Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: { marginRight: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },

  content: { flex: 1, alignItems: "center", padding: 20 },
  subtitle: { fontSize: 18, color: "#4B5563", marginTop: 8, marginBottom: 14 },

  chipsRow: { paddingVertical: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    marginRight: 8,
  },
  chipText: { color: "#4F46E5", fontWeight: "600" },

  stylesRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 12 },
  styleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  styleBtnActive: { backgroundColor: "#8B5CF6", borderColor: "#8B5CF6" },
  styleText: { color: "#111827", fontWeight: "600" },
  styleTextActive: { color: "white" },

  input: {
    width: "100%",
    minHeight: 120,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  footer: { padding: 20 },
  createButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: { backgroundColor: "#C4B5FD" },
  createButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  mockBadge: {
    textAlign: "center",
    marginTop: 8,
    color: "#6B7280",
    fontSize: 12,
  },
});

export default AiCreationScreen;
