const tintColorLight = "#2f95dc";
const tintColorDark = "#fff";

export default {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    border: "#E5E7EB", // ✅ ADD THIS
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
    card: "#fff",
    seatBox: "#F5F5F5",
    seatSelectedBg: "#4B9EF6",
    seatSelectedText: "#fff",
    seatText: "#000",
    backgroundPrimary: "#1976D2"
  },
  dark: {
    text: "#fff",
    background: "#000",
    tint: tintColorDark,
    border: "#3A3A3A", // ✅ ADD THIS
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
    card: "#1E1E1E",
    seatBox: "#2A2A2A",
    seatSelectedBg: "#00A1FF",
    seatSelectedText: "#fff",
    seatText: "#fff",
    backgroundPrimary: "#1976D2"

  },
};
