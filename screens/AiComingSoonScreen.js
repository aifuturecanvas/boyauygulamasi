import { Feather, FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AiComingSoonScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={28} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Yapay Zeka</Text>
      </View>
      <View style={styles.container}>
        <FontAwesome5 name="magic" size={60} color="#8B5CF6" />
        <Text style={styles.mainText}>Çok Yakında!</Text>
        <Text style={styles.subText}>
          Hayalindeki boyama sayfasını oluşturabileceğin yapay zeka özelliği
          üzerinde çalışıyoruz. Takipte kal!
        </Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#F9FAFB",
  },
  mainText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 20,
  },
  subText: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
  },
  goBackButton: {
    marginTop: 30,
    backgroundColor: "#8B5CF6",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 999,
  },
  goBackButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AiComingSoonScreen;
