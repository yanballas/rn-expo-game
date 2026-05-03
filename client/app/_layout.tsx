import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { colors } from '../utils/constants';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    return (
        <>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'fade',
                }}
            />
            <StatusBar style="auto" />
        </>
    );
}
