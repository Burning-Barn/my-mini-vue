import { ReactiveEffect } from "../../reactivity/effect";
import { queuePreFulshCb } from "../scheduler";

export function watchEffect(fn, option?) {
    let _cleanup

    function job() {
        _effect.run()
    }
    
    function onCleanup(cleanup) {
        _cleanup = cleanup
        _effect.onStop = cleanup
    }

    function watchEffectFn() {
        // watchEffect第一次进入不调用onCleanup()函数中的回调函数
        // 更新时才调用onCleanup()函数中的回调函数
        if(_cleanup) {
            _cleanup()
        }

        fn(onCleanup)
    }

    const _effect = new ReactiveEffect(watchEffectFn, () => {
        queuePreFulshCb(job)
    })

    _effect.run()

    return () => {
        _effect.stop()
    }
}