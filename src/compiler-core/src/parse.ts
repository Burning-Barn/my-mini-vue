import { NodeTypes } from "./ast";

const _end = {
  children: [
    {
      type: NodeTypes.INTERPOLATION,
      content: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: "message"
      }
    }
  ]
}

const enum TagType {
  Start,
  End
}

export function baseParse(content) {
  const _context = createParseContext(content)
  return createRoot(parseChildren(_context))
}

function parseChildren(_context) {
  const _nodes: any = []

  let _node
  if(_context.source.startsWith('{{')) {
    _node = parseInterpolation(_context)
  } else if(_context.source[0] === '<') {
    if(/[a-z]/i.test(_context.source[1])) {
      _node = parseElement(_context)
    }
  }

  _nodes.push(_node)
  return _nodes
}

function parseElement(_context) {
  const _ele = parseTag(_context, TagType.Start)
  parseTag(_context, TagType.End)

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
    tag: "div",
  }
}

function parseInterpolation(_context) {
  const _openDelimiter = '{{'
  const _closeDelimiter = '}}'

  const _closeIndex = _context.source.indexOf(_closeDelimiter, _openDelimiter.length)
  // 推进
  // _context.source = _context.source.slice(_openDelimiter.length)
  advanceBy(_context, _openDelimiter.length)

  const _rawContentLength = _closeIndex - _openDelimiter.length
  const rawContent = _context.source.slice(0, _rawContentLength)
  const content = rawContent.trim()

  // 推进
  _context.source = _context.source.slice(_closeIndex + _closeDelimiter.length)

  return   {
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content
        }
      }
}

function advanceBy(_context, length) {
  _context.source = _context.source.slice(length)
}

function createRoot(children) {
  return {
    children
  }
}

function createParseContext(content) {
  return {
    source: content
  }
}