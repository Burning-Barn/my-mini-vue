import { trigger, track } from "./effect"


export function reactive(raw) {
    const proxy = new Proxy(raw, {
        get(target, key) {
            const _vlaue = Reflect.get(target, key)
            // track
            track(target, key)
            return _vlaue
        },
        set(target, key, value):boolean {
            const _vlaue = Reflect.set(target, key, value)

            // trigger
            trigger(target, key)
            return _vlaue
        }
    })

    return proxy
}