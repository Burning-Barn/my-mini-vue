const queue:Array<any> = []
let isFlushPending = false

export function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve()
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
        let job
        while(job = queue.shift()) {
            job && job()
        }
    })
}