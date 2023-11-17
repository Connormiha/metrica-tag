import { isFunction } from 'src/utils/object/assertions';
import { POLYFILLS_FEATURE } from 'generated/features';
import { flags } from '@inject';
import type { Bind, AnyFunc, ParamsFirst, FuncRest } from '../types';
import { argsToArray } from '../args';
import { toNativeOrFalse } from '../isNativeFunction/toNativeOrFalse';

export const callPoly = (
    rawFnName: string | Function,
    args: any[] = [],
    rawCtx?: any,
) => {
    const ctx = rawCtx || {};
    const no = args.length;
    let fnName = rawFnName;
    if (isFunction(fnName)) {
        fnName = 'd';
        ctx[fnName] = rawFnName;
    }
    fnName = fnName as string;
    let result: any;
    if (!no) {
        result = ctx[fnName]();
    } else if (no === 1) {
        result = ctx[fnName](args[0]);
    } else if (no === 2) {
        result = ctx[fnName](args[0], args[1]);
    } else if (no === 3) {
        result = ctx[fnName](args[0], args[1], args[2]);
    } else if (no === 4) {
        result = ctx[fnName](args[0], args[1], args[2], args[3]);
    }
    return result;
};

const nativeBind = toNativeOrFalse(Function.prototype.bind, 'bind');

export const bindPoly: Bind = function b() {
    // eslint-disable-next-line prefer-rest-params
    const bindArgs = argsToArray(arguments);
    const [fn, ctx, ...topArgs] = bindArgs;
    return function a() {
        // eslint-disable-next-line prefer-rest-params
        const args = [...topArgs, ...argsToArray(arguments)];
        if (Function.prototype.call) {
            // eslint-disable-next-line
            return Function.prototype.call.apply(fn, [ctx, ...args]);
        }
        if (ctx) {
            let fnName = `_b`;
            while (ctx[fnName]) {
                fnName += `_${fnName.length}`;
            }
            ctx[fnName] = fn;
            const result = ctx[fnName] && callPoly(fnName, args, ctx);
            delete ctx[fnName];
            return result;
        }
        return callPoly(fn, args);
    };
};

const callBind = function bindDecorator(bindFunc: AnyFunc): Bind {
    return function bindFunction() {
        // eslint-disable-next-line prefer-rest-params
        const bindArgs = argsToArray(arguments);
        const [fn, ctx, ...args] = bindArgs;
        return bindFunc.apply(fn, [ctx].concat(args));
    };
};
const callNativeOrPoly = nativeBind ? callBind(nativeBind) : bindPoly;

export const bind: Bind = flags[POLYFILLS_FEATURE]
    ? callNativeOrPoly
    : callBind(Function.prototype.bind);

export const bindArgs = (args: any[], fn: AnyFunc) => {
    return bind(fn, null, ...args);
};

export const bindArg = <Func extends AnyFunc, P extends ParamsFirst<Func>>(
    arg: P,
    fn: Func,
): FuncRest<Func> => {
    return bind(fn, null, arg) as any;
};

type ObjectsWithMethods = Record<string, any> | string | RegExp;
type MethodsOf<T> = {
    [K in keyof T]: T[K] extends AnyFunc ? T[K] : never;
};

export const bindThisForMethod = <
    O extends ObjectsWithMethods,
    S extends MethodsOf<O>,
    M extends keyof MethodsOf<S>,
>(
    name: M,
    obj: S,
) => {
    return bind(obj[name], obj);
};

export const bindThisForMethodTest = (a: RegExp) =>
    bindThisForMethod('test', a);
