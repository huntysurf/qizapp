
import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
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
            1. Go to the Quiz tab{'\n'}
            2. Load a JSON file from your device or cloud storage{'\n'}
            3. Set your preferred timer duration{'\n'}
            4. Start the quiz and answer questions{'\n'}
            5. See immediate feedback with color-coded answers
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
          <ThemedText type="subtitle">Features:</ThemedText>
          <ThemedText>
            • Random question order each time{'\n'}
            • Adjustable timer between questions{'\n'}
            • Color-coded feedback (green = correct, red = incorrect){'\n'}
            • Load files from device or cloud storage{'\n'}
            • Responsive button layout
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
});
