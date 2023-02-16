import { flags } from '@inject';
import {
    CLICK_MAP_FEATURE,
    RETRANSMIT_FEATURE,
    SENDER_COLLECT_FEATURE,
} from 'generated/features';
import {
    BUILD_FLAGS_BR_KEY,
    BUILD_VERSION_BR_KEY,
    UID_BR_KEY,
} from 'src/api/watch';
import { addMiddlewareForProvider } from 'src/middleware';
import { retransmit } from 'src/middleware/retransmit';
import { watchSyncFlags } from 'src/middleware/watchSyncFlags';
import { providersSync } from 'src/providersEntrypoint';
import { providerMap } from 'src/sender';
import { SENDER_CLICKMAP } from 'src/sender/const';
import {
    MiddlewareBasedSender,
    useMiddlewareBasedSender,
} from 'src/sender/middleware';
import { nameMap, queryStringTransports } from 'src/transport';
import { addCounterOptions } from '../counterOptions';
import { useClickmapProvider } from './clickmap';
import { CLICKMAP_PROVIDER, TClickMapParams } from './const';

declare module 'src/providers/index' {
    interface PROVIDERS {
        /** Functionality for sending information about clicks to build heat map of clicks */
        CLICKMAP_PROVIDER: typeof CLICKMAP_PROVIDER;
    }
}
declare module 'src/sender/types' {
    interface NameMap {
        /** Sender for heat map of clicks */
        [CLICKMAP_PROVIDER]: MiddlewareBasedSender;
    }

    interface Senders {
        SENDER_CLICKMAP: typeof SENDER_CLICKMAP;
    }
}

declare module 'src/utils/counterOptions/types' {
    interface CounterOptions {
        /** Params for heat map of clicks or flag to disable */
        clickmap?: TClickMapParams;
    }
}

export const initProvider = () => {
    // NOTE: The clickmap feature works with a separate route (/clmap/) which is not yet compatible with MP.
    if (flags[CLICK_MAP_FEATURE] && !flags[SENDER_COLLECT_FEATURE]) {
        providersSync.push(useClickmapProvider);
        providerMap[CLICKMAP_PROVIDER] =
            useMiddlewareBasedSender(SENDER_CLICKMAP);
        nameMap[CLICKMAP_PROVIDER] = queryStringTransports;
        addMiddlewareForProvider(
            CLICKMAP_PROVIDER,
            watchSyncFlags([
                UID_BR_KEY,
                BUILD_VERSION_BR_KEY,
                BUILD_FLAGS_BR_KEY,
            ]),
            1,
        );
        if (flags[RETRANSMIT_FEATURE]) {
            addMiddlewareForProvider(CLICKMAP_PROVIDER, retransmit, 2);
        }
        addCounterOptions({
            clickmap: {
                optKey: 'clickmap',
            },
        });
    }
};
