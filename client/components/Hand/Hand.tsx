import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FullCard as FullCardComponent } from '@/client/components/Card/FullCard';
import { cardStyles, colors, defaultHandSlotCount, handCardsRowGap } from '@/client/utils/constants';
import type { CardPosition, FullCard } from '@/client/utils/types';

interface HandProps {
    cards: FullCard[];
    label?: string;
    score?: number;
    onCardLayout?: (positions: CardPosition[]) => void;
}

export function Hand({ cards, label, score, onCardLayout }: HandProps) {
    const slotRefs = useRef<(View | null)[]>([]);

    const isShowingEmptyPlaceholders = cards.length === 0 && Boolean(onCardLayout);
    const slotCount = isShowingEmptyPlaceholders ? defaultHandSlotCount : cards.length;

    useEffect(() => {
        if (!onCardLayout || slotCount === 0) return;

        const positions: CardPosition[] = [];
        let slotsPlaceholders = 0;

        for (let i = 0; i < slotCount; i++) {
            const slotRef = slotRefs.current[i];
            if (!slotRef) break;
            slotRef.measureInWindow((x: number, y: number) => {
                positions[i] = { x, y };
                slotsPlaceholders++;
                if (slotsPlaceholders === slotCount) {
                    onCardLayout(positions);
                }
            });
        }
    }, [slotCount, onCardLayout]);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.cardsRow}>
                {isShowingEmptyPlaceholders
                    ? Array.from({ length: slotCount }, (_, index) => (
                          <View
                              key={`placeholder-${index}`}
                              ref={ref => {
                                  slotRefs.current[index] = ref;
                              }}
                              style={[styles.cardSlot, styles.placeholderSlot]}
                          />
                      ))
                    : cards.map((card, index) => (
                          <View
                              key={`${card.rank}-${card.suit}`}
                              ref={ref => {
                                  slotRefs.current[index] = ref;
                              }}
                              style={styles.cardSlot}
                          >
                              <FullCardComponent
                                  card={{ rank: card.rank, suit: card.suit, isFlipped: card.isFlipped ?? true }}
                              />
                          </View>
                      ))}
            </View>
            {score !== undefined && <Text style={styles.score}>{score}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 8,
    },
    cardsRow: {
        flexDirection: 'row',
        gap: handCardsRowGap,
    },
    cardSlot: {
        width: cardStyles.width,
        height: cardStyles.height,
    },
    placeholderSlot: {
        opacity: 0,
    },
    label: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    score: {
        color: colors.red,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
