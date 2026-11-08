import { Link } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cart or Filters</Text>
      <Text style={styles.subtitle}>
        Use this modal screen for details.
      </Text>

      {/* Styled close button */}
      <Link href="/" asChild dismissTo>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Go back to Swipe</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FAF7F2', // App cream background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5A2D82', // Movul WearWise
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(43, 43, 43, 0.6)',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#5A2D82',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#F4C542', // Gold for contrast
    fontWeight: 'bold',
    fontSize: 16,
  },
});