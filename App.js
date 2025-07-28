import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Home, PlusCircle, List, BarChart2, Wallet, Settings } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase } from './db/asyncStorageService';
import { moderateScale, responsiveFontSize } from './utils/scale';
import SplashScreen from './components/SplashScreen';
import SetupScreen from './screens/SetupScreen';
import HomeScreen from './screens/HomeScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import HistoryScreen from './screens/HistoryScreen';
import InsightsScreen from './screens/InsightsScreen';
import AccountsScreen from './screens/AccountsScreen';
import EditTransactionScreen from './screens/EditTransactionScreen';
import SettingsScreen from './screens/SettingsScreen';
import 'react-native-gesture-handler';
import useStore from './hooks/useStore';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import RestoreScreen from './screens/RestoreScreen';

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
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let IconComponent;
            let iconSize = moderateScale(size + 2);
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
            } else if (route.name === 'Settings') {
              IconComponent = Settings;
            }
            return <IconComponent color={color} size={iconSize} strokeWidth={focused ? 2.4 : 2} />;
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: responsiveFontSize(12),
            marginTop: 0,
            marginBottom: moderateScale(4),
          },
          tabBarStyle: {
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#1E293B',
            borderTopWidth: 0,
            height: moderateScale(64),
            minHeight: moderateScale(60),
            paddingBottom: moderateScale(4),
            paddingTop: moderateScale(4),
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
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: 'Add' }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
        <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
        <Tab.Screen name="Accounts" component={AccountsScreen} options={{ title: 'Accounts' }} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        initDatabase().catch(console.error);

        const setupComplete = await AsyncStorage.getItem('setup_complete');
        setIsSetupComplete(setupComplete === 'true');

        if (setupComplete === 'true' && typeof useStore.getState === 'function') {
          await useStore.getState().loadAccounts();
          await useStore.getState().loadTransactions();
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsSetupComplete(false);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initializeApp, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#1E293B');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);
  useEffect(() => {
    // Expose callback so Setup/Restore can notify App.js
    global.onSetupComplete = async () => {
      setIsSetupComplete(true);
      if (typeof useStore.getState === 'function') {
        await useStore.getState().loadAccounts();
        await useStore.getState().loadTransactions();
      }
    };
  
    return () => { global.onSetupComplete = null; };
  }, []);
  

  const handleSplashFinish = () => setShowSplash(false);

  // Debug helper to reset onboarding
  if (typeof global !== 'undefined') {
    global.resetSetupStatus = async () => {
      await AsyncStorage.removeItem('setup_complete');
      setIsSetupComplete(false);
    };
  }

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#94A3B8', fontFamily: 'Inter_600SemiBold' }}>
          Loading Cashalyst...
        </Text>
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
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isSetupComplete ? (
              <>
                <Stack.Screen name="Setup">
                  {(props) => <SetupScreen {...props} onSetupComplete={() => setIsSetupComplete(true)} />}
                </Stack.Screen>
                <Stack.Screen name="RestoreScreen">
                  {(props) => <RestoreScreen {...props} onSetupComplete={() => setIsSetupComplete(true)} />}
                </Stack.Screen>
              </>
            ) : (
              <>
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen name="EditTransaction" component={EditTransactionScreen} options={{ presentation: 'modal' }} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="RestoreScreen" component={RestoreScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
