import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' atau 'signup'

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Info', 'Email dan password harus diisi');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      Alert.alert('Info', 'Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          if (error.code === 'email_not_confirmed') {
            Alert.alert('Cek Email', 'Konfirmasi email dulu ya');
          } else {
            Alert.alert('Gagal', error.message);
          }
          return;
        }

        if (data?.user) {
          navigation.replace('Notes');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) {
          Alert.alert('Gagal', error.message);
          return;
        }

        if (data?.session) {
          Alert.alert('Berhasil', 'Akun berhasil dibuat');
          navigation.replace('Notes');
        } else {
          Alert.alert('Cek Email', 'Klik link konfirmasi di email kamu');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Ada masalah, coba lagi');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setEmail('');
    setPassword('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.icon}>📝</Text>
        <Text style={styles.title}>Catatan Saya</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Masuk ke akun kamu' : 'Buat akun baru'}
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="email@contoh.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder={mode === 'login' ? 'Password' : 'Minimal 6 karakter'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'login' ? 'Masuk' : 'Daftar'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
          <Text style={styles.toggleText}>
            {mode === 'login' 
              ? 'Belum punya akun? Daftar' 
              : 'Sudah punya akun? Masuk'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
  },

  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
    backgroundColor: '#f9fafb',
  },

  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  toggleButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  toggleText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
});