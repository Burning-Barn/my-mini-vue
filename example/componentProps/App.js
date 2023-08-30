import {h} from '../../lib/my-mini-vue.esm.js'
import { foo } from './foo.js'
export const App = {
    render() {
        window.self = this
        // ui
        return h(
                "div", 
                {
                    id: 'root',
                    class: ['red', 'hard'],
                    onClick() {
                        console.log('onClick---div')
                    },
                    onMousemove() {
                        // console.log('onMousemove')
                    }
                } ,
                // "hi, " + this.msg
                // "hi-app"
                [
                    h('div', {id: 'son1', class: ['red']}, 'son1'),
                    h('div', {id: 'son2', class: ['green']}, this.msg),
                    h(foo, {
                        count: 100,
                        onAdd(a, b) {
                            console.log('emit 触发===', a, b)
                        },
                        onAddFoo(a, b) {
                            console.log('emit onAddFoo 触发===', a, b)
                        }
                    })
                ]
            )
    },
    setup() {
        // const msg = 'mini-vue'

        return { msg: "mini-vue" }
    }
}