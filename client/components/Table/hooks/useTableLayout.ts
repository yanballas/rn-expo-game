import { useCallback, useRef, useState } from 'react';
import type { View } from 'react-native';

import { defaultHandSlotCount } from '@/client/utils/constants';
import type { CardLayout, CardPosition, Recipient } from '@/client/utils/types';

import { resolveSlotPosition } from '../functions/helpers.functions';

const initialLayout: CardLayout = {
    deck: null,
    dealerSlots: [],
    playerSlots: [],
};

export function resolveCardPosition(layout: CardLayout, recipient: Recipient, slotIndex: number): CardPosition | null {
    const slots = recipient === 'dealer' ? layout.dealerSlots : layout.playerSlots;
    return resolveSlotPosition(slots, slotIndex);
}

export function getInitialLayoutError(layout: CardLayout): string | null {
    if (!layout.deck) return 'Deck layout is not ready.';
    if (layout.dealerSlots.length < defaultHandSlotCount) return 'Dealer slots layout is not ready.';
    if (layout.playerSlots.length < defaultHandSlotCount) return 'Player slots layout is not ready.';
    return null;
}

export function useTableLayout() {
    const wrapperRef = useRef<View>(null);
    const deckRef = useRef<View>(null);
    const dealerSlotRefs = useRef<(View | null)[]>([]);
    const playerSlotRefs = useRef<(View | null)[]>([]);
    const layoutRef = useRef<CardLayout>(initialLayout);

    const [layout, setLayout] = useState<CardLayout>(initialLayout);

    const applyLayout = useCallback((nextLayout: CardLayout) => {
        layoutRef.current = nextLayout;
        setLayout(nextLayout);
    }, []);

    const measureViewInWrapper = useCallback((view: View, onMeasure: (position: CardPosition) => void) => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        wrapper.measureInWindow((wrapperX, wrapperY) => {
            view.measureInWindow((x, y) => {
                onMeasure({ x: x - wrapperX, y: y - wrapperY });
            });
        });
    }, []);

    const measureLayout = useCallback(() => {
        const deck = deckRef.current;
        if (!deck) return;

        const nextLayout: CardLayout = {
            deck: null,
            dealerSlots: [],
            playerSlots: [],
        };

        let pendingMeasurements = 1 + defaultHandSlotCount * 2;

        const finishMeasurement = () => {
            pendingMeasurements--;
            if (pendingMeasurements === 0) {
                applyLayout(nextLayout);
            }
        };

        measureViewInWrapper(deck, position => {
            nextLayout.deck = position;
            finishMeasurement();
        });

        for (let index = 0; index < defaultHandSlotCount; index++) {
            const dealerSlot = dealerSlotRefs.current[index];
            const playerSlot = playerSlotRefs.current[index];

            if (!dealerSlot || !playerSlot) return;

            measureViewInWrapper(dealerSlot, position => {
                nextLayout.dealerSlots[index] = position;
                finishMeasurement();
            });

            measureViewInWrapper(playerSlot, position => {
                nextLayout.playerSlots[index] = position;
                finishMeasurement();
            });
        }
    }, [applyLayout, measureViewInWrapper]);

    return {
        layout,
        layoutRef,
        refs: {
            wrapperRef,
            deckRef,
            dealerSlotRefs,
            playerSlotRefs,
        },
        measureLayout,
    };
}
