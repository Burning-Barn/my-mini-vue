// class reactiveEffect 
class reactiveEffect {
    private _fn

    constructor(fn, public scheduler?) {
        this._fn = fn
        this.scheduler = scheduler
    }

    run() {
        activeEffect = this
        return this._fn()
    }
}

const targetMap = new Map()

export function track(target, key) {
    let depsMap = targetMap.get(target)
    if(!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    let depMap = depsMap.get(key)
    if(!depMap) {
        depMap = new Set()
        depsMap.set(key, depMap)
    }
    depMap.add(activeEffect)
}

export function trigger(target, key) {
    const depsMap = targetMap.get(target)
    const depMap = depsMap.get(key)
    for (const dep of depMap) {
        if (dep.scheduler) {
            dep.scheduler()
        } else {
            dep.run()
        }
    }
}

let activeEffect
export function effect(fn, options:any={}) {
    const scheduler = options.scheduler
    const _effect = new reactiveEffect(fn, scheduler)
    _effect.run()
    return _effect.run.bind(_effect)
}