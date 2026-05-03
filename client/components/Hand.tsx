import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cardStyles, colors, defaultHandSlotCount, handCardsRowGap } from '@/client/utils/constants';
import type { CardPosition } from '@/client/utils/types';

interface HandProps {
    count: number;
    label?: string;
    score?: number;
    onCardLayout?: (positions: CardPosition[]) => void;
}

export function Hand({ count, label, score, onCardLayout }: HandProps) {
    const slotRefs = useRef<(View | null)[]>([]);

    const slotCount = onCardLayout ? Math.max(count, defaultHandSlotCount) : count;
    const layoutSentinelRef = useRef(false);

    useEffect(() => {
        layoutSentinelRef.current = false;
    }, [slotCount]);

    useEffect(() => {
        if (!onCardLayout || slotCount === 0 || layoutSentinelRef.current) return;
        layoutSentinelRef.current = true;

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
                {Array.from({ length: slotCount }, (_, index) => (
                    <View
                        key={`slot-${index}`}
                        ref={ref => {
                            slotRefs.current[index] = ref;
                        }}
                        style={styles.cardSlot}
                    />
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
