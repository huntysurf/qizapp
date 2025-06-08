
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  View,
  TextInput,
  Modal
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface QuizFile {
  id: string;
  name: string;
  data: any[];
  createdAt: string;
  folderId?: string;
}

interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export default function FilesScreen() {
  const [files, setFiles] = useState<QuizFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(true);

  // Database operations
  const saveToDatabase = async (key: string, data: any) => {
    try {
      const Database = (await import('replit')).Database;
      const db = new Database();
      await db.set(key, JSON.stringify(data));
    } catch (error) {
      console.error('Database save error:', error);
    }
  };

  const loadFromDatabase = async (key: string) => {
    try {
      const Database = (await import('replit')).Database;
      const db = new Database();
      const data = await db.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Database load error:', error);
      return null;
    }
  };

  const deleteFromDatabase = async (key: string) => {
    try {
      const Database = (await import('replit')).Database;
      const db = new Database();
      await db.delete(key);
    } catch (error) {
      console.error('Database delete error:', error);
    }
  };

  // Load data from database
  const loadData = useCallback(async () => {
    setLoading(true);
    const savedFiles = await loadFromDatabase('quiz_files') || [];
    const savedFolders = await loadFromDatabase('quiz_folders') || [];
    setFiles(savedFiles);
    setFolders(savedFolders);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save files to database
  const saveFiles = async (newFiles: QuizFile[]) => {
    await saveToDatabase('quiz_files', newFiles);
    setFiles(newFiles);
  };

  // Save folders to database
  const saveFolders = async (newFolders: Folder[]) => {
    await saveToDatabase('quiz_folders', newFolders);
    setFolders(newFolders);
  };

  // Upload and save file
  const uploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;
        const response = await fetch(fileUri);
        const text = await response.text();
        const data = JSON.parse(text);
        
        if (Array.isArray(data) && data.every(item => 
          item.question && Array.isArray(item.answers) && item.answers.length >= 2
        )) {
          const newFile: QuizFile = {
            id: Date.now().toString(),
            name: fileName || 'Untitled Quiz',
            data,
            createdAt: new Date().toISOString(),
            folderId: currentFolderId || undefined
          };

          const updatedFiles = [...files, newFile];
          await saveFiles(updatedFiles);
          Alert.alert('Success', `Uploaded "${newFile.name}" with ${data.length} questions!`);
        } else {
          Alert.alert('Invalid Format', 'Please check your JSON format.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload the file. Please try again.');
    }
  };

  // Delete file
  const deleteFile = async (fileId: string) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedFiles = files.filter(f => f.id !== fileId);
            await saveFiles(updatedFiles);
          }
        }
      ]
    );
  };

  // Create folder
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name.');
      return;
    }

    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedFolders = [...folders, newFolder];
    await saveFolders(updatedFolders);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  // Delete folder
  const deleteFolder = async (folderId: string) => {
    const folderFiles = files.filter(f => f.folderId === folderId);
    
    if (folderFiles.length > 0) {
      Alert.alert(
        'Folder Not Empty',
        `This folder contains ${folderFiles.length} file(s). Delete anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete All', 
            style: 'destructive',
            onPress: async () => {
              const updatedFiles = files.filter(f => f.folderId !== folderId);
              const updatedFolders = folders.filter(f => f.id !== folderId);
              await saveFiles(updatedFiles);
              await saveFolders(updatedFolders);
              if (currentFolderId === folderId) {
                setCurrentFolderId(null);
              }
            }
          }
        ]
      );
    } else {
      const updatedFolders = folders.filter(f => f.id !== folderId);
      await saveFolders(updatedFolders);
    }
  };

  // Start quiz with file data
  const startQuizWithFile = (file: QuizFile) => {
    // This will be handled by passing data to the quiz tab
    Alert.alert(
      'Start Quiz',
      `Start quiz with "${file.name}" (${file.data.length} questions)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            // Save selected file to database for quiz tab to pick up
            saveToDatabase('selected_quiz_file', file);
            Alert.alert('Quiz Ready', 'Go to the Quiz tab to start!');
          }
        }
      ]
    );
  };

  // Get current files (filtered by folder)
  const getCurrentFiles = () => {
    return files.filter(f => f.folderId === currentFolderId);
  };

  // Get current folder name
  const getCurrentFolderName = () => {
    if (!currentFolderId) return 'All Files';
    const folder = folders.find(f => f.id === currentFolderId);
    return folder ? folder.name : 'Unknown Folder';
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ThemedText>Loading files...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Quiz Files</ThemedText>
          <TouchableOpacity style={styles.uploadButton} onPress={uploadFile}>
            <ThemedText style={styles.buttonText}>+ Upload File</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Navigation */}
        <ThemedView style={styles.navigation}>
          <TouchableOpacity 
            style={[styles.navButton, !currentFolderId && styles.activeNavButton]}
            onPress={() => setCurrentFolderId(null)}
          >
            <ThemedText style={styles.navButtonText}>All Files</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.newFolderButton}
            onPress={() => setShowNewFolderModal(true)}
          >
            <ThemedText style={styles.buttonText}>+ New Folder</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Current location */}
        <ThemedView style={styles.breadcrumb}>
          <ThemedText type="subtitle">{getCurrentFolderName()}</ThemedText>
          {currentFolderId && (
            <TouchableOpacity onPress={() => setCurrentFolderId(null)}>
              <ThemedText style={styles.backButton}>← Back to All Files</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* Folders (only show when not in a folder) */}
        {!currentFolderId && folders.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Folders</ThemedText>
            {folders.map(folder => (
              <ThemedView key={folder.id} style={styles.folderItem}>
                <TouchableOpacity 
                  style={styles.folderContent}
                  onPress={() => setCurrentFolderId(folder.id)}
                >
                  <ThemedText style={styles.folderName}>📁 {folder.name}</ThemedText>
                  <ThemedText style={styles.fileCount}>
                    {files.filter(f => f.folderId === folder.id).length} files
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteFolder(folder.id)}
                >
                  <ThemedText style={styles.deleteButtonText}>×</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {/* Files */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Files</ThemedText>
          {getCurrentFiles().length === 0 ? (
            <ThemedText style={styles.emptyText}>
              No files in this location. Upload a JSON quiz file to get started.
            </ThemedText>
          ) : (
            getCurrentFiles().map(file => (
              <ThemedView key={file.id} style={styles.fileItem}>
                <ThemedView style={styles.fileInfo}>
                  <ThemedText style={styles.fileName}>{file.name}</ThemedText>
                  <ThemedText style={styles.fileDetails}>
                    {file.data.length} questions • {new Date(file.createdAt).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.fileActions}>
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => startQuizWithFile(file)}
                  >
                    <ThemedText style={styles.buttonText}>Start Quiz</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteFile(file.id)}
                  >
                    <ThemedText style={styles.deleteButtonText}>×</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))
          )}
        </ThemedView>

        {/* New Folder Modal */}
        <Modal
          visible={showNewFolderModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle">Create New Folder</ThemedText>
              <TextInput
                style={styles.input}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="Folder name"
                autoFocus
              />
              <ThemedView style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                  }}
                >
                  <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.createButton]}
                  onPress={createFolder}
                >
                  <ThemedText style={styles.buttonText}>Create</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </View>
        </Modal>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    marginBottom: 30,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navigation: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  activeNavButton: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    fontSize: 14,
  },
  newFolderButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  breadcrumb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: '#007AFF',
    fontSize: 14,
  },
  section: {
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  folderContent: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileCount: {
    fontSize: 12,
    opacity: 0.7,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileDetails: {
    fontSize: 12,
    opacity: 0.7,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
});
