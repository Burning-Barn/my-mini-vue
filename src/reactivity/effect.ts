import { extend } from "./shared/index"

// class reactiveEffect 
class reactiveEffect {
    private _fn
    deps: Array<Set<any>> = []
    active = true
    onStop?: ()=> void

    constructor(fn, public scheduler?) {
        this._fn = fn
        this.scheduler = scheduler
    }

    run() {
        activeEffect = this
        return this._fn()
    }

    stop() {
        // 优化stop功能，多次stop，只出发一次
        if(this.active) {
            cleanupEffect(this)
            this.active = false
            if(this.onStop) {
                this.onStop()
            }
        }
    }
}

function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect)
    })
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
    if(!activeEffect) return
    depMap.add(activeEffect)
    // 反向记录，如stop的时候，用activeEffect删除depMap里的它
    activeEffect.deps.push(depMap)
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

export function stop(runner) {
    runner.effect.stop()
}

let activeEffect
export function effect(fn, options:any={}) {
    const scheduler = options.scheduler
    const _effect = new reactiveEffect(fn, scheduler)
    // options
    // Object.assign(_effect, options)
    extend(_effect, options)
    _effect.onStop = options.onStop
    
    _effect.run()

    const _runner: any = _effect.run.bind(_effect)
    _runner.effect = _effect
    return _runner
}