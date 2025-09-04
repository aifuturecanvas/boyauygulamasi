import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabaseClient';

export default function GalleryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_creations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /><Text>Yükleniyor…</Text></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <Feather name="arrow-left" size={28} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Galerim (AI)</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Coloring', {
              image: { id: item.id, sayfaAdi: item.prompt || 'AI', resimUrl: item.url }
            })}
          >
            <Image source={{ uri: item.url }} style={styles.image} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.center}><Text>Henüz görsel yok.</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: 'white' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  card: { flex: 1, margin: 6, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', elevation: 2 },
  image: { width: '100%', aspectRatio: 3/4 },
});
