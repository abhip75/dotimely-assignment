import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

interface Timer {
  id: number;
  time: number;
  isRunning: boolean;
}

const MAX_TIMERS = 5;

const PREDEFINED_TIMES = [300, 600, 900]; // predefined times

const HomeScreen = () => {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [inputTime, setInputTime] = useState('');
  const [limitReachedMessage, setLimitReachedMessage] = useState('');
  const [sound, setSound] = useState<any>(null);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        await playAlertSound();
        return {
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      },
    });

    Notifications.requestPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications to receive timer alerts.');
      }
    });

    const interval = setInterval(() => {
      setTimers((prevTimers) =>
        prevTimers.map((timer) => {
          if (timer.isRunning && timer.time > 0) {
            return { ...timer, time: timer.time - 1 };
          } else if (timer.time === 0 && timer.isRunning) {
            sendNotification(timer.id);
            return { ...timer, isRunning: false };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Play alert sound
  const playAlertSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/alert-sound.wav')
    );
    setSound(sound);
    await sound.playAsync();
  };

  const sendNotification = async (timerId: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Timer Finished',
        body: `Timer ${timerId} has reached zero!`,
      },
      trigger: null,
    });
  };

  // validations
  const isValidInput = () => {
    const duration = parseInt(inputTime);

    if (!inputTime.trim()) {
      Alert.alert('Invalid Input', 'Please enter a time.');
      return false;
    }

    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Invalid Input', 'Please enter a positive number for time.');
      return false;
    }

    return true;
  };

  const addTimer = (duration: number) => {
    if (timers.length >= MAX_TIMERS) {
      setLimitReachedMessage('You can only add up to 5 timers.');
      return;
    }
    setLimitReachedMessage('');

    setTimers([...timers, { id: Date.now(), time: duration, isRunning: false }]);
  };

  const handleAddCustomTimer = () => {
    if (!isValidInput()) return;

    const duration = parseInt(inputTime);
    addTimer(duration);
    setInputTime('');
  };

  const startTimer = (id: number) => {
    setTimers((prevTimers) =>
      prevTimers.map((timer) => (timer.id === id ? { ...timer, isRunning: true } : timer))
    );
  };

  const pauseTimer = (id: number) => {
    setTimers((prevTimers) =>
      prevTimers.map((timer) => (timer.id === id ? { ...timer, isRunning: false } : timer))
    );
  };

  const resetTimer = (id: number) => {
    setTimers((prevTimers) =>
      prevTimers.map((timer) =>
        timer.id === id ? { ...timer, time: 0, isRunning: false } : timer
      )
    );
  };

  const resetAllTimers = () => {
    setTimers([]);
    setLimitReachedMessage('');
  };

  const renderTimer = ({ item, index }: { item: Timer; index: number }) => (
    <View style={styles.timerContainer}>
      <Text style={styles.timerText}>Timer {index + 1}: {item.time}s</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => (item.isRunning ? pauseTimer(item.id) : startTimer(item.id))}
      >
        <Text style={styles.buttonText}>{item.isRunning ? 'Pause' : 'Start'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => resetTimer(item.id)}>
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Timer App</Text>
      {limitReachedMessage ? <Text style={styles.limitReachedText}>{limitReachedMessage}</Text> : null}

      <View style={styles.predefinedContainer}>
        {PREDEFINED_TIMES.map((time) => (
          <TouchableOpacity key={time} style={styles.predefinedButton} onPress={() => addTimer(time)}>
            <Text style={styles.buttonText}>{time / 60} min</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter time in seconds"
        keyboardType="numeric"
        value={inputTime}
        onChangeText={setInputTime}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAddCustomTimer}>
        <Text style={styles.addButtonText}>Add Custom Timer</Text>
      </TouchableOpacity>

      <FlatList
        data={timers}
        renderItem={renderTimer}
        keyExtractor={(item) => item.id.toString()}
      />
      <TouchableOpacity style={[styles.addButton, styles.resetButton]} onPress={resetAllTimers}>
        <Text style={styles.addButtonText}>Reset All</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  limitReachedText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  predefinedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  predefinedButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  timerText: {
    fontSize: 18,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#FF6347',
  },
});

export default HomeScreen;
