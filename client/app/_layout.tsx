import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { colors } from '../utils/constants';

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
