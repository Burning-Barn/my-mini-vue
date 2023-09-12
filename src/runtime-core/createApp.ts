import { _render } from "../runtime-dom/index"
import { createVnode } from "./vonde"

export function createApp(rootComponent) {

    return {
        mount(rootContainer) {
            // 先转化为 vnode，后续所有操作基于vonde处理
            // component ————> vonde
            const vnode = createVnode(rootComponent)

            _render(vnode, rootContainer)
        }
    }
}

