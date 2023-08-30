import { h } from '../../lib/my-mini-vue.esm.js'

export const foo = {
    render() {
        const _this = this

        const foo = h(
            'div',
            {

            },
            'foo'+this.count
        )

        const btn = h('button', {
            onClick() {
                _this.addCount()
            }
        }, 'addBtn')

        return h(
            'div',
            {

            },
            [foo, btn]
        )
    },
    setup(props, {emit}) {
        console.log('props', props.count)
        props.count+=1
        console.log('props', props.count)

        const addCount = () => {
            console.log('addCount')
            emit('add', 'a', 'b')
            emit('add-foo', 'a', 'b')
        }

        return { addCount }
    }
}