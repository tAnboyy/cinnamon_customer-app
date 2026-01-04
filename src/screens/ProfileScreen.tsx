import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const STORAGE_KEYS = {
  DEFAULT_CONTACT: 'user_default_contact_number',
  DEFAULT_NOTES: 'user_default_notes',
};

const ProfileScreen = () => {
  const [defaultContact, setDefaultContact] = useState('');
  const [defaultNotes, setDefaultNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDefaults();
  }, []);

  const loadDefaults = async () => {
    try {
      setLoading(true);
      const [contact, notes] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_CONTACT),
        AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_NOTES),
      ]);
      
      if (contact) setDefaultContact(contact);
      if (notes) setDefaultNotes(notes);
      
      console.log('[ProfileScreen] Loaded defaults:', { contact, notes });
    } catch (error) {
      console.error('[ProfileScreen] Failed to load defaults:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDefaults = async () => {
    try {
      setSaving(true);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_CONTACT, defaultContact),
        AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_NOTES, defaultNotes),
      ]);
      
      console.log('[ProfileScreen] Saved defaults:', { defaultContact, defaultNotes });
      Alert.alert('Success', 'Default contact and notes saved successfully!');
    } catch (error) {
      console.error('[ProfileScreen] Failed to save defaults:', error);
      Alert.alert('Error', 'Failed to save defaults. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const clearDefaults = async () => {
    Alert.alert(
      'Clear Defaults',
      'Are you sure you want to clear your saved contact and notes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.DEFAULT_CONTACT),
                AsyncStorage.removeItem(STORAGE_KEYS.DEFAULT_NOTES),
              ]);
              setDefaultContact('');
              setDefaultNotes('');
              Alert.alert('Success', 'Defaults cleared successfully!');
            } catch (error) {
              console.error('[ProfileScreen] Failed to clear defaults:', error);
              Alert.alert('Error', 'Failed to clear defaults.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await auth.signOut();
      
      // Sign out from Google Sign-In to clear cached credentials
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        // Google Sign-In might not be signed in, that's okay
        console.log('[ProfileScreen] Google Sign-In not active');
      }
      
      console.log('[ProfileScreen] Logout successful');
    } catch (e) {
      console.error('Logout failed', e);
      Alert.alert('Logout failed', 'Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      
      <View style={styles.userInfo}>
        <Text style={styles.label}>Email: </Text>
        <Text style={styles.emailText}>{auth.currentUser?.email || 'Not signed in'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Order Information</Text>
        <Text style={styles.sectionSubtitle}>
          These will auto-fill when you checkout, saving you time on every order.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Default Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 9842429243"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={defaultContact}
            onChangeText={setDefaultContact}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Default Notes (allergies/preferences)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., No nuts, extra spicy"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={defaultNotes}
            onChangeText={setDefaultNotes}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
            onPress={saveDefaults}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {saving ? 'Saving...' : 'Save Defaults'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearDefaults}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.clearButtonText]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginTop: 12,
  },
  userInfo: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#000',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButtonText: {
    color: '#000',
  },
  logoutBtn: {
    height: 44,
    borderRadius: 8,
    backgroundColor: '#ff5252',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
