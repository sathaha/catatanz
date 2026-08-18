import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function NotesScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const getUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.log('Get user error:', error);
      return null;
    }
    return user;
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const user = await getUser();
      
      if (!user) {
        navigation.replace('Login');
        return;
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Load notes error:', error);
        Alert.alert('Error', error.message);
        return;
      }

      setNotes(data || []);
    } catch (error) {
      console.log('Load notes catch:', error);
      Alert.alert('Error', 'Gagal ambil data');
    } finally {
      setLoading(false);
    }
  };

  const showConfirm = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
      return;
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya', style: 'destructive', onPress: onConfirm }
      ]
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const saveNote = async () => {
    if (!title.trim()) {
      Alert.alert('Perhatian', 'Judul harus diisi');
      return;
    }

    try {
      setSaving(true);
      const user = await getUser();
      
      if (!user) {
        navigation.replace('Login');
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from('notes')
          .update({
            title: title.trim(),
            content: content.trim()
          })
          .eq('id', editingId)
          .eq('user_id', user.id);

        if (error) {
          console.log('Update error:', error);
          Alert.alert('Gagal', error.message);
          return;
        }

        Alert.alert('Berhasil', 'Catatan diupdate');
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([{
            user_id: user.id,
            title: title.trim(),
            content: content.trim()
          }]);

        if (error) {
          console.log('Insert error:', error);
          Alert.alert('Gagal', error.message);
          return;
        }
      }

      resetForm();
      await loadNotes();
    } catch (error) {
      console.log('Save error:', error);
      Alert.alert('Error', 'Gagal simpan');
    } finally {
      setSaving(false);
    }
  };

  const editNote = (note) => {
    setEditingId(note.id);
    setTitle(note.title || '');
    setContent(note.content || '');
  };

  const deleteNote = (id) => {
    showConfirm(
      'Hapus Catatan',
      'Yakin mau hapus?',
      async () => {
        try {
          const user = await getUser();
          
          if (!user) {
            navigation.replace('Login');
            return;
          }

          const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.log('Delete error:', error);
            Alert.alert('Gagal', error.message);
            return;
          }

          if (editingId === id) {
            resetForm();
          }

          await loadNotes();
        } catch (error) {
          console.log('Delete catch:', error);
          Alert.alert('Error', 'Gagal hapus');
        }
      }
    );
  };

  const logout = () => {
    showConfirm(
      'Logout',
      'Yakin mau keluar?',
      async () => {
        try {
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            Alert.alert('Gagal', error.message);
            return;
          }

          navigation.replace('Login');
        } catch (error) {
          console.log('Logout error:', error);
          Alert.alert('Error', 'Gagal logout');
        }
      }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.noteText} numberOfLines={2}>
          {item.content || 'Kosong'}
        </Text>
        <Text style={styles.noteDate}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.editBtn]} 
          onPress={() => editNote(item)}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.deleteBtn]} 
          onPress={() => deleteNote(item.id)}
        >
          <Text style={styles.deleteBtnText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Catatan Saya</Text>
          <Text style={styles.headerSub}>Simpan catatan disini</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editingId ? 'Edit Catatan' : 'Tambah Baru'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Judul"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Isi catatan..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={saveNote}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {editingId ? 'Update' : 'Simpan'}
            </Text>
          )}
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
            <Text style={styles.cancelBtnText}>Batal Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.listTitle}>Daftar Catatan</Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>Kosong</Text>
              <Text style={styles.emptySub}>Belum ada catatan</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2d3436',
  },

  headerSub: {
    color: '#636e72',
    marginTop: 2,
  },

  logoutBtn: {
    backgroundColor: '#ffeaa7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  logoutBtnText: {
    color: '#d63031',
    fontWeight: '600',
  },

  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  formTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 14,
  },

  input: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },

  textarea: {
    minHeight: 100,
  },

  saveBtn: {
    backgroundColor: '#0984e3',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  btnDisabled: {
    opacity: 0.6,
  },

  cancelBtn: {
    padding: 10,
    alignItems: 'center',
    marginTop: 6,
  },

  cancelBtnText: {
    color: '#636e72',
    fontWeight: '500',
  },

  listTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 12,
  },

  list: {
    paddingBottom: 40,
  },

  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  noteContent: {
    flex: 1,
    marginRight: 12,
  },

  noteTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2d3436',
  },

  noteText: {
    color: '#636e72',
    marginTop: 5,
  },

  noteDate: {
    fontSize: 11,
    color: '#b2bec3',
    marginTop: 8,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  editBtn: {
    backgroundColor: '#dfe6e9',
  },

  editBtnText: {
    color: '#2d3436',
    fontWeight: '600',
    fontSize: 13,
  },

  deleteBtn: {
    backgroundColor: '#ffeaa7',
  },

  deleteBtnText: {
    color: '#d63031',
    fontWeight: '600',
    fontSize: 13,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 8,
    color: '#636e72',
  },

  empty: {
    alignItems: 'center',
    padding: 40,
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 8,
  },

  emptySub: {
    color: '#b2bec3',
    marginTop: 4,
  },
});