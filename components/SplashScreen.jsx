import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../utils/theme';
import { responsiveFontSize, moderateScale } from '../utils/scale';

const QUOTES = [
  { text: "A penny saved is a penny earned.", author: "Benjamin Franklin" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
  { text: "The art is not in making money, but in keeping it.", author: "Proverb" },
  { text: "It's not how much money you make, but how much you keep.", author: "Robert Kiyosaki" },
  { text: "Save money and money will save you.", author: "Unknown" },
  { text: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki" },

  // 31 new, unique, concise quotes
  { text: "Never spend your money before you have earned it.", author: "Thomas Jefferson" },
  { text: "He who buys what he does not need, steals from himself.", author: "Swedish Proverb" },
  { text: "The habit of saving is itself an education.", author: "T.T. Munger" },
  { text: "You must gain control over your money or the lack of it will forever control you.", author: "Dave Ramsey" },
  { text: "Money is a terrible master but an excellent servant.", author: "P.T. Barnum" },
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "John C. Maxwell" },
  { text: "Try to save something while your salary is small; it’s impossible to save after you begin to earn more.", author: "Jack Benny" },
  { text: "Richness is not about what you have, but what you can give.", author: "Unknown" },
  { text: "The real measure of your wealth is how much you’d be worth if you lost all your money.", author: "Unknown" },
  { text: "It’s not your salary that makes you rich, it’s your spending habits.", author: "Charles A. Jaffe" },
  { text: "He who will not economize will have to agonize.", author: "Confucius" },
  { text: "If you would be wealthy, think of saving as well as getting.", author: "Benjamin Franklin" },
  { text: "Being in control of your finances is a great stress reliever.", author: "Unknown" },
  { text: "Spend not where you may save; spare not where you must spend.", author: "John Ray" },
  { text: "The lack of money is the root of all evil.", author: "Mark Twain" },
  { text: "Do not go broke trying to look rich.", author: "Unknown" },
  { text: "Too many people spend money they haven't earned, to buy things they don't want, to impress people they don't like.", author: "Will Rogers" },
  { text: "A simple fact that is hard to learn is that the time to save money is when you have some.", author: "Joe Moore" },
  { text: "Money looks better in the bank than on your feet.", author: "Sophia Amoruso" },
  { text: "Wealth is the ability to fully experience life.", author: "Henry David Thoreau" },
  { text: "You can make money two ways — make more, or spend less.", author: "John Hope Bryant" },
  { text: "The easiest way to save money is to waste less energy.", author: "Barack Obama" },
  { text: "You must learn to save first and spend afterwards.", author: "John Poole" },
  { text: "Saving must become a priority, not just a thought.", author: "Dave Ramsey" },
  { text: "Money grows on the tree of persistence.", author: "Japanese Proverb" },
  { text: "Do not tell me where your priorities are. Show me where you spend your money and I’ll tell you what they are.", author: "James W. Frick" },
  { text: "If saving money is wrong, I don’t want to be right.", author: "William Shatner" },
  { text: "The quickest way to double your money is to fold it in half and put it back in your pocket.", author: "Will Rogers" },
  { text: "A wise person should have money in their head, but not in their heart.", author: "Jonathan Swift" },
  { text: "Don’t tell me what you value, show me your budget, and I’ll tell you what you value.", author: "Joe Biden" },
  { text: "Opportunity is missed by most people because it is dressed in overalls and looks like work.", author: "Thomas Edison" },
  { text: "Small daily savings add up to big money.", author: "Unknown" }
];


const SplashScreen = ({ onFinish }) => {
  const [quote, setQuote] = useState(QUOTES[0]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [logoAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Pick a random quote
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIndex]);
  }, []);

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      delay: 500,
      useNativeDriver: true,
    }).start();
    // Auto-finish after 2.8 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.background}
      >
        <View style={styles.centerContent}>
          {/* Logo */}
          <Animated.View style={{
            opacity: logoAnim,
            transform: [{ scale: logoAnim }],
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={styles.logo}>Cashalyst</Text>
          </Animated.View>
          {/* Quote with icon and attribution */}
          <Animated.View style={{ opacity: fadeAnim, marginTop: 36, alignItems: 'center' }}>
            <Text style={styles.quoteIcon}>❝</Text>
            <Text style={styles.quoteText} numberOfLines={2} ellipsizeMode="tail">{quote.text}</Text>
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          </Animated.View>
          {/* Progress bar */}
          <Animated.View style={{ opacity: fadeAnim, marginTop: 48 }}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </Animated.View>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    color: theme.colors.accent,
    fontFamily: theme.font.family.bold,
    fontSize: theme.font.size.title,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  quoteIcon: {
    fontSize: 32,
    color: theme.colors.textMain,
    marginBottom: 2,
    textAlign: 'center',
  },
  quoteText: {
    color: theme.colors.textMain,
    fontFamily: theme.font.family.medium,
    fontSize: theme.font.size.label,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 0,
    lineHeight: theme.font.lineHeight.body,
    maxWidth: 320,
  },
  quoteAuthor: {
    color: theme.colors.textSubtle,
    fontFamily: theme.font.family.medium,
    fontSize: theme.font.size.note,
    marginTop: 4,
    textAlign: 'center',
  },
  progressBar: {
    width: 120,
    height: 6,
    backgroundColor: theme.colors.input,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    width: '55%',
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
  },
});

export default SplashScreen; 