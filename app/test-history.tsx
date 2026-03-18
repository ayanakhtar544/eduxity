import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TestHistory() {
  const router = useRouter();
  const dummyHistory = [{ id: '1', title: 'JEE Mock Test' }, { id: '2', title: 'Physics Quiz' }];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Past Tests</Text>
      <FlatList 
        data={dummyHistory}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push(`/test-analytics/${item.id}`)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.viewLink}>View Result →</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc', paddingTop: 60 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  viewLink: { color: '#4f46e5', marginTop: 5, fontSize: 12 }
});