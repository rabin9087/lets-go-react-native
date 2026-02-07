import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppSelector } from './store/hooks';
import LoginForm from './pages/user/UserSignin';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Map from './pages/home/Map';

export default function EntryPoint() {
  const { user } = useAppSelector(s => s.userInfo);
  const theme = useColorScheme() ?? 'light';

  // While checking auth status
  // if (loading) {
  //   return (
  //     <View style={[styles.centered, { backgroundColor: Colors[theme].background }]}>
  //       <ActivityIndicator size="large" color={Colors[theme].tint} />
  //     </View>
  //   );
  // }

  // If user exists, show Home (Map), otherwise show Login
  return user?._id ? <Map /> : <LoginForm />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});