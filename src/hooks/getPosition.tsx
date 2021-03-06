import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { Weather } from '~/models';
import { getWeather } from '~/services/getWeather';
import { convertStates } from '~/utils/convertStates';

interface PositionContextData {
  loading: boolean;
  hasPosition: boolean;
  address: AddressProps;
  weatherData: Weather;
  getUserPosition(): Promise<void>;
  getUserManualPosition(lat: number, long: number): Promise<void>;
}

interface AddressProps {
  state?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  country?: string | null;
  name?: string | null;
  lat: number;
  lng: number;
  district?: string | null;
  region?: string | null;
  subregion?: string | null;
  postalCode?: string | null;
  isoCountryCode?: string | null;
  timezone?: string | null;
}

const PositionContext = createContext<PositionContextData>(
  {} as PositionContextData,
);

export const PositionProvider: React.FC = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<AddressProps>({} as AddressProps);
  const [hasPosition, setHasPosition] = useState(false);
  const [weatherData, setWeatherData] = useState<Weather>({} as Weather);

  const getUserPosition = useCallback(async () => {
    const { status } = await Location.requestPermissionsAsync();

    if (status !== 'granted') {
      console.log('Permission to access location was denied');

      const newWeatherData = await getWeather(
        -22.885639213520715,
        -43.33045667687955,
      );

      const [
        storagedLat,
        storagedLng,
        storagedAddress,
      ] = await AsyncStorage.multiGet([
        '@Climato: latitude',
        '@Climato: longitude',
        '@Climato: address',
      ]);

      if (storagedLat[1] && storagedLng[1] && storagedAddress[1]) {
        const weatherDataWithStoragedLatLng = await getWeather(
          Number(storagedLat[1]),
          Number(storagedLng[1]),
        );

        setWeatherData(weatherDataWithStoragedLatLng);
        setAddress(JSON.parse(storagedAddress[1]));
        setHasPosition(true);
        setLoading(false);

        return;
      }

      setWeatherData(newWeatherData);
      setHasPosition(false);
      setLoading(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });

    if (location !== null) {
      setHasPosition(true);

      const pos = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      const newWeatherData = await getWeather(pos.lat, pos.lng);
      setWeatherData(newWeatherData);

      const userAddress = await Location.reverseGeocodeAsync({
        latitude: pos.lat,
        longitude: pos.lng,
      });

      const addressData = {
        ...userAddress[0],
        state:
          userAddress[0].region &&
          (Platform.OS === 'ios'
            ? convertStates(userAddress[0].region)
            : userAddress[0].region),
        city:
          Platform.OS === 'android'
            ? userAddress[0].subregion
            : userAddress[0].city,
        neighborhood: userAddress[0].district,
        name:
          Platform.OS === 'android'
            ? `${userAddress[0].street} - ${userAddress[0].name}`
            : userAddress[0].name,
        lat: pos.lat,
        lng: pos.lng,
      };

      setAddress(addressData);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    getUserPosition();
  }, [getUserPosition]);

  const getUserManualPosition = useCallback(
    async (lat: number, long: number) => {
      if (lat && long) {
        setHasPosition(true);

        const pos = {
          lat,
          lng: long,
        };

        const newWeatherData = await getWeather(pos.lat, pos.lng);
        setWeatherData(newWeatherData);

        const userAddress = await Location.reverseGeocodeAsync({
          latitude: pos.lat,
          longitude: pos.lng,
        });

        const addressData = {
          ...userAddress[0],
          state:
            userAddress[0].region &&
            (Platform.OS === 'ios'
              ? convertStates(userAddress[0].region)
              : userAddress[0].region),
          city:
            Platform.OS === 'android'
              ? userAddress[0].subregion
              : userAddress[0].city,
          neighborhood: userAddress[0].district,
          name:
            Platform.OS === 'android'
              ? `${userAddress[0].street} - ${userAddress[0].name}`
              : userAddress[0].name,
          lat: pos.lat,
          lng: pos.lng,
        };

        setAddress(addressData);

        await AsyncStorage.multiSet([
          ['@Climato: latitude', pos.lat.toString()],
          ['@Climato: longitude', pos.lng.toString()],
          ['@Climato: address', JSON.stringify(addressData)],
        ]);
      }

      setLoading(false);
    },
    [],
  );

  return (
    <PositionContext.Provider
      value={{
        loading,
        hasPosition,
        weatherData,
        address,
        getUserPosition,
        getUserManualPosition,
      }}
    >
      {children}
    </PositionContext.Provider>
  );
};

export function usePosition(): PositionContextData {
  const context = useContext(PositionContext);

  return context;
}
