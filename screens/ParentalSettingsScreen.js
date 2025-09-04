import { Feather } from "@expo/vector-icons";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ParentalSettingsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={28} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Ebeveyn Ayarları</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.container}>
        <Feather name="tool" size={48} color="#D1D5DB" />
        <Text style={styles.comingSoonText}>Çok Yakında!</Text>
        <Text style={styles.descriptionText}>
          Bu alanda yakında uygulama ayarları ve kontrolleri yer alacaktır.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
  },
});

export default ParentalSettingsScreen;
