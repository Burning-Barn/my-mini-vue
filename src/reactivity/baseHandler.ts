import { track, trigger } from "./effect"
import { reactive, reactiveFlags, readonly } from "./reactive"
import { isObject } from "./shared"

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

export function createGetter(isReadonly=false, isShollow=false) {
    return function get(target, key) {
        const _vlaue = Reflect.get(target, key)
        if(!isReadonly && key === reactiveFlags.IS_REACTIVE) {
            return true 
            // return !isReadonly   
        } else if(isReadonly && key === reactiveFlags.IS_READONLY ) {
            return true
        }

        if(isShollow) {
            return _vlaue
        }

        if(isObject(_vlaue)) {
            return isReadonly ? readonly(_vlaue) : reactive(_vlaue)
        }

        if (!isReadonly) {
            // track
            track(target, key)
        }
        return _vlaue
    }
}

export function createSetter() {
    return function set(target, key, value):boolean {
        const _vlaue = Reflect.set(target, key, value)
        // trigger
        trigger(target, key)
        return _vlaue
    }
}

export function mutableHandlers() {
    return {
        get,
        set,
    }
}

export function readonlyHandlers() {
    return {
        get: readonlyGet,
        set(target, key, value):any {
            console.warn(`${String(key)}不可更改，因为${target}是只读的。`)
            return true
        } 
    }
}

export function shallowReadonlyHandlers() {
    return {
        get: shallowReadonlyGet,
        set(target, key, value):any {
            console.warn(`${String(key)}不可更改，因为${target}是只读的。`)
            return true
        } 
    }
}