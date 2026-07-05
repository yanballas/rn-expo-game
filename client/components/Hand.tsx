import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useGameStore } from '@/client/store';
import { cardStyles, colors, defaultHandSlotCount, handCardsRowGap } from '@/client/utils/constants';
import type { CardPosition } from '@/client/utils/types';

interface HandProps {
    side: 'dealer' | 'player';
    label?: string;
}

export function Hand({ side, label }: HandProps) {
    const setDealerPositions = useGameStore(store => store.setDealerPositions);
    const setPlayerPositions = useGameStore(store => store.setPlayerPositions);

    const slotRefs = useRef<(View | null)[]>([]);

    useEffect(() => {
        const positions: CardPosition[] = [];
        let slotsPlaceholders = 0;

        for (let i = 0; i < defaultHandSlotCount; i++) {
            const slotRef = slotRefs.current[i];
            if (!slotRef) break;
            slotRef.measureInWindow((x: number, y: number) => {
                positions[i] = { x, y };
                slotsPlaceholders++;
                if (slotsPlaceholders === defaultHandSlotCount) {
                    if (side === 'dealer') {
                        setDealerPositions(positions);
                    } else {
                        setPlayerPositions(positions);
                    }
                }
            });
        }
    }, [side, setDealerPositions, setPlayerPositions]);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.cardsRow}>
                {Array.from({ length: defaultHandSlotCount }, (_, index) => (
                    <View
                        key={`slot-${index}`}
                        ref={ref => {
                            slotRefs.current[index] = ref;
                        }}
                        style={styles.cardSlot}
                    />
                ))}
            </View>
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
