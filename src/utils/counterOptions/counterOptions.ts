import { flags } from '@inject';
import { TURBO_PARAMS_FEATURE } from 'generated/features';
import { RSYA_COUNTER_TYPE } from 'src/providers/counterOptions/const';
import { OptionsKeysMaps } from 'src/providers/counterOptions/types';
import { cReduce } from 'src/utils/array';
import { equal } from 'src/utils/function';
import { entries, isObject } from 'src/utils/object';
import { setTurboInfo } from 'src/utils/turboParams';
import { CounterOptions, CounterTypeInterface } from './types';

// NOTE: Extend the type in order to be able to check all string inputs.
export const isRsyaCounter =
    equal<CounterTypeInterface | string>(RSYA_COUNTER_TYPE);

export const normalizeOriginalOptions = (
    counterId: Record<string, unknown> | number,
    counterParams?: Record<string, unknown>,
    counterType?: number,
    counterDefer?: boolean,
): Record<string, unknown> => {
    return isObject(counterId)
        ? counterId
        : {
              ['id']: counterId,
              ['type']: counterType,
              ['defer']: counterDefer,
              ['params']: counterParams,
          };
};

export const normalizeOptions = (
    counterId: Record<string, unknown> | number,
    optionsKeysMap: OptionsKeysMaps,
    counterParams?: Record<string, unknown>,
    counterType?: number,
    counterDefer?: boolean,
): CounterOptions => {
    const counterData: Record<string, unknown> = normalizeOriginalOptions(
        counterId,
        counterParams,
        counterType,
        counterDefer,
    );

    const options = cReduce(
        (
            acc: Record<string, unknown>,
            [obfuscatedKey, { optKey: key, normalizeFunction: normalize }],
        ) => {
            const value = counterData[key];
            acc[obfuscatedKey] = normalize ? normalize(value) : value;

            return acc;
        },
        {},
        entries(optionsKeysMap),
    ) as unknown as CounterOptions;

    if (flags[TURBO_PARAMS_FEATURE]) {
        setTurboInfo(options, options.params || {});
    }

    return options;
};
