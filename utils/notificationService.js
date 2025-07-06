import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Personalized notification messages
const notificationMessages = [
  // Indian Cultural & Food References
  "A penny saved is a samosa earned! Did you track your expenses today? 🥟",
  "Saving ₹10 daily = one extra chai treat at the end of the month! ☕",
  "Like mom's secret masala, small savings add big flavor to your finances! 🌶️",
  "Skipping that extra vada pav? Log it and watch your wallet thank you! 😋",
  "Every rupee counts—just like every grain in your biryani! 🍚",
  "Your savings are like ghee—pure and valuable! Track today's expenses 💰",
  "Just like a good dosa needs patience, good savings need consistency! 🥞",
  
  // Small Savings Motivation
  "Tiny drops make an ocean. Add your expenses and see your savings grow! 🌊",
  "Even ₹20 saved today is a step closer to your next movie night! 🎬",
  "Did you know? Saving just ₹50 a week adds up to ₹2,600 a year!",
  "Small change, big impact! Don't forget to track today's spending.",
  "Skipped a snack? That's a win for your savings jar! 🏆",
  "Every ₹5 saved is a step towards your dreams! 💫",
  
  // Playful & Fun Reminders
  "Your wallet just sent a friend request. Don't leave it pending—update your transactions! 😄",
  "Your bank balance wants a selfie! Update your spending and make it smile. 📸",
  "Kaun Banega Savings Crorepati? Start with today's expenses! 💸",
  "Your future self will thank you for every rupee you save today.",
  "Don't let your expenses play hide and seek. Track them now! 🔍",
  "Your money is calling—pick up the phone and log your expenses! 📞",
  
  // Personal & Motivational
  "You're building your financial future, one transaction at a time! 🏗️",
  "Your discipline today creates freedom tomorrow. Keep tracking! ✨",
  "Smart people track their money. You're smart! 🧠",
  "Your financial health matters. Take 2 minutes to update your expenses! 💪",
  "Every entry in your app is a step towards financial wisdom! 📚",
  
  // Quotes & Wisdom
  "Beware of little expenses. A small leak can sink a great ship. ⚓",
  "Do not save what is left after spending, but spend what is left after saving.",
  "Wealth consists not in having great possessions, but in having few wants.",
  "Discipline is the bridge between goals and accomplishment. Log your expenses! 🌉",
  "The best investment you can make is in yourself. Start with tracking! 🎯"
];

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.lastNotificationDate = null;
    this.notificationCount = 0;
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Request permissions with better error handling
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      // Configure for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      // Load notification state
      await this.loadNotificationState();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async loadNotificationState() {
    try {
      const lastDate = await AsyncStorage.getItem('last_notification_date');
      const count = await AsyncStorage.getItem('daily_notification_count');
      
      this.lastNotificationDate = lastDate || null;
      this.notificationCount = count ? parseInt(count) : 0;
      
      // Reset count if it's a new day
      const today = new Date().toDateString();
      if (this.lastNotificationDate !== today) {
        this.notificationCount = 0;
        this.lastNotificationDate = today;
        await this.saveNotificationState();
      }
    } catch (error) {
      console.error('Failed to load notification state:', error);
      // Set default values on error
      this.lastNotificationDate = new Date().toDateString();
      this.notificationCount = 0;
    }
  }

  // Helper function to ensure valid values for AsyncStorage
  getValidStorageValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return value.toString();
  }

  async saveNotificationState() {
    try {
      // Ensure we never save null values to AsyncStorage
      const lastDate = this.getValidStorageValue(this.lastNotificationDate);
      const count = this.getValidStorageValue(this.notificationCount);
      
      await AsyncStorage.setItem('last_notification_date', lastDate);
      await AsyncStorage.setItem('daily_notification_count', count);
    } catch (error) {
      console.error('Failed to save notification state:', error);
    }
  }

  getRandomMessage() {
    const randomIndex = Math.floor(Math.random() * notificationMessages.length);
    return notificationMessages[randomIndex];
  }

  getRandomTime() {
    // Generate random time between 10 AM and 8 PM
    const startHour = 10;
    const endHour = 20;
    const hour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
    const minute = Math.floor(Math.random() * 60);
    return { hour, minute };
  }

  async scheduleSmartNotification() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if we've already sent enough notifications today
      if (this.notificationCount >= 2) {
        return null;
      }

      const message = this.getRandomMessage();
      const { hour, minute } = this.getRandomTime();
      
      // Schedule for today if it's not too late, otherwise schedule for tomorrow
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);
      
      // If the time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const notificationId = await this.scheduleNotification(
        '💰 Cashalyst Reminder',
        message,
        {
          hour: scheduledTime.getHours(),
          minute: scheduledTime.getMinutes(),
          repeats: false, // One-time notification
        }
      );

      // Update state
      this.notificationCount++;
      await this.saveNotificationState();

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule smart notification:', error);
      throw error;
    }
  }

  async scheduleNotification(title, body, trigger = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: trigger || { seconds: 1 }, // Default to 1 second from now
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  async scheduleDailyReminder(hour = 20, minute = 0) {
    try {
      await this.scheduleNotification(
        '💰 Daily Finance Check-in',
        'Take a moment to review your spending and update your transactions.',
        {
          hour,
          minute,
          repeats: true,
        }
      );
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
      throw error;
    }
  }

  async scheduleWeeklyReport(dayOfWeek = 1, hour = 9, minute = 0) {
    try {
      await this.scheduleNotification(
        '📊 Weekly Finance Report',
        'Your weekly spending summary is ready. Check your insights!',
        {
          weekday: dayOfWeek, // Monday
          hour,
          minute,
          repeats: true,
        }
      );
    } catch (error) {
      console.error('Failed to schedule weekly report:', error);
      throw error;
    }
  }

  async enableSmartNotifications() {
    try {
      // Cancel existing notifications
      await this.cancelAllNotifications();
      
      // Schedule smart daily notification
      await this.scheduleSmartNotification();
      
      // Schedule weekly report
      await this.scheduleWeeklyReport();
      
      console.log('Smart notifications enabled');
    } catch (error) {
      console.error('Failed to enable smart notifications:', error);
      throw error;
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      // Reset notification state
      this.notificationCount = 0;
      this.lastNotificationDate = new Date().toDateString();
      await this.saveNotificationState();
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
      throw error;
    }
  }

  async getPendingNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  async checkPermissionStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Failed to check permission status:', error);
      return 'undetermined';
    }
  }

  // Demo function to test smart notifications immediately
  async sendDemoNotification() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const message = this.getRandomMessage();
      await this.scheduleNotification(
        '💰 Cashalyst Demo',
        message,
        { seconds: 3 } // Send in 3 seconds
      );

      return message;
    } catch (error) {
      console.error('Failed to send demo notification:', error);
      throw error;
    }
  }

  // Get notification stats for user
  async getNotificationStats() {
    try {
      const pendingNotifications = await this.getPendingNotifications();
      return {
        pendingCount: pendingNotifications.length,
        dailyCount: this.notificationCount,
        lastNotificationDate: this.lastNotificationDate
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return { pendingCount: 0, dailyCount: 0, lastNotificationDate: null };
    }
  }
}

export default new NotificationService(); 