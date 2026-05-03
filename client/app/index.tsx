import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';

import { useEffect } from 'react';

import { Background } from '@/client/components/Background';

import { imageAssets } from '@/client/utils/asset.list';

import bgLoadingPng from '@/client/assets/images/background/bg_loading.png';
import logoPng from '@/client/assets/images/items/logo.png';

import { colors } from '@/client/utils/constants';
import { sleep } from '@/client/utils/functions';

const logoScreenDuration = 3000;

export default function LoadingScreen() {
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;
        let retryTimeoutId: ReturnType<typeof setTimeout> | undefined;

        const loadAssets = async () => {
            try {
                await Asset.loadAsync(imageAssets);
                await SplashScreen.hideAsync();
                await sleep(logoScreenDuration);

                if (isMounted) {
                    router.replace({ pathname: '/menu' });
                }
            } catch (error) {
                console.error('Failed to load assets:', error);
                await SplashScreen.hideAsync();
                if (isMounted) {
                    retryTimeoutId = setTimeout(loadAssets, 1000);
                }
            }
        };

        loadAssets();

        return () => {
            isMounted = false;
            clearTimeout(retryTimeoutId);
        };
    }, [router]);

    return (
        <View style={styles.container}>
            <Background source={bgLoadingPng} />
            <Image source={logoPng} style={styles.logo} contentFit="contain" />
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
