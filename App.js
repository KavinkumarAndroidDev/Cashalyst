import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Home, PlusCircle, List, BarChart2, Wallet } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase } from './db/asyncStorageService';
import SplashScreen from './components/SplashScreen';
import SetupScreen from './screens/SetupScreen';
import HomeScreen from './screens/HomeScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import HistoryScreen from './screens/HistoryScreen';
import InsightsScreen from './screens/InsightsScreen';
import AccountsScreen from './screens/AccountsScreen';
import EditTransactionScreen from './screens/EditTransactionScreen';
import 'react-native-gesture-handler';
import useStore from './hooks/useStore';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0F172A',
  },
};

// Tab Navigator for main app screens
function MainTabNavigator() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let IconComponent;
            let iconSize = size + 2;
            if (route.name === 'Home') {
              IconComponent = Home;
            } else if (route.name === 'AddTransaction') {
              IconComponent = PlusCircle;
            } else if (route.name === 'History') {
              IconComponent = List;
            } else if (route.name === 'Insights') {
              IconComponent = BarChart2;
            } else if (route.name === 'Accounts') {
              IconComponent = Wallet;
            }
            return <IconComponent color={color} size={iconSize} strokeWidth={focused ? 2.4 : 2} />;
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
            marginTop: 0,
            marginBottom: 4,
          },
          tabBarStyle: {
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#1E293B',
            borderTopWidth: 0,
            height: 64,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 8,
          },
          headerShown: false,
          tabBarBackground: () => (
            <BlurView
              intensity={40}
              tint="dark"
              style={{ flex: 1, backgroundColor: 'rgba(30,41,59,0.92)' }}
            />
          ),
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Home' }}
        />
        <Tab.Screen 
          name="AddTransaction" 
          component={AddTransactionScreen}
          options={{ title: 'Add' }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ title: 'History' }}
        />
        <Tab.Screen 
          name="Insights" 
          component={InsightsScreen}
          options={{ title: 'Insights' }}
        />
        <Tab.Screen 
          name="Accounts" 
          component={AccountsScreen}
          options={{ title: 'Accounts' }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Setup');
  const [currentRoute, setCurrentRoute] = useState('Setup');
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    setCurrentRoute(initialRoute);
  }, [initialRoute]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database in background
        initDatabase().catch(console.error);
        
        // Check setup status immediately
        const setupComplete = await AsyncStorage.getItem('setup_complete');
        console.log('Setup complete status:', setupComplete); // Debug log
        
        // If setup_complete is null, undefined, or not 'true', show setup screen
        const shouldShowSetup = !setupComplete || setupComplete !== 'true';
        console.log('Should show setup screen:', shouldShowSetup); // Debug log
        
        setInitialRoute(shouldShowSetup ? 'Setup' : 'Main');
        // Load accounts and transactions if setup is complete
        if (!shouldShowSetup && typeof useStore.getState === 'function') {
          await useStore.getState().loadAccounts();
          await useStore.getState().loadTransactions();
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // On error, default to setup screen
        setInitialRoute('Setup');
        setIsLoading(false);
      }
    };
    
    // Add a small delay to ensure fonts are loaded
    const timer = setTimeout(initializeApp, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#1E293B'); // match your tab bar color
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleSetupComplete = async () => {
    try {
      await AsyncStorage.setItem('setup_complete', 'true');
      setInitialRoute('Main');
      // Load accounts and transactions after onboarding
      if (typeof useStore.getState === 'function') {
        await useStore.getState().loadAccounts();
        await useStore.getState().loadTransactions();
      }
    } catch (error) {
      console.error('Failed to mark setup as complete:', error);
    }
  };

  // Function to reset setup status for testing (you can call this from console)
  const resetSetupStatus = async () => {
    try {
      await AsyncStorage.removeItem('setup_complete');
      console.log('Setup status reset successfully');
      // Reload the app to show setup screen
      setInitialRoute('Setup');
    } catch (error) {
      console.error('Failed to reset setup status:', error);
    }
  };

  // Expose reset function globally for testing
  if (typeof global !== 'undefined') {
    global.resetSetupStatus = resetSetupStatus;
    global.showSetupScreen = () => {
      setInitialRoute('Setup');
      setCurrentRoute('Setup');
    };
  }

  // Show loading screen only if fonts aren't loaded or app is initializing
  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#94A3B8', fontFamily: 'Inter_600SemiBold' }}>Loading Cashalyst...</Text>
      </View>
    );
  }

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            {initialRoute === 'Setup' ? (
              <Stack.Screen 
                name="Setup" 
                component={SetupScreen}
                initialParams={{ onSetupComplete: handleSetupComplete }}
              />
            ) : (
              <>
                <Stack.Screen 
                  name="Main" 
                  component={MainTabNavigator}
                />
                <Stack.Screen 
                  name="EditTransaction" 
                  component={EditTransactionScreen}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
