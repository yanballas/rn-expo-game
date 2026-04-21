import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, Text, View } from 'react-native';

import { useEffect, useState } from 'react';

import { Background } from '@/client/components/Background';

import { imageAssets } from '@/client/utils/asset.list';

import bgLoadingPng from '@/client/assets/images/background/bg_loading.png';
import logoPng from '@/client/assets/images/items/logo.png';
import { colors } from '@/client/utils/constants';

export default function LoadingScreen() {
    const router = useRouter();
    const [loadingText, setLoadingText] = useState('Loading...');

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const loadAssets = async () => {
            try {
                setLoadingText('Loading assets...');
                await Asset.loadAsync(imageAssets);

                if (isMounted) {
                    setLoadingText('Redirecting to menu...');
                    router.replace({ pathname: '/menu' });
                }
            } catch (error) {
                console.error('Failed to load assets:', error);
                if (isMounted) {
                    setLoadingText('Retrying...');
                    setTimeout(loadAssets, 1000);
                }
            }
        };

        timeoutId = setTimeout(async () => {
            await SplashScreen.hideAsync();
            loadAssets();
        }, 3000);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [router]);

    return (
        <View style={styles.container}>
            <Background source={bgLoadingPng} />
            <Image source={logoPng} style={styles.logo} contentFit="contain" />
            <Text style={styles.text}>{loadingText}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        backgroundColor: colors.background,
    },
    logo: {
        width: 310,
        height: 135,
    },
    text: {
        fontSize: 18,
        fontWeight: '600',
    },
});
