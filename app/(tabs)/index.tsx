
import React from "react";
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
  const aiPrompt = `Generate a JSON quiz file with [X] questions about [TOPIC]. 
Use this exact format:

[
  {
    "question": "Your question here?",
    "answers": [
      "Correct answer (always first)",
      "Wrong answer 1",
      "Wrong answer 2", 
      "Wrong answer 3"
    ]
  }
]

Make sure the first answer in each answers array is always the correct one. Include interesting and challenging questions.`;

  const copyPromptToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(aiPrompt);
      Alert.alert('Copied!', 'Prompt copied to clipboard. You can now paste it into ChatGPT or any AI assistant.');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>Quiz App</ThemedText>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">What is this app?</ThemedText>
          <ThemedText>
            This is a quiz application that lets you load JSON files with questions and answers, 
            then take interactive quizzes with customizable timing.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">How to use:</ThemedText>
          <ThemedText>
            1. Go to the Files tab to upload and manage your quiz files{'\n'}
            2. Create folders to organize your quizzes{'\n'}
            3. Start a quiz directly from the Files tab, or{'\n'}
            4. Go to the Quiz tab to load files manually{'\n'}
            5. Set your preferred timer duration{'\n'}
            6. Answer questions and see immediate feedback with color-coded answers
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">JSON Format:</ThemedText>
          <ThemedView style={styles.codeBlock}>
            <ThemedText style={styles.code}>
{`[
  {
    "question": "What is the capital of France?",
    "answers": [
      "Paris",
      "London", 
      "Berlin",
      "Madrid"
    ]
  }
]`}
            </ThemedText>
          </ThemedView>
          <ThemedText style={styles.note}>
            Note: The first answer in the array is always the correct answer.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Generate Random Quiz with AI</ThemedText>
          <ThemedText>
            Want to create a custom quiz? Copy this prompt and use it with ChatGPT, Claude, or any AI assistant:
          </ThemedText>
          <ThemedView style={styles.codeBlock}>
            <ThemedText style={styles.code}>
              {aiPrompt}
            </ThemedText>
          </ThemedView>
          <TouchableOpacity style={styles.copyButton} onPress={copyPromptToClipboard}>
            <ThemedText style={styles.copyButtonText}>📋 Copy Prompt to Clipboard</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.note}>
            Replace [X] with desired number of questions and [TOPIC] with your subject. 
            Save the AI's response as a .json file and upload it using the Files tab.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    gap: 10,
  },
  codeBlock: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  note: {
    fontStyle: 'italic',
    fontSize: 12,
    opacity: 0.8,
  },
  copyButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  copyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
