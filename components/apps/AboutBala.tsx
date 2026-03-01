'use client';
import Portfolio from '../Portfolio';
import { useIsClay } from '../hooks/useIsClay';
import { glassPanel } from '../hooks/useClayStyles';

export default function AboutBala() {
    const clay = useIsClay();
    return (
        <div
            className={`h-full w-full overflow-auto ${clay ? 'rounded-[16px]' : ''}`}
            style={clay ? glassPanel : undefined}
        >
            <Portfolio embedded />
        </div>
    );
}
