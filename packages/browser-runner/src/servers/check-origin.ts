import {waitForCondition} from '@augment-vir/common';
import {log} from '../log';

export async function isOriginServerUp(externalContentOrigin: string): Promise<boolean> {
    try {
        await waitForCondition({
            async conditionCallback() {
                await fetch(externalContentOrigin);
                return true;
            },
            intervalMs: 100,
            timeoutMs: 5_000,
        });
        return true;
    } catch (error) {
        log.error(`Failed to connect to content origin: ${externalContentOrigin}`);
        return false;
    }
}
