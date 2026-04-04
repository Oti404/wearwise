import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { AuthInput, AuthButton } from './AuthUI';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { LocationPicker } from './LocationPicker';
import { MapPin, CheckCircle2 } from 'lucide-react-native';

const RegisterScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp, loading } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    parola: '',
    phone: '',
    tara: '',
    localitate: '',
    adresa: '',
    latitude: 0,
    longitude: 0,
  });

  const [isMapVisible, setIsMapVisible] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.firstName) newErrors.firstName = 'First name is required.';
    if (!form.lastName) newErrors.lastName = 'Last name is required.';
    
    if (!form.email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email format.';
    }

    if (!form.parola) {
      newErrors.parola = 'Password is required.';
    } else if (form.parola.length < 6) {
      newErrors.parola = 'Password must be at least 6 characters.';
    }

    if (!form.phone) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = 'Invalid number.';
    }

    if (!locationSelected) {
      newErrors.location = 'Location is required to see nearby clothes.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleLocationConfirm = (loc: { address: string; latitude: number; longitude: number; city?: string }) => {
    setForm(prev => ({
      ...prev,
      adresa: loc.address,
      localitate: loc.city || loc.address.split(',')[0],
      tara: 'Romania',
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
    setLocationSelected(true);
    if (errors.location) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.location;
        return next;
      });
    }
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await signUp(form);
    } catch (err: any) {
      if (err.message.includes('email')) {
        setErrors(prev => ({ ...prev, email: err.message }));
      } else if (err.message.includes('telefon')) {
        setErrors(prev => ({ ...prev, phone: err.message }));
      } else {
        Alert.alert('Registration error', err.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Sparkles size={32} color="#F4C542" />
          </View>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join the WearWise community today.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <AuthInput 
                label="First Name" 
                placeholder="Eg. John" 
                value={form.firstName}
                error={errors.firstName}
                onChangeText={(v) => handleChange('firstName', v)}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <AuthInput 
                label="Last Name" 
                placeholder="Eg. Doe" 
                value={form.lastName}
                error={errors.lastName}
                onChangeText={(v) => handleChange('lastName', v)}
              />
            </View>
          </View>

          <AuthInput 
            label="Email" 
            placeholder="email@example.com" 
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            error={errors.email}
            onChangeText={(v) => handleChange('email', v)}
          />

          <AuthInput 
            label="Password" 
            placeholder="Min 6 characters" 
            secureTextEntry
            value={form.parola}
            error={errors.parola}
            onChangeText={(v) => handleChange('parola', v)}
          />

          <AuthInput 
            label="Phone number" 
            placeholder="phone number" 
            keyboardType="phone-pad"
            value={form.phone}
            error={errors.phone}
            onChangeText={(v) => handleChange('phone', v)}
          />

          <View style={styles.divider}>
            <Text style={styles.dividerText}>Location</Text>
          </View>

          <TouchableOpacity 
            style={[
              styles.locationBtn, 
              locationSelected && styles.locationBtnSuccess,
              errors.location && styles.locationBtnError
            ]}
            onPress={() => setIsMapVisible(true)}
            activeOpacity={0.8}
          >
            {locationSelected ? (
              <>
                <CheckCircle2 size={20} color="#27AE60" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationBtnTextSuccess}>Location Set</Text>
                  <Text style={styles.locationSubtext} numberOfLines={1}>{form.adresa}</Text>
                </View>
              </>
            ) : (
              <>
                <MapPin size={20} color="#5A2D82" />
                <Text style={styles.locationBtnText}>Choose Location on Map</Text>
              </>
            )}
          </TouchableOpacity>
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

          <View style={{ marginTop: 20 }}>
            <AuthButton 
              title="Register" 
              onPress={handleRegister} 
              loading={loading}
            />
          </View>

          <TouchableOpacity 
            onPress={() => router.push('/login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <LocationPicker 
          visible={isMapVisible}
          onClose={() => setIsMapVisible(false)}
          onConfirm={handleLocationConfirm}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#5A2D82',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(43, 43, 43, 0.5)',
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  divider: {
    marginVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(90, 45, 130, 0.1)',
    alignItems: 'center',
  },
  dividerText: {
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 12,
    bottom: -10,
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(90, 45, 130, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 15,
    color: 'rgba(43, 43, 43, 0.6)',
    fontWeight: '500',
  },
  loginLinkBold: {
    color: '#8E44AD',
    fontWeight: '800',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(90, 45, 130, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  locationBtnSuccess: {
    borderColor: 'rgba(39, 174, 96, 0.2)',
    backgroundColor: 'rgba(39, 174, 96, 0.02)',
  },
  locationBtnError: {
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  locationBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A2D82',
  },
  locationBtnTextSuccess: {
    fontSize: 14,
    fontWeight: '900',
    color: '#27AE60',
  },
  locationSubtext: {
    fontSize: 11,
    color: 'rgba(43, 43, 43, 0.5)',
    fontWeight: '600',
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#E74C3C',
    fontWeight: '700',
    marginTop: 8,
    marginLeft: 4,
  },
});

export default RegisterScreen;
