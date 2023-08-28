import {h} from '../../lib/my-mini-vue.esm.js'
export const App = {
    render() {
        window.self = this
        // ui
        return h(
                "div", 
                {
                    id: 'root',
                    class: ['red', 'hard']
                } ,
                // "hi, " + this.msg
                // "hi-app"
                [
                    h('div', {id: 'son1', class: ['red']}, 'son1'),
                    h('div', {id: 'son2', class: ['green']}, this.msg)
                ]
            )
    },
    setup() {
        // const msg = 'mini-vue'

        return { msg: "mini-vue" }
    }
}