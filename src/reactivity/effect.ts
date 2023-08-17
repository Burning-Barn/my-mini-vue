import { extend } from "./shared/index"
let activeEffect
let sholdTrack = false

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
        if(!this.active) {
            return this._fn()
        }
        // effect.spec.ts it("stop", () => { obj.prop++ })
        // 当使用obj.prop++ 会出发obj.prop的get,又会收集依赖，但是stop之后不应该再次收集依赖，如果收集就会在SET时候出发依赖，也就是只有在effect中的Fn执行时，才要收集依赖，
        // 当执行run方法才把收集依赖开关打开，即sholdTrack=true，收集完依赖就关掉，这样就实现只在run方法调用get操作才收集依赖
        activeEffect = this
        sholdTrack = true
        const _res = this._fn()
        sholdTrack = false
        return _res
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

function trackking() {
    return activeEffect !== undefined && sholdTrack
}

export function track(target, key) {
    // if(!trackking()) return 
    if(!activeEffect) return
    if(!sholdTrack) return
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