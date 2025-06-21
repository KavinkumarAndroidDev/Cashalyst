import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Home, PlusCircle, List, BarChart2, Wallet } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase } from './db/asyncStorageService';
import SetupScreen from './screens/SetupScreen';
import HomeScreen from './screens/HomeScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import HistoryScreen from './screens/HistoryScreen';
import InsightsScreen from './screens/InsightsScreen';
import AccountsScreen from './screens/AccountsScreen';
import 'react-native-gesture-handler';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main app screens
function MainTabNavigator() {
  return (
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
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Setup');
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        const setupComplete = await AsyncStorage.getItem('setup_complete');
        setInitialRoute(setupComplete === 'true' ? 'Main' : 'Setup');
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#94A3B8', fontFamily: 'Inter_600SemiBold' }}>Loading Cashalyst...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="Setup" 
            component={SetupScreen}
            options={{
              initialParams: {
                onSetupComplete: async () => {
                  await AsyncStorage.setItem('setup_complete', 'true');
                },
              },
            }}
          />
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
