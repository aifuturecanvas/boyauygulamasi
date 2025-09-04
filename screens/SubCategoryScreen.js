// app/SubCategoryScreen.jsx

import { Feather } from '@expo/vector-icons';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SubCategoryScreen = ({ route, navigation }) => {
  const { title, subcategories } = route.params; // Gelen veriyi al

  const handleSubCategoryPress = (categoryName) => {
  // Buradaki isim, App.js dosyasındaki isimle eşleşmeli
  navigation.navigate('ColoringList', { categoryName: categoryName });
};

  const renderCategoryCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: item.color }]}
      onPress={() => handleSubCategoryPress(item.name)}
    >
      <Text style={styles.cardIcon}>{item.icon}</Text>
      <Text style={[styles.cardText, { color: item.textColor }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={28} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
        </View>
        <FlatList
          data={subcategories}
          renderItem={renderCategoryCard}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    backButton: { marginRight: 16 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
    listContainer: { padding: 16 },
    card: { flex: 1, aspectRatio: 1, margin: 8, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    cardIcon: { fontSize: 40 },
    cardText: { marginTop: 10, fontSize: 14, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 4 }
});

export default SubCategoryScreen;
