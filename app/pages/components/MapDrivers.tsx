import { Ionicons } from "@expo/vector-icons";
import { Marker } from "react-native-maps";
import { useAppSelector } from "@/app/store/hooks";

export default function MapDrivers({ color }: { color: string }) {
    const { drivers } = useAppSelector((s) => s.onlineDriversInfo);

    return (
        <>
            {drivers.map(
                (d, i) =>
                    d.currentLocation && (
                        <Marker key={i} coordinate={d.currentLocation}>
                            <Ionicons name="car-sport" size={34} color={color} />
                        </Marker>
                    )
            )}
        </>
    );
}
