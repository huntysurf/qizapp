
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Question {
  question: string;
  answers: string[];
}

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  showFeedback: boolean;
  score: number;
  completed: boolean;
  randomizedQuestions: Question[];
}

export default function QuizScreen() {
  const [quizData, setQuizData] = useState<Question[]>([]);
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    selectedAnswer: null,
    showFeedback: false,
    score: 0,
    completed: false,
    randomizedQuestions: []
  });
  const [timerDuration, setTimerDuration] = useState<number>(3);
  const [countdown, setCountdown] = useState<number>(0);
  const [loadedFileName, setLoadedFileName] = useState<string>('');

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffleAnswers = (question: Question): Question => {
    const correctAnswer = question.answers[0];
    const shuffledAnswers = shuffleArray(question.answers);
    return {
      ...question,
      answers: shuffledAnswers,
      correctAnswerIndex: shuffledAnswers.indexOf(correctAnswer)
    } as Question & { correctAnswerIndex: number };
  };

  // Check for quiz file from Files tab
  const checkForSelectedFile = useCallback(async () => {
    try {
      console.log('Checking for selected quiz file...');
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const selectedFile = await AsyncStorage.getItem('selected_quiz_file');
      
      if (selectedFile) {
        console.log('Found selected file data:', selectedFile.substring(0, 200) + '...');
        
        let fileData;
        try {
          fileData = JSON.parse(selectedFile);
          console.log('Parsed file data:', {
            id: fileData.id,
            name: fileData.name,
            dataLength: fileData.data ? fileData.data.length : 'no data',
            dataType: Array.isArray(fileData.data) ? 'array' : typeof fileData.data
          });
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          Alert.alert('Error', 'Corrupted quiz file data');
          await AsyncStorage.removeItem('selected_quiz_file');
          return;
        }
        
        // Validate quiz data structure
        if (!fileData.data || !Array.isArray(fileData.data) || fileData.data.length === 0) {
          console.error('Invalid quiz data structure:', fileData);
          Alert.alert('Error', 'Invalid quiz data format - no questions found');
          await AsyncStorage.removeItem('selected_quiz_file');
          return;
        }
        
        // Validate individual questions
        const validQuestions = fileData.data.filter(q => 
          q && typeof q === 'object' && 
          q.question && typeof q.question === 'string' &&
          q.answers && Array.isArray(q.answers) && q.answers.length >= 2
        );
        
        if (validQuestions.length === 0) {
          console.error('No valid questions found');
          Alert.alert('Error', 'No valid questions found in quiz file');
          await AsyncStorage.removeItem('selected_quiz_file');
          return;
        }
        
        if (validQuestions.length !== fileData.data.length) {
          console.warn(`${fileData.data.length - validQuestions.length} invalid questions filtered out`);
        }
        
        // Set quiz data
        setQuizData(validQuestions);
        setLoadedFileName(fileData.name || 'Loaded Quiz');
        
        console.log(`Successfully loaded quiz with ${validQuestions.length} questions`);
        
        // Automatically start the quiz after loading
        setTimeout(() => {
          const randomizedQuestions = shuffleArray(validQuestions).map(shuffleAnswers);
          setQuizState({
            questions: validQuestions,
            currentQuestionIndex: 0,
            selectedAnswer: null,
            showFeedback: false,
            score: 0,
            completed: false,
            randomizedQuestions
          });
          setCountdown(0);
        }, 100);
        
        await AsyncStorage.removeItem('selected_quiz_file'); // Clear after loading
      } else {
        console.log('No selected quiz file found');
      }
    } catch (error) {
      console.error('Error checking for selected file:', error);
      Alert.alert('Error', 'Failed to load quiz from Files tab: ' + error.message);
    }
  }, []);

  // Check for selected file whenever the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      checkForSelectedFile();
    }, [checkForSelectedFile])
  );

  const startQuiz = useCallback(() => {
    if (quizData.length === 0) {
      Alert.alert('No Quiz Data', 'Please load a quiz file first.');
      return;
    }

    const randomizedQuestions = shuffleArray(quizData).map(shuffleAnswers);
    setQuizState({
      questions: quizData,
      currentQuestionIndex: 0,
      selectedAnswer: null,
      showFeedback: false,
      score: 0,
      completed: false,
      randomizedQuestions
    });
    setCountdown(0);
  }, [quizData]);

  const selectAnswer = useCallback((answerIndex: number) => {
    if (quizState.showFeedback) return;

    const currentQuestion = quizState.randomizedQuestions[quizState.currentQuestionIndex] as Question & { correctAnswerIndex: number };
    const isCorrect = answerIndex === currentQuestion.correctAnswerIndex;

    setQuizState(prev => ({
      ...prev,
      selectedAnswer: answerIndex,
      showFeedback: true,
      score: prev.score + (isCorrect ? 1 : 0)
    }));

    setCountdown(timerDuration);
  }, [quizState, timerDuration]);

  const nextQuestion = useCallback(() => {
    const nextIndex = quizState.currentQuestionIndex + 1;
    
    if (nextIndex >= quizState.randomizedQuestions.length) {
      setQuizState(prev => ({ ...prev, completed: true }));
    } else {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        selectedAnswer: null,
        showFeedback: false
      }));
    }
    setCountdown(0);
  }, [quizState]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && quizState.showFeedback) {
      timer = setTimeout(nextQuestion, 500);
    }
    return () => clearTimeout(timer);
  }, [countdown, quizState.showFeedback, nextQuestion]);

  const loadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const response = await fetch(fileUri);
        const text = await response.text();
        const data = JSON.parse(text);
        
        if (Array.isArray(data) && data.every(item => 
          item.question && Array.isArray(item.answers) && item.answers.length >= 2
        )) {
          setQuizData(data);
          setLoadedFileName(result.assets[0].name || 'Uploaded Quiz');
          Alert.alert('Success', `Loaded ${data.length} questions!`);
        } else {
          Alert.alert('Invalid Format', 'Please check your JSON format.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load the file. Please try again.');
    }
  };

  const resetQuiz = () => {
    setQuizState({
      questions: [],
      currentQuestionIndex: 0,
      selectedAnswer: null,
      showFeedback: false,
      score: 0,
      completed: false,
      randomizedQuestions: []
    });
  };

  const clearQuizFile = () => {
    setQuizData([]);
    setLoadedFileName('');
    Alert.alert('Cleared', 'Quiz file has been cleared. You can now load a new file.');
  };

  if (quizState.completed) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.completedContainer}>
          <ThemedText type="title">Quiz Completed!</ThemedText>
          <ThemedText type="subtitle" style={styles.score}>
            Score: {quizState.score}/{quizState.randomizedQuestions.length}
          </ThemedText>
          <ThemedText style={styles.percentage}>
            {Math.round((quizState.score / quizState.randomizedQuestions.length) * 100)}%
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={startQuiz}>
            <ThemedText style={styles.buttonText}>Start New Quiz</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetQuiz}>
            <ThemedText style={styles.buttonText}>Load Different Quiz</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  if (quizState.randomizedQuestions.length > 0) {
    const currentQuestion = quizState.randomizedQuestions[quizState.currentQuestionIndex] as Question & { correctAnswerIndex: number };
    
    return (
      <ScrollView style={styles.container}>
        <ThemedView style={styles.quizContainer}>
          <ThemedView style={styles.header}>
            <ThemedView style={styles.headerTop}>
              <ThemedText type="subtitle">
                Question {quizState.currentQuestionIndex + 1} of {quizState.randomizedQuestions.length}
              </ThemedText>
              <TouchableOpacity style={styles.exitButton} onPress={resetQuiz}>
                <ThemedText style={styles.exitButtonText}>Exit</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            <ThemedView style={styles.headerBottom}>
              <ThemedText>Score: {quizState.score}</ThemedText>
              {countdown > 0 && (
                <ThemedText style={styles.countdown}>Next in: {countdown}s</ThemedText>
              )}
            </ThemedView>
          </ThemedView>

          <ThemedText type="title" style={styles.question}>
            {currentQuestion.question}
          </ThemedText>

          <ThemedView style={styles.answersContainer}>
            {currentQuestion.answers.map((answer, index) => {
              let buttonStyle = styles.answerButton;
              let textStyle = styles.answerText;

              if (quizState.showFeedback) {
                if (index === currentQuestion.correctAnswerIndex) {
                  buttonStyle = [styles.answerButton, styles.correctAnswer];
                  textStyle = [styles.answerText, styles.correctAnswerText];
                } else if (index === quizState.selectedAnswer) {
                  buttonStyle = [styles.answerButton, styles.incorrectAnswer];
                  textStyle = [styles.answerText, styles.incorrectAnswerText];
                }
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={buttonStyle}
                  onPress={() => selectAnswer(index)}
                  disabled={quizState.showFeedback}
                >
                  <ThemedText style={textStyle}>{answer}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.setupContainer}>
        <ThemedText type="title">Setup Quiz</ThemedText>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Load Quiz File</ThemedText>
          <TouchableOpacity style={styles.button} onPress={loadFile}>
            <ThemedText style={styles.buttonText}>
              {quizData.length > 0 
                ? `Loaded: ${loadedFileName || 'Quiz'} (${quizData.length} questions)` 
                : 'Select JSON File'}
            </ThemedText>
          </TouchableOpacity>
          {quizData.length > 0 && (
            <ThemedView style={styles.clearSection}>
              <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearQuizFile}>
                <ThemedText style={styles.buttonText}>Clear Quiz File</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.hint}>
                Or go to the Files tab to manage and start quizzes from saved files
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Timer Duration: {timerDuration} seconds</ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={2}
            maximumValue={15}
            step={1}
            value={timerDuration}
            onValueChange={setTimerDuration}
            minimumTrackTintColor="#FF0000"
            maximumTrackTintColor="#FFCCCC"
            thumbTintColor="#FF0000"
          />
          <ThemedView style={styles.sliderLabels}>
            <ThemedText style={styles.sliderLabel}>2s</ThemedText>
            <ThemedText style={styles.sliderLabel}>15s</ThemedText>
          </ThemedView>
          <ThemedText style={styles.hint}>
            How long to wait before the next question (2-15 seconds)
          </ThemedText>
        </ThemedView>

        {quizData.length > 0 && (
          <TouchableOpacity style={[styles.button, styles.startButton]} onPress={startQuiz}>
            <ThemedText style={styles.buttonText}>Start Quiz</ThemedText>
          </TouchableOpacity>
        )}
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
  setupContainer: {
    padding: 20,
    gap: 20,
  },
  quizContainer: {
    padding: 20,
    gap: 20,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
    marginTop: 50,
    marginBottom: 30,
  },
  section: {
    gap: 10,
  },
  header: {
    gap: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  exitButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  question: {
    textAlign: 'center',
    marginVertical: 20,
  },
  answersContainer: {
    gap: 15,
  },
  answerButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    padding: 15,
    borderRadius: 10,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerText: {
    textAlign: 'center',
    fontSize: 16,
    flexWrap: 'wrap',
  },
  correctAnswer: {
    backgroundColor: '#4CAF50',
  },
  incorrectAnswer: {
    backgroundColor: '#F44336',
  },
  correctAnswerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  incorrectAnswerText: {
    color: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  sliderLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  hint: {
    fontSize: 12,
    opacity: 0.7,
  },
  countdown: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  score: {
    fontSize: 24,
  },
  percentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  clearSection: {
    gap: 10,
  },
  clearButton: {
    backgroundColor: '#FF9500',
  },
});
