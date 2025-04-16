import { inject, InjectionKey } from 'vue'

/**
 * Wrapper around inject that throws an error if the key is not provided.
 * @param key
 * @param defaultValue
 */
export function mandatoryInject<T>(key: InjectionKey<T>, defaultValue?: T) {
    const resolved: T | undefined = inject(key, defaultValue);
    if (resolved == undefined) {
        throw new Error(`${key.description} was not provided.`);
    }
    return resolved;
}
