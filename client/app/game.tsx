import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Background } from '@/client/components/Background';
import { Deck } from '@/client/components/Deck/Deck';
import { Hand } from '@/client/components/Hand/Hand';
import { colors, defaultHandSlotCount } from '@/client/utils/constants';
import type { CardPosition, FullCard, HitRequest } from '@/client/utils/types';

import bgItemsPng from '@/client/assets/images/background/bg_items.png';
import bgMainPng from '@/client/assets/images/background/bg_main.png';
import bgPatternPng from '@/client/assets/images/background/bg_pattern.png';

export default function GameScreen() {
    const router = useRouter();
    const [isDealing, setIsDealing] = useState(false);
    const [playerCards, setPlayerCards] = useState<FullCard[]>([]);
    const [dealerCards, setDealerCards] = useState<FullCard[]>([]);
    const [dealerPositions, setDealerPositions] = useState<CardPosition[]>([]);
    const [playerPositions, setPlayerPositions] = useState<CardPosition[]>([]);
    const [hitRequest, setHitRequest] = useState<HitRequest | null>(null);

    const handleDeal = useCallback(() => {
        setIsDealing(true);
    }, []);

    const handleDealComplete = useCallback((dealtDealer: FullCard[], dealtPlayer: FullCard[]) => {
        setDealerCards(dealtDealer);
        setPlayerCards(dealtPlayer);
        setIsDealing(false);
    }, []);

    const handleDealerLayout = useCallback((positions: CardPosition[]) => {
        setDealerPositions(positions);
    }, []);

    const handlePlayerLayout = useCallback((positions: CardPosition[]) => {
        setPlayerPositions(positions);
    }, []);

    const handlePlayerHit = useCallback(() => {
        if (playerCards.length < defaultHandSlotCount || isDealing || hitRequest) return;
        setHitRequest({
            id: Date.now(),
            recipient: 'player',
            slotIndex: playerCards.length,
        });
    }, [playerCards.length, isDealing, hitRequest]);

    const handleHitComplete = useCallback((recipient: HitRequest['recipient'], card: FullCard) => {
        if (recipient === 'player') {
            setPlayerCards(prev => [...prev, card]);
        } else {
            setDealerCards(prev => [...prev, card]);
        }
        setHitRequest(null);
    }, []);

    return (
        <View style={styles.container}>
            <Background source={bgMainPng} />
            <Background source={bgItemsPng} />
            <Image source={bgPatternPng} style={styles.backgroundImagePattern} contentFit="contain" />

            <View style={styles.topArea}>
                <Hand cards={dealerCards} label="Дилер" onCardLayout={handleDealerLayout} />
            </View>

            <View style={styles.bottomArea}>
                <Hand cards={playerCards} label="Игрок" onCardLayout={handlePlayerLayout} />
            </View>

            <Deck
                isDealing={isDealing}
                dealerPositions={dealerPositions}
                playerPositions={playerPositions}
                onDealComplete={handleDealComplete}
                hitRequest={hitRequest}
                onHitComplete={handleHitComplete}
            />

            <View style={styles.buttonRow}>
                <Pressable
                    style={[styles.button, isDealing && styles.buttonDisabled]}
                    disabled={isDealing}
                    onPress={handleDeal}
                >
                    <Text style={styles.buttonText}>Раздать</Text>
                </Pressable>
                <Pressable
                    style={[
                        styles.button,
                        (playerCards.length < defaultHandSlotCount || isDealing || Boolean(hitRequest)) &&
                            styles.buttonDisabled,
                    ]}
                    disabled={playerCards.length < defaultHandSlotCount || isDealing || Boolean(hitRequest)}
                    onPress={handlePlayerHit}
                >
                    <Text style={styles.buttonText}>Ещё</Text>
                </Pressable>
                <Pressable style={styles.button} onPress={() => router.push({ pathname: '/menu' })}>
                    <Text style={styles.buttonText}>Назад в меню</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        flex: 1,
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
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    bottomArea: {
        position: 'absolute',
        bottom: 160,
        left: 0,
        right: 0,
        alignItems: 'center',
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
    button: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#1f2937',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
