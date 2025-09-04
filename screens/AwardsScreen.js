// screens/AwardsScreen.js
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { countFavorites, countImages } from "../utils/db";

// Ödül listesi, 'type' alanı ile genişletildi
const AWARDS_DATA = [
  {
    id: "1",
    title: "İlk Adım",
    description: "İlk boyamanı tamamladın!",
    icon: "🎨",
    requiredCount: 1,
    type: "completed",
  },
  {
    id: "fav1",
    title: "Meraklı Göz",
    description: "İlk resmini favorilerine ekledin!",
    icon: "❤️",
    requiredCount: 1,
    type: "favorite",
  },
  {
    id: "2",
    title: "Acemi Sanatçı",
    description: "Toplam 3 resim boyadın.",
    icon: "🖌️",
    requiredCount: 3,
    type: "completed",
  },
  {
    id: "3",
    title: "Yükselen Yıldız",
    description: "Toplam 5 resim boyadın.",
    icon: "🌟",
    requiredCount: 5,
    type: "completed",
  },
  {
    id: "4",
    title: "Koleksiyoner",
    description: "Toplam 10 resim boyadın.",
    icon: "🏆",
    requiredCount: 10,
    type: "completed",
  },
  {
    id: "5",
    title: "Usta Sanatçı",
    description: "Toplam 20 resim boyadın.",
    icon: "🥇",
    requiredCount: 20,
    type: "completed",
  },
];

// Basit bir ilerleme çubuğu komponenti
const ProgressBar = ({ progress, total }) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0;
  return (
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
    </View>
  );
};

const AwardsScreen = ({ navigation }) => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  const loadAwards = useCallback(async () => {
    setLoading(true);
    try {
      const completed = await countImages({ album: "USER" });
      const favorites = await countFavorites();
      setCompletedCount(completed);

      const updatedAwards = AWARDS_DATA.map((award) => {
        const currentProgress =
          award.type === "completed" ? completed : favorites;
        const earned = currentProgress >= award.requiredCount;
        return {
          ...award,
          earned,
          progress: Math.min(currentProgress, award.requiredCount),
        };
      });
      setAwards(updatedAwards);
    } catch (error) {
      console.error("Ödüller yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAwards();
    }, [loadAwards])
  );

  const renderAward = ({ item }) => (
    <View style={[styles.awardCard, !item.earned && styles.awardCardLocked]}>
      {item.earned ? (
        <Text style={styles.awardIcon}>{item.icon}</Text>
      ) : (
        <View style={styles.lockIconContainer}>
          <Feather name="lock" size={32} color="#9CA3AF" />
        </View>
      )}
      <View style={styles.awardTextContainer}>
        <Text
          style={[styles.awardTitle, !item.earned && styles.awardTextLocked]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.awardDescription,
            !item.earned && styles.awardTextLocked,
          ]}
        >
          {item.description}
        </Text>
        {!item.earned && (
          <View style={styles.progressContainer}>
            <ProgressBar progress={item.progress} total={item.requiredCount} />
            <Text style={styles.progressText}>
              {item.progress} / {item.requiredCount}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryText}>
        Toplam <Text style={styles.summaryHighlight}>{completedCount}</Text>{" "}
        resim tamamladın. Harika gidiyorsun!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={28} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Ödüllerim</Text>
      </View>
      <FlatList
        data={awards}
        renderItem={renderAward}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={ListHeader}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  summaryContainer: {
    padding: 16,
    backgroundColor: "#E0E7FF",
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: "#3730A3",
    textAlign: "center",
  },
  summaryHighlight: {
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  awardCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  awardCardLocked: {
    backgroundColor: "#F3F4F6",
    elevation: 0,
  },
  awardIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  lockIconContainer: {
    width: 60,
    height: 60,
    marginRight: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  awardTextContainer: {
    flex: 1,
  },
  awardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  awardDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  awardTextLocked: {
    color: "#9CA3AF",
  },
  progressContainer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginRight: 8,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: "#4ADE80",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
});

export default AwardsScreen;
