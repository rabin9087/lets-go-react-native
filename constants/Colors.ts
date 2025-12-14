const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    card: '#fff', // card background
    seatBox: '#F5F5F5', // seat container background
    seatSelectedBg: '#4B9EF6', // selected seat background
    seatSelectedText: '#fff', // selected seat text color
    seatText: '#000', // default seat text color
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    card: '#1E1E1E', // card background
    seatBox: '#2A2A2A', // seat container background
    seatSelectedBg: '#00A1FF', // selected seat background
    seatSelectedText: '#fff', // selected seat text color
    seatText: '#fff', // default seat text color
  },
};
