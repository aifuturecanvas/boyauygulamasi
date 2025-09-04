import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { categories } from "../constants/categories";

const CategoryScreen = ({ navigation }) => {
  const handleCategoryPress = (item) => {
    // Tıklandığında SubCategoryScreen'e yönlendir ve alt kategorileri gönder
    navigation.navigate("SubCategoryScreen", {
      title: item.main_name,
      subcategories: item.subcategories,
    });
  };

  const renderCategoryCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.main_color }]}
      onPress={() => handleCategoryPress(item)}
    >
      <Text style={styles.cardIcon}>{item.main_icon}</Text>
      <Text style={[styles.cardText, { color: item.main_textColor }]}>
        {item.main_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Kategoriler</Text>
        </View>
        <FlatList
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.main_id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },
  header: { paddingVertical: 20, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1F2937" },
  listContainer: { paddingHorizontal: 8 },
  card: {
    flex: 1,
    aspectRatio: 1,
    margin: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardIcon: { fontSize: 40 },
  cardText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 4,
  },
});

export default CategoryScreen;
