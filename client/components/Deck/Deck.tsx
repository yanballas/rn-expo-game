import { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { BackCard } from '@/client/components/Card/BackCard';
import {
    cardHalfHeightPx,
    cardStyles,
    deckLeftInset,
    deckStackOffset,
    deckTopCardOriginInset,
} from '@/client/utils/constants';
import type { CardPosition, DeckFlyingCardItem, FullCard, HitRecipient, HitRequest } from '@/client/utils/types';

import { useDealFlightMotion, useDealFromDeck, useHitCardFlight } from './Deck.hooks';
import { DeckFlyingCardsList } from './DeckFlyingCards';
import { buildDeck } from './helpers.functions';

interface DeckProps {
    isDealing: boolean;
    dealerPositions: CardPosition[];
    playerPositions: CardPosition[];
    onDealComplete: (dealerCards: FullCard[], playerCards: FullCard[]) => void;
    hitRequest: HitRequest | null;
    onHitComplete: (recipient: HitRecipient, card: FullCard) => void;
}

export function Deck({
    isDealing,
    dealerPositions,
    playerPositions,
    onDealComplete,
    hitRequest,
    onHitComplete,
}: DeckProps) {
    const deckRef = useRef<View>(null);
    const deckPos = useRef<CardPosition>({ x: 0, y: 0 });
    const [deckReady, setDeckReady] = useState(false);
    const poolRef = useRef(buildDeck());
    const uniqueId = useRef(0);

    const [flyingCards, setFlyingCards] = useState<DeckFlyingCardItem[]>([]);

    const flightMotion = useDealFlightMotion();

    const handleDeckLayout = useCallback((_e: LayoutChangeEvent) => {
        deckRef.current?.measureInWindow((x: number, y: number) => {
            deckPos.current = { x, y };
            setDeckReady(true);
        });
    }, []);

    useDealFromDeck({
        isDealing,
        deckReady,
        dealerPositions,
        playerPositions,
        deckPos,
        poolRef,
        uniqueId,
        setFlyingCards,
        flightMotion,
        onDealComplete,
    });

    useHitCardFlight({
        hitRequest,
        deckReady,
        isDealing,
        dealerPositions,
        playerPositions,
        deckPos,
        poolRef,
        uniqueId,
        setFlyingCards,
        flightMotion,
        onHitComplete,
    });

    return (
        <View style={styles.wrapper}>
            <View ref={deckRef} style={styles.deckVisual} onLayout={handleDeckLayout}>
                <View style={[styles.stackCard, styles.stackCard1]}>
                    <BackCard />
                </View>
                <View style={[styles.stackCard, styles.stackCard2]}>
                    <BackCard />
                </View>
                <DeckFlyingCardsList items={flyingCards} motion={flightMotion} />
                <View style={[styles.stackCard, styles.stackCard3]}>
                    <BackCard />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    deckVisual: {
        position: 'absolute',
        left: deckLeftInset,
        top: '50%',
        width: cardStyles.width,
        height: cardStyles.height,
        marginTop: -cardHalfHeightPx,
    },
    stackCard: {
        position: 'absolute',
        width: cardStyles.width,
        height: cardStyles.height,
        borderRadius: cardStyles.borderRadius,
        overflow: cardStyles.overflow,
    },
    stackCard1: {
        transform: [{ rotate: '-4deg' }],
        zIndex: 1,
    },
    stackCard2: {
        top: deckStackOffset,
        left: deckStackOffset,
        transform: [{ rotate: '2deg' }],
        zIndex: 2,
    },
    stackCard3: {
        top: deckTopCardOriginInset,
        left: deckTopCardOriginInset,
        zIndex: 3,
    },
});
