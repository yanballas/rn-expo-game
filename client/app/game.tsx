import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Background } from '@/client/components/Background';
import { Table, type TableHandle } from '@/client/components/Table/Table';
import { useGameStore } from '@/client/store';
import { bottomAreaPosition, cardStyles, colors, handCardsRowGap, topAreaPosition } from '@/client/utils/constants';

import bgItemsPng from '@/client/assets/images/background/bg_items.png';
import bgMainPng from '@/client/assets/images/background/bg_main.png';
import bgPatternPng from '@/client/assets/images/background/bg_pattern.png';

export default function GameScreen() {
    const router = useRouter();
    const tableRef = useRef<TableHandle>(null);
    const [isInteractionLocked, setIsInteractionLocked] = useState(false);
    const phase = useGameStore(store => store.phase);
    const playerScore = useGameStore(store => store.playerScore);
    const dealerScore = useGameStore(store => store.dealerScore);

    useEffect(() => {
        useGameStore.getState().resetGame();
        tableRef.current?.resetTable();
    }, []);

    const handleBackToMenu = () => {
        tableRef.current?.resetTable();
        useGameStore.getState().resetGame();
        router.push({ pathname: '/menu' });
    };

    return (
        <View style={styles.container}>
            <Background source={bgMainPng} />
            <Background source={bgItemsPng} />
            <Image source={bgPatternPng} style={styles.backgroundImagePattern} contentFit="contain" />

            <View style={[styles.topArea]}>
                <Text style={styles.scoreTop}>{dealerScore}</Text>
            </View>

            <View style={[styles.bottomArea]}>
                <Text style={styles.scoreBottom}>{playerScore}</Text>
            </View>

            <Table ref={tableRef} onInteractionLockedChange={setIsInteractionLocked} />

            <View style={styles.buttonRow}>
                {phase === 'idle' && (
                    <Pressable
                        style={[styles.button, isInteractionLocked && styles.buttonDisabled]}
                        disabled={isInteractionLocked}
                        onPress={() => tableRef.current?.dealInitialCards()}
                    >
                        <Text style={styles.buttonText}>Раздать</Text>
                    </Pressable>
                )}

                {phase === 'playerTurn' && (
                    <>
                        <Pressable
                            style={[styles.button, isInteractionLocked && styles.buttonDisabled]}
                            disabled={isInteractionLocked}
                            onPress={() => tableRef.current?.hitPlayer()}
                        >
                            <Text style={styles.buttonText}>Ещё</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.button, isInteractionLocked && styles.buttonDisabled]}
                            disabled={isInteractionLocked}
                            onPress={() => tableRef.current?.stand()}
                        >
                            <Text style={styles.buttonText}>Стоять</Text>
                        </Pressable>
                    </>
                )}

                {phase === 'roundEnd' && (
                    <Pressable
                        style={[styles.button, isInteractionLocked && styles.buttonDisabled]}
                        disabled={isInteractionLocked}
                        onPress={() => tableRef.current?.newRound()}
                    >
                        <Text style={styles.buttonText}>Новая раздача</Text>
                    </Pressable>
                )}

                {(phase === 'idle' || phase === 'roundEnd') && (
                    <Pressable
                        style={[styles.button, isInteractionLocked && styles.buttonDisabled]}
                        disabled={isInteractionLocked}
                        onPress={handleBackToMenu}
                    >
                        <Text style={styles.buttonText}>Назад в меню</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        backgroundColor: colors.background,
    },
    backgroundImagePattern: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
        width: 210,
        height: 210,
    },
    topArea: {
        position: 'absolute',
        alignItems: 'center',
        width: cardStyles.width * 2 + handCardsRowGap,
        height: cardStyles.height,
        top: topAreaPosition.top,
        left: '50%',
        transform: [{ translateX: '-50%' }],
    },
    bottomArea: {
        position: 'absolute',
        alignItems: 'center',
        width: cardStyles.width * 2 + handCardsRowGap,
        height: cardStyles.height,
        bottom: bottomAreaPosition.bottom,
        left: '50%',
        transform: [{ translateX: '-50%' }],
    },
    buttonRow: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    scoreTop: {
        position: 'absolute',
        top: -24,
        right: 0,
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
    },
    scoreBottom: {
        position: 'absolute',
        bottom: -24,
        right: 0,
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
    },
    button: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#1f2937',
    },
    buttonDisabled: {
        opacity: 0.55,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
