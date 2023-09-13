import { trackEffect, trackking, triggerEffect } from "./effect"
import { reactive } from "./reactive"
import { isChange, isObject } from "./shared"

class RefImply {
    private _value
    public  dep
    private _rawValue
    public IS_REF = true

    constructor(raw) {
        this._rawValue = raw
        this._value = convert(raw)
        this.dep = new Set()
    }

    get value() {
        trackRefValue(this)
        return this._value
    }

    set value(newValue) {
        if(isChange(this._rawValue, newValue)) {
            this._value = convert(newValue)
            this._rawValue = newValue
            triggerEffect(this.dep)
        }
    }
}

function trackRefValue(ref) {
    if(trackking()) {
        trackEffect(ref.dep)
    }
}

function convert(raw) {
    // 如果是对象就reactive它
    return isObject(raw) ? reactive(raw) : raw
}

export function ref(raw) {
    return new RefImply(raw)
}

export function isRef(value) {
    return !!value.IS_REF
}

export function unRef(value) {
    return isRef(value) ? value.value : value
}

// const user = {
//     age: ref(10),
//     name: "xiaohong",
//   };

//   const proxyUser = proxyRefs(user);
  
//   expect(user.age.value).toBe(10);
//   expect(proxyUser.age).toBe(10);
// return 出来的ref 在模板中解开
export function proxyRefs(raw) {
    return new Proxy(raw, {
        get(target, key) {
            return unRef(Reflect.get(target, key))
        },
        set(target, key, value) {
            if(isRef(target[key]) && !isRef(value)) {
                return target[key].value = value
            } else {
                return Reflect.set(target, key, value)
            }
        }
    })
}