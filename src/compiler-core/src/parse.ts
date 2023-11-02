import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End
}

export function baseParse(content) {
  const _context = createParseContext(content)
  return createRoot(parseChildren(_context, []))
}

// function isEnd(tagType, _context) {
//   if(_context.source.startsWith(`</${tagType}>`)) {
//     return true
//   }

//   if(!_context.source) {
//     return true
//   }
// }
function isEnd(ancestors, _context) {
  // if(_context.source.startsWith(`</${tagType}>`)) {
  //   return true
  // }
  if(_context.source.startsWith(`</`)) {
    for (let i = ancestors.length - 1; i >= 0; i-=1) {
      // const _ = ancestors[i];
      // if(`</${ancestors[i].tag}>` === _context.source) {
      const _tag = ancestors[i].tag
      if(_context.source.slice(2, 2+_tag.length) === _tag) {
        return true
      }
    }
  }

  if(!_context.source) {
    return true
  }
}

function parseChildren(_context, ancestors) {
  const _nodes: any = []

  let _node
  while (!isEnd(ancestors, _context)) {
    if(_context.source.startsWith('{{')) {
      _node = parseInterpolation(_context)
    } else if(_context.source[0] === '<') {
      if(/[a-z]/i.test(_context.source[1])) {
        _node = parseElement(_context, ancestors)
      }
    } 
  
    if(!_node) {
      _node = parseText(_context)
    }
    _nodes.push(_node)
  }

  return _nodes
}

function advanceBy(_context, length) {
  _context.source = _context.source.slice(length)
}

function parseTextData(context, length) {
  const _content = context.source.slice(0, length)
  advanceBy(context, length)
  return _content
}

function parseText(_context) {
  const _s = _context.source
  let _endIndex = _s.length
  // let _endIndex = _context.source.length
  const _endFlags = ['<', '{{']
  for (let i = 0; i < _endFlags.length; i++) {
    const _index = _s.indexOf(_endFlags[i])
    if(_index !== -1 && _index < _endIndex ) {
      _endIndex = _s.indexOf(_endFlags[i])
    }
  }

  const _content = parseTextData(_context, _endIndex)

  return {
    type: NodeTypes.TEXT,
    content: _content
  }
}

function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function parseElement(_context, ancestors) {
  const _ele:any = parseTag(_context, TagType.Start)
  // ancestors
  ancestors.push(_ele)
  _ele.children = parseChildren(_context, ancestors)
  // if(ancestors.pop() === _context.source) {
  ancestors.pop()
  if(startsWithEndTagOpen(_context.source, _ele.tag)) {
    parseTag(_context, TagType.End)
  } else {
    throw(`缺少结束标签:${_ele.tag}`)
  }

  return _ele
}

function parseTag(_context, type: TagType) {
  const _exg: any = /^<\/?([a-z]+)/.exec(_context.source)
  console.log('_exg--->', _exg)
  const _tag = _exg[1]

  advanceBy(_context,  _exg[0].length)
  advanceBy(_context, 1)
  console.log('_context', _context)

  if(type === TagType.End) {
    return
  }

  return {
    type: NodeTypes.ELEMENT,
    tag: _tag,
  }
}

function parseInterpolation(_context) {
  const _openDelimiter = '{{'
  const _closeDelimiter = '}}'

  // {{message}}
  const _closeIndex = _context.source.indexOf(_closeDelimiter, _openDelimiter.length)
  // 推进
  // _context.source = _context.source.slice(_openDelimiter.length)
  advanceBy(_context, _openDelimiter.length)

  const _rawContentLength = _closeIndex - _openDelimiter.length
  const rawContent = _context.source.slice(0, _rawContentLength)
  const content = rawContent.trim()

  // 推进
  _context.source = _context.source.slice(_rawContentLength + _closeDelimiter.length)

  return   {
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content
        }
      }
}


function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT
  }
}

function createParseContext(content) {
  return {
    source: content,
    type: NodeTypes.ROOT
  }
}