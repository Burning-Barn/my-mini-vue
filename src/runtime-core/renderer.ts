import { effect } from "../reactivity"
import { isObject } from "../reactivity/shared/index"
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { shouldComponentUpdate } from "./componentUpdateUtil"
import { createAppApi } from "./createApp"
import { queueJobs } from "./scheduler"
import { Fragment, Text } from "./vonde"

export function createRenderer(option) {
    const {
        createElement: hostCreateElement,
        patchProps: hostPatchProps,
        insert: hostInsert,
        unmountChilren: hostUnmountChilren,
        setElementText: hostSetElementText,
    } = option

    function render(vnode, container) {
        // 调用patch
        patch(null, vnode, container, null, null)
    }
    
    // n1 上一次的vonde，旧的
    // n2 这次的vonde，新的
    function patch(n1, n2, container, parent, anchor) {
        // 处理组件，
        // 判断vnode是不是element还是component
        console.log('vnode', n2)
        const {type} = n2
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parent, anchor)
                break;
    
            case Text:
                processTextNode(n1, n2, container, parent)
                break;
        
            default:
                if(ShapeFlags.STATEFUL_COMPONENT & n2.shapeFlags) {
                // if(isObject(type)) {
                    // 是对象就是component
                    processComponent(n1, n2, container, parent, anchor)
                } else if(ShapeFlags.ELEMENT & n2.shapeFlags) {
                // } else if(typeof type === 'string') {
                    // 是字符串就是element
                    processElemnet(n1, n2, container, parent, anchor)
                }
                break;
        }
    }
    
    function processFragment(n1, n2, container, parent, anchor) {
        children(n2, container, parent, anchor)
    }
    
    function processTextNode(n1, n2, container, parent) {
        const { children } = n2
        const _children = (n2.el = document.createTextNode(children))
        container.append(_children)
    }
    
    function processElemnet(n1, n2, container, parent, anchor) {
        if(!n1) {
            mountElement(n2, container, parent, anchor)
        } else {
            patchElement(n1, n2, container, parent, anchor)
        }
    }

    function patchElement(n1, n2, container, parent, anchor) {
        console.log('n1', n1)
        console.log('n2', n2)

        const { props: prevProps } = n1 || {}
        const { props: nextProps } = n2 || {}

        const _el = (n2.el = n1.el)

        // patchChilren
        patchChilren(n1, n2, _el, parent, anchor)

        // patchProps
        patchProps(_el, prevProps, nextProps)
    }

    function unmountChilren(childrens) {
        for (const child of childrens) {
            hostUnmountChilren(child.el)
        }
    }

    function patchChilren(n1, n2, container, parent, anchor) {
        // debugger
        const { shapeFlags: preShapeFlags, children: preChildren } = n1
        const { shapeFlags, children } = n2
        if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
            // 新的是文本节点
            if (preShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
                // Array --> text
                unmountChilren(preChildren)
                hostSetElementText(children, container)
            } else {
                // text --> text
                hostSetElementText(children, container)
            }
        } else {
            // 新的是数组节点
            if(preShapeFlags & ShapeFlags.TEXT_CHILDREN) {
                // text --> Array
                hostSetElementText('', container)
                children.forEach(child => {
                    patch(null, child, container, parent, anchor)
                })
            } else {
                // Array --> Array
                patchKeyedChild(preChildren, children, container, parent, anchor)
            }

        }
    }

    function patchKeyedChild(preChildren, children, container, parent, parentAnchor) {
        let i = 0
        let e1 = preChildren.length - 1
        let e2 = children.length - 1

        function compareVnode(v1, v2):boolean {
            return v1.type === v2.type && v1.key === v2.key
        }
        // 1、左侧对比
        // (a b) c
        // (a b) d e
        while(i <= e1 && i <= e2) {
            if(compareVnode(preChildren[i], children[i])) {
                
                patch(preChildren[i], children[i], container, parent, parentAnchor)
            } else {
                break
            }
            i+=1
        }

        // 2、右侧对比
        // a (b c)
        // d e (b c)
        while(i <= e1 && i <= e2) {
            if(compareVnode(preChildren[e1], children[e2])) {
                patch(preChildren[e1], children[e2], container, parent, parentAnchor)
            } else {
                break
            }
            e1-=1
            e2-=1
        }


        if(i > e1) {
            // 3、新增  i > e1
            if(i <= e2) {
                // 1）左侧对比，右侧新增
                    // (a b)         e1
                    // (a b) c       e2
                    //  -----------------------------------   i=2 e1=1 e2=2
                    // (a b)
                    // (a b) c d
                    //  -----------------------------------   i=2 e1=1 e2=3
                // 2）右侧对比，左侧新增
                    //   (a b)
                    // c (a b)
                    // -----------------------------------   i=0 e1=-1 e2=0
                    //     (a b)
                    // d c (a b)
                    // -----------------------------------   i=0 e1=-1 e2=1
                const nextPos = e2 + 1
                const anchor = nextPos < children.length ? children[nextPos].el : null
                while(i <= e2) {
                    patch(null, children[i], container, parent, anchor)
                    i+=1
                }
            }
        } else if (i > e2) {
            // 4、删除 i > e2
                // 1）左侧对比，右侧删除
                    // (a b) c
                    // (a b)
                    // -----------------------------------   i=2 e1=2 e2=1
                    // (a b) c d
                    // (a b)
                    // -----------------------------------   i=2 e1=3 e2=1  
                // 2）右侧对比，左侧删除
                    // a (b c)
                    //   (b c)
                    // -----------------------------------   i=0 e1=0 e2=-1
                    // d a (b c)
                    //     (b c)
                    // -----------------------------------   i=0 e1=1 e2=-1
            while(i <= e1) {
                const _children = preChildren[i]
                hostUnmountChilren(_children.el)
                i+=1
            }
        } else {
            // 中间部分
            // vue key的使用：
            // 在diff对比时，需要遍历老节点，看每个老节点在nextVNode中是否存在，如果有key，可以直接遍历新节点做映射，在老节点中查找直接映射，为O(n)
            // 但是，如果没有key值，每个老节点都要遍历一遍nextVnode为 O(n),
            // 使用key,可以降低复杂度

            // a,b,(c,d),f,g
            // a,b,(e,c),f,g

            // a,b,(c,e,d),f,g
            // a,b,(e,c),f,g
            const _preMiddleStart = e1 - i 
            const _nextMiddleStart = e2 - i 

            const _keyToNewIndexMap = new Map()

            // 0 1  2 3 4  5 6
            //      
            // a,b,(c,d,e),f,g
            // a,b,(e,c,d),f,g
            //index 0 1 2
            //value 0 0 0     
            //     [4 2 3]  --------------> _newIndexToOldIndexMap
            // 老节点索引在新节点中的映射 
            const _newIndexToOldIndexMap = new Array(_nextMiddleStart + 1)
            // for (let index = i; index <= e2; index++) {
            //     _newIndexToOldIndexMap[index] = 0
            // }
            for (let index = 0; index <= e2 - i; index++) {
                _newIndexToOldIndexMap[index] = 0
            }


            // 优化 引入变量，解决
            // a,b,(c,e,d),f,g
            // a,b,(e,c),f,g
            // 当c,e,对比patch完成后，patch数量大于等于新节点middle中间值时，剩下的都是要删除的节点，直接删除，优化性能
            let _patched = 0
            let _middleCount = _nextMiddleStart + 1
            
            for (let n = i; n <= e2; n++) {
                _keyToNewIndexMap.set(children[n].key, n)
            }
            
            for (let p = i; p <= e1; p++) {
                if(_patched >= _middleCount) {
                    // 删除
                    hostUnmountChilren(preChildren[p].el)
                    continue
                }

                const _preC = preChildren[p];
                let _newIndex
                if(_preC.key !== null) {
                    _newIndex = _keyToNewIndexMap.get(_preC.key)
                } else {
                    for (let j = i; j < e2; j++) {
                        if(compareVnode(children[j], _preC)) {
                            _newIndex = j
                            break
                        }
                    }
                }

                if(_newIndex === undefined) {
                    // 删除
                    hostUnmountChilren(_preC.el)
                } else {
                    // 相同的patch，处理props
                    patch(_preC, children[_newIndex], container, parent, null)
                    _patched+=1
                }
                
                // 遍历老节点为_newIndexToOldIndexMap赋值     p+1是为了避免p=0的情况，应为初始化为0
                _newIndexToOldIndexMap[_newIndex - i] = p + 1
            }

            // 0 1  2 3 4  5 6
            // a,b,(c,d,e),f,g
            // a,b,(e,c,d),f,g            
            //     [4 2 3]  --------------> _newIndexToOldIndexMap
            //        23为稳定序列

            // 最长子序列： [1,2]
            const _increasingNewIndexSequence = getSequence(_newIndexToOldIndexMap)
            console.log('_increasingNewIndexSequence', _increasingNewIndexSequence)
            // let _sequenceIndex = 0
            // for (let s = i; s < _increasingNewIndexSequence.length + 1; s+=1) {
            //     if(s - i !== _increasingNewIndexSequence[_sequenceIndex]) {
            //         // 不等于稳定序列索引值，移动
            //         const _anthor = 
            //     } else {
            //         _sequenceIndex+=1
            //     }
            // }
            // 反向循环，因为insert需要插入anthor前面，所以从后面稳定的元素，开始循环，插入稳定元素前面。
            let _sequenceIndex = _increasingNewIndexSequence.length - 1
            for (let s = e2; s >= i; s-=1) {
                const _anthor = s + 1 < children.length ? children[s + 1] : null

                if(_newIndexToOldIndexMap[s - i] === 0) {
                    // 等于0 即 初始化的0，即 遍历旧节点没有赋值，即，为新增节点
                    patch(null, children[s], container, parent, _anthor.el)
                } else {
                    // 不等于0，看是不是为稳定序列，不是稳定序列移动
                    if(s - i !== _increasingNewIndexSequence[_sequenceIndex]) {
                        // 不等于稳定序列索引值，移动
                        hostInsert(children[s].el, container, _anthor.el)
                    } else {
                        _sequenceIndex-=1
                    }
                }
            }
        }
    }

    function patchProps(el, prevProps, nextProps) {
        if(prevProps === nextProps) return

        // 1、props 值变了（就包括了增加新值的情况，因为新值为undefind）
        // 2、props 值变为undefind null，在hostPatchProps处理删除
        for (const key in nextProps) {
            const _nextVal = nextProps[key]
            const _prevVal = prevProps[key]
            if(_nextVal !== _prevVal) {
                hostPatchProps(el, key, _prevVal, _nextVal)
            }
        }

        // 3、props 值没有了
        for (const key in prevProps) {
            if(!(key in nextProps)) {
                hostPatchProps(el, key, prevProps[key], null)
            }
        }

    }
    
    function mountElement(vonde, container, parent, anchor) {
        const { type, children, props } = vonde
        // 1、createElement
        // const el = (vonde.el = document.createElement(type))
        const el = (vonde.el = hostCreateElement(type))

        // 2、patchProps
        // const isOn = (key:string) => /^on[A-Z]/.test(key) 
        // for (const key in props) {
        //     const _val = props[key]
        //     if(isOn(key)) {
        //         el.addEventListener(key.slice(2).toLocaleLowerCase(), _val)
        //     } else {
        //         el.setAttribute(key, _val)
        //     }
        // }
        for (const key in props) {
            const _val = props[key]
            hostPatchProps(el, key, null, _val)
        }
    
        // 3、handle children
        if(vonde.shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        // if(Array.isArray(children)) {
            children.forEach(child => {
                patch(null, child, el, parent, anchor)
            })
            // moutChildren(vnode, el)
        } else if(vonde.shapeFlags & ShapeFlags.TEXT_CHILDREN) {
        // } else if(typeof children === 'string') {
            el.textContent = children
        }

        // 4、insert
        // container.append(el)
        hostInsert(el, container, anchor)
    }
    
    function children(vonde, container, parent, anchor) {
        vonde.children.forEach(child => {
            patch(null, child, container, parent, anchor)
        })
    }
    
    function processComponent(n1, n2, container, parent, anchor) {
        if(!n1) {
            mountComponent(n2, container, parent, anchor)
        } else {
            patchComponent(n1, n2, container, parent, anchor)
        }
    }

    function patchComponent(n1, n2, container, parent, anchor) {
        const instance = (n2.component = n1.component)
        if(shouldComponentUpdate(n1.props, n2.props)) {
            instance.next = n2
            instance.update()

        } else {
            n2.el = n1.el
            instance.vnode = n2
        }
    }
    
    function mountComponent(initialVnode, container, parent, anchor) {
        const instance = createComponentInstance(initialVnode, parent)
        initialVnode.component = instance
    
        setupComponent(instance)
    
        setupRenderEffect(instance, initialVnode, container, anchor)
    }
    
    function setupRenderEffect(instance,initialVnode, container, anchor) {

        instance.update = effect(() => {   
            if(!instance.isMounted) {
                console.log('init')
                const { proxy } = instance
                const subTree = (instance.subTree = instance.render.call(proxy))

                patch(null, subTree, container, instance, anchor)

                instance.isMounted = true
                initialVnode.el = subTree.el
            } else {
                console.log('update')
                const { proxy, subTree: prevSubTree, next, vnode } = instance

                if(next) {
                    // 组件更新逻辑
                    next.el = vnode.el
                    instance.vnode = next
                    instance.next = null
                    instance.props = next.props
                }

                const subTree = instance.render.call(proxy)

                console.log('prevSubTree', prevSubTree)
                console.log('subTree', subTree)
                instance.subTree = subTree
                patch(prevSubTree, subTree, container, instance, anchor)
            } 
        }, {
            scheduler() {
                queueJobs(instance.update)
            }
        })
    }

    return {
        createApp: createAppApi(render)
    }
}


function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        j = result[result.length - 1];
        if (arr[j] < arrI) {
          p[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          c = (u + v) >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    return result;
  }