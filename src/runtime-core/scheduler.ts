const queue:Array<any> = []
const activePreFlushCbs: any[] = []

let isFlushPending = false

export function nextTick(fn?) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve()
}

export function queuePreFulshCb(cb) {
    activePreFlushCbs.push(cb)
    queueFlush()
}

export function queueJobs(jobs) {
    if(!queue.includes(jobs)) {
        queue.push(jobs)
    }

    queueFlush()
}

function queueFlush() {
    if(isFlushPending) {
        return
    }
    isFlushPending = true
    Promise.resolve().then(() => {
        isFlushPending = false

        // 组件更新之前，执行watchEffect的fn
        for (let i = 0; i < activePreFlushCbs.length; i++) {
            activePreFlushCbs[i]()
        }

        let job
        while(job = queue.shift()) {
            job && job()
        }
    })
}