import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { supabase } from './lib/supabase';

import LoginScreen from './screens/LoginScreen';
import NotesScreen from './screens/NotesScreen';

const Stack =
  createNativeStackNavigator();

export default function App() {
  const [
    initialRoute,
    setInitialRoute,
  ] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (session) {
        setInitialRoute('Notes');
      } else {
        setInitialRoute('Login');
      }
    } catch (error) {
      console.log(
        'SESSION ERROR:',
        error
      );

      setInitialRoute('Login');
    }
  };

  if (!initialRoute) {
    return (
      <View
        style={styles.loading}
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={
            initialRoute
          }
        >
          <Stack.Screen
            name="Login"
            component={
              LoginScreen
            }
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Notes"
            component={
              NotesScreen
            }
            options={{
              title: 'Catatan',
              headerBackVisible:
                false,
              gestureEnabled: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles =
  StyleSheet.create({
    loading: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
      backgroundColor:
        '#f4f7fb',
    },
  });