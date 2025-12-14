import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import Map from './pages/home/Map';
import Protect from '@/components/Protect';
import LoginForm from './pages/user/UserSignin';

export default function HomeScreen() {

  return (
    <Protect fallback={<LoginForm />}>
      <View style={styles.container}>
        <Map />
      </View>
    </Protect>
   
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loginBtn: {
    position: 'absolute',
    bottom: 40,
    left: '25%',
    width: '50%',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  loginText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
