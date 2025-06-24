import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../utils/theme';

const quotes = [
  "Do not save what is left after spending, but spend what is left after saving." + " – Warren Buffett",
  "Beware of little expenses; a small leak will sink a great ship." + " – Benjamin Franklin",
  "Someone's sitting in the shade today because someone planted a tree a long time ago." + " – Warren Buffett",
  "You can make money two ways — make more, or spend less." + " – John Hope Bryant",
  "The habit of saving is itself an education..." + " – T.T. Munger",
  "He who buys what he does not need, steals from himself." + " – Swedish Proverb",
  "The art is not in making money, but in keeping it." + " – Proverb",
  "Wealth consists not in having great possessions, but in having few wants." + " – Epictetus",
  "If you would be wealthy, think of saving as well as getting." + " – Benjamin Franklin",
  "It's not how much money you make, but how much you keep..." + " – Robert Kiyosaki",
  "A penny saved is a penny earned." + " – Benjamin Franklin",
  "You must learn to save first and spend afterwards." + " – John Poole",
  "The easiest way to save money is to waste less energy." + " – Barack Obama",
  "Never spend your money before you have earned it." + " – Thomas Jefferson",
  "He who will not economize will have to agonize." + " – Confucius",
  "Money is a terrible master but an excellent servant." + " – P.T. Barnum",
  "Save money and money will save you." + " – Unknown",
  "Being in control of your finances is a great stress reliever." + " – Unknown",
  "Spend not where you may save; spare not where you must spend." + " – John Ray",
  "Saving must become a priority, not just a thought..." + " – Dave Ramsey",
  // 11 new, unique quotes below
  "Financial freedom is available to those who learn about it and work for it." + " – Robert Kiyosaki",
  "Do not go broke trying to look rich." + " – Unknown",
  "Wealth is the ability to fully experience life." + " – Henry David Thoreau",
  "The lack of money is the root of all evil." + " – Mark Twain",
  "Do not tell me where your priorities are. Show me where you spend your money and I’ll tell you what they are." + " – James W. Frick",
  "It’s not your salary that makes you rich, it’s your spending habits." + " – Charles A. Jaffe",
  "Try to save something while your salary is small; it’s impossible to save after you begin to earn more." + " – Jack Benny",
  "Richness is not about what you have, but what you can give." + " – Unknown",
  "The real measure of your wealth is how much you’d be worth if you lost all your money." + " – Unknown",
  "A budget is telling your money where to go instead of wondering where it went." + " – John C. Maxwell",
  "Too many people spend money they haven't earned, to buy things they don't want, to impress people they don't like." + " – Will Rogers"
];


const SplashScreen = ({ onFinish }) => {
  const [currentQuote, setCurrentQuote] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [logoAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const getQuoteForToday = async () => {
      try {
        const today = new Date().toDateString();
        const storedDate = await AsyncStorage.getItem('last_quote_date');
        const storedQuoteIndex = await AsyncStorage.getItem('last_quote_index');
        
        let quoteIndex;
        if (storedDate === today && storedQuoteIndex !== null) {
          // Use the same quote for today
          quoteIndex = parseInt(storedQuoteIndex);
        } else {
          // Generate new quote for new day
          quoteIndex = Math.floor(Math.random() * quotes.length);
          await AsyncStorage.setItem('last_quote_date', today);
          await AsyncStorage.setItem('last_quote_index', quoteIndex.toString());
        }
        
        setCurrentQuote(quotes[quoteIndex]);
      } catch (error) {
        // Fallback to random quote if storage fails
        const randomIndex = Math.floor(Math.random() * quotes.length);
        setCurrentQuote(quotes[randomIndex]);
      }
    };

    getQuoteForToday();
  }, []);

  useEffect(() => {
    // Animate logo first
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    if (currentQuote) {
      // Animate in the quote after a shorter delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }, 300);

      // Auto-finish after 2.5 seconds (reduced from 3.5)
      const timer = setTimeout(() => {
        onFinish();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [currentQuote, fadeAnim, slideAnim, logoAnim, onFinish]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.background}
      >
        <View style={styles.content}>
          {/* Quote Section - Top */}
          <Animated.View 
            style={[
              styles.quoteContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.quoteCard}>
              <Text style={styles.quoteLabel}>💬 "Quote of the Day"</Text>
              <Text style={styles.quoteText}>{currentQuote}</Text>
            </View>
          </Animated.View>
          
          {/* Logo Section - Center */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: logoAnim,
                transform: [{ scale: logoAnim }],
              }
            ]}
          >
            <View style={styles.logoCard}>
              <LinearGradient
                colors={["rgba(59, 130, 246, 0.18)", "rgba(37, 99, 235, 0.08)"]}
                style={styles.logoGradient}
              >
                <Text style={styles.logo}>Cashalyst</Text>
                <Text style={styles.tagline}>Smart Money Management</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Progress Bar Section */}
          <Animated.View 
            style={[
              styles.progressContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressText}>Loading… 55%</Text>
          </Animated.View>

          {/* Version Text */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>v1.4.0</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoCard: {
    borderRadius: theme.radii.card,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  logoGradient: {
    paddingHorizontal: 48,
    paddingVertical: 40,
    alignItems: 'center',
    borderRadius: theme.radii.card,
  },
  logo: {
    fontSize: 42,
    fontFamily: theme.font.family.bold,
    color: theme.colors.textMain,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: theme.font.size.body,
    fontFamily: theme.font.family.regular,
    color: theme.colors.textSubtle,
    letterSpacing: 0.5,
  },
  quoteContainer: {
    width: '100%',
    marginBottom: 40,
  },
  quoteCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.card,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  quoteLabel: {
    fontSize: theme.font.size.label,
    fontFamily: theme.font.family.medium,
    color: theme.colors.textSubtle,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  quoteText: {
    fontSize: theme.font.size.body,
    fontFamily: theme.font.family.medium,
    color: theme.colors.textMain,
    textAlign: 'center',
    lineHeight: theme.font.lineHeight.body + 4,
    fontStyle: 'italic',
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 10,
    fontFamily: theme.font.family.regular,
    color: theme.colors.textHelper,
    letterSpacing: 0.5,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 40,
  },
  progressBar: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.button,
    height: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: theme.colors.accent,
    height: '100%',
    width: '55%',
    borderRadius: theme.radii.button,
  },
  progressText: {
    fontSize: theme.font.size.label,
    fontFamily: theme.font.family.medium,
    color: theme.colors.textSubtle,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default SplashScreen; 