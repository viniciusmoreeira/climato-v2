import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Animated } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { format, startOfToday } from 'date-fns';
import { pt } from 'date-fns/esm/locale';
import LottieView from 'lottie-react-native';

import { ContainerScroll } from '~/components';
import { usePosition } from '~/hooks/getPosition';
import { Weather } from '~/models';
import { getWeather } from '~/services/getWeather';
import { fakeData } from '~/utils/fakeData';
import weatherDescription from '~/utils/getWeatherDescription';
import weatherIcon from '~/utils/getWeatherIcon';

import {
  Container,
  Header,
  MenuButton,
  LocationContainer,
  City,
  State,
  Date,
  WeatherContainer,
  GreetingText,
  WeatherWrapper,
  WeatherTemp,
  WeatherDescription,
  TabsContainer,
  TabsTitle,
  Holder,
} from './styles';

import { Today } from './Tabs';

const tabsData = [
  {
    id: 1,
    label: 'Hoje',
    value: 'today',
  },
  {
    id: 2,
    label: 'Amanhã',
    value: 'tomorrow',
  },
  {
    id: 3,
    label: 'Próximos 7 dias',
    value: 'next',
  },
];

const Home: React.FC = () => {
  const { address } = usePosition();
  const { dispatch, navigate } = useNavigation();
  const [weatherData, setWeatherData] = useState<Weather>(fakeData);
  const [opacity] = useState(new Animated.Value(0));
  const [tab, setTab] = useState('today');

  const handleGetWeather = useCallback(async () => {
    if (address !== null) {
      const newWeatherData = await getWeather(address.lat, address.lng);
      setWeatherData(newWeatherData);
    }
  }, [address]);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    handleGetWeather();
  }, [opacity, address, handleGetWeather]);

  const tabsMemo = useMemo(
    () =>
      tabsData.map((item) => (
        <MenuButton
          key={item.id}
          onPress={() => {
            item.value === 'next' ? navigate('NextDays') : setTab(item.value);
          }}
        >
          <Holder style={{ opacity: tab === item.value ? 1 : 0.4 }}>
            <TabsTitle>{item.label}</TabsTitle>

            {item.value === 'next' && (
              <Ionicons
                name="ios-arrow-forward"
                size={22}
                color="#fff"
                style={{ marginLeft: 5 }}
              />
            )}
          </Holder>
        </MenuButton>
      )),
    [tab, navigate],
  );

  return (
    <Animated.View
      style={{
        flex: 1,
        width: '100%',
        opacity,
      }}
    >
      <Container>
        <Header>
          <MenuButton>
            <Ionicons
              name="ios-search"
              size={28}
              color="#fff"
              style={{ marginRight: 10 }}
            />
          </MenuButton>

          <MenuButton onPress={() => dispatch(DrawerActions.toggleDrawer())}>
            <Ionicons name="ios-menu" size={36} color="#fff" />
          </MenuButton>
        </Header>

        <ContainerScroll>
          <LocationContainer>
            <City>{address?.city},</City>

            <State>{address?.state}</State>

            <Date>
              {format(startOfToday(), 'eee, dd MMM', {
                locale: pt,
              })}
            </Date>
          </LocationContainer>

          <WeatherContainer>
            <GreetingText>Hoje</GreetingText>

            <WeatherWrapper>
              <LottieView
                style={{ height: 100 }}
                source={weatherIcon[weatherData.current.weather[0].main]}
                autoPlay
                loop
              />

              <WeatherTemp>{weatherData.current.temp.toFixed()}°</WeatherTemp>
            </WeatherWrapper>

            <WeatherDescription>
              {weatherDescription[weatherData.current.weather[0].main]}
            </WeatherDescription>
          </WeatherContainer>

          <TabsContainer>{tabsMemo}</TabsContainer>

          <Today />
        </ContainerScroll>
      </Container>
    </Animated.View>
  );
};

export default Home;
