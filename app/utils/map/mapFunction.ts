import { IUpdateOnlineStatus, updateOnlineStatus } from "@/app/axios/driver";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setIsSocketConnected } from "@/app/store/slices/socketInfo.slice";
import { ILocation, setDropoffLocation, setPickupLocation } from "@/app/store/slices/trip.slice";
import { setDriverOnlineStatus } from "@/app/store/slices/user.slice";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import { goOnlineDriverSocket } from "../sockets/driver.socket";
import { connectSocket, disConnectSocket, socket } from "../sockets/socket";
import { AppThunk } from "@/app/store";

export const handleMapLongPress = async (event: any, setSelectedLocation: any) => {
        try {
            const { latitude, longitude } = event.nativeEvent.coordinate;

            // Reverse geocode
            const result = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            const place = result[0];

            const address = [
                place?.name,
                place?.street,
                place?.city,
                place?.region,
                place?.postalCode,
                place?.country,
            ]
                .filter(Boolean)
                .join(", ");

            setSelectedLocation({
                coords: { latitude, longitude },
                address,
            });

            // 👉 OPTIONAL: dispatch directly
            // dispatch(setPickupLocation({ address, coords: { latitude, longitude } }));

        } catch (error) {
            console.error("Reverse geocode failed:", error);
        }
    };

export const handleSetPickup = (selectedLocation: ILocation) => {
        const dispatch = useAppDispatch()
 return  dispatch(
    setPickupLocation({
      address: selectedLocation.address,
      coords: selectedLocation.coords,
    })
  );
};

export const handleSetDestination = (selectedLocation: ILocation) => {
    const dispatch = useAppDispatch()

  return dispatch(
    setDropoffLocation({
      address: selectedLocation.address,
      coords: selectedLocation.coords,
    })
  );
};


  /* ---------------- GO ONLINE / OFFLINE ---------------- */

export const goOnlineThunk =
  (onlineStatus: boolean, setLoading: (loading: boolean) => void): AppThunk =>
  async (dispatch, getState) => {
    try {
      const { tripInfo, socketInfo, userInfo, onlineDriversInfo } = getState();
      const { pickupLocation, dropoffLocation, routeInfo } = tripInfo;
      const { isSocketConnected } = socketInfo;
        const { user } = userInfo;
        const {driver} = onlineDriversInfo

      if (!user) {
        console.warn("User not found");
        return;
      }
      setLoading(true)
      const payload: IUpdateOnlineStatus = {
        currentLocation: pickupLocation,
        destination: dropoffLocation!,
        email_phone: user.phone!,
        onlineStatus,
        rego: "AS87GH",
        seatAvailable: driver?.seatAvailable as number,
        routeGeo:
          routeInfo.routeGeo?.map(({ longitude, latitude }) => ({
            longitude,
            latitude,
          })) ?? [],
      };

      /* =========================
         SOCKET HANDLING
      ========================= */
      if (onlineStatus) {
        if (!isSocketConnected) {
          connectSocket(user._id as string, user.role as string);

          goOnlineDriverSocket(user._id as string);

          dispatch(setIsSocketConnected(true));
        }
      } else {
        if (isSocketConnected) {
          disConnectSocket();
          dispatch(setIsSocketConnected(false));
        }
      }

      /* =========================
         API CALL
      ========================= */
      const response = await updateOnlineStatus(payload);

      if (response?.status === "success") {
        dispatch(setDriverOnlineStatus(onlineStatus));
        Toast.show({
          type: "success",
          text1: `You are now ${onlineStatus ? "Online 🟢" : "Offline 🔴"}`,
        });
      }
        setLoading(false)
    } catch (error) {
      console.error("Go online error:", error);

      Toast.show({
        type: "error",
        text1: "Failed to update status",
        text2: "Please try again",
      });
    }
  };

