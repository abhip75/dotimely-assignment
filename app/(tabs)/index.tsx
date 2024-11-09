import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, StyleSheet, FlatList, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

// Define the type for each timer object
interface Timer {
  id: number;
  time: number;
  isRunning: boolean;
}

const MAX_TIMERS = 5;

const HomeScreen = () => {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [inputTime, setInputTime] = useState('');
  const [isLimitReached, setIsLimitReached] = useState(false); // New state for limit message

  useEffect(() => {
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

  const sendNotification = async (timerId: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Timer Finished',
        body: `Timer ${timerId} has reached zero!`,
      },
      trigger: null,
    });
  };

  const addTimer = () => {
    if (timers.length >= MAX_TIMERS) {
      setIsLimitReached(true); // Set the limit message to show
      return;
    }
    setIsLimitReached(false); // Hide the limit message if adding a new timer
    const duration = parseInt(inputTime) || 60;
    setTimers([...timers, { id: Date.now(), time: duration, isRunning: false }]);
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

  const renderTimer = ({ item }: { item: Timer }) => (
    <View style={styles.timerContainer}>
      <Text style={styles.timerText}>Timer: {item.time}s</Text>
      <Button title={item.isRunning ? 'Pause' : 'Start'} onPress={() => (item.isRunning ? pauseTimer(item.id) : startTimer(item.id))} />
      <Button title="Reset" onPress={() => resetTimer(item.id)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Timer App</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter time in seconds"
        keyboardType="numeric"
        value={inputTime}
        onChangeText={setInputTime}
      />
      {isLimitReached && <Text style={styles.limitMessage}>You can only add up to 5 timers</Text>}
      <Button title="Add Timer" onPress={addTimer} />
      <FlatList
        data={timers}
        renderItem={renderTimer}
        keyExtractor={(item) => item.id.toString()}
      />
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  limitMessage: {
    color: 'red', // Red color for limit message
    marginBottom: 10,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  timerText: {
    fontSize: 18,
  },
});

export default HomeScreen;
