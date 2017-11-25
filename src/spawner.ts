import { readFileSync } from 'fs'
import { runInNewContext, createContext } from 'vm'
import { join } from 'path'

export const getFunction = route => {
  const mod:  { 
    exports?: Function | any
    __esModule?: boolean
  } = {}

  const context = createContext({
    module: mod,
    clearImmediate: clearImmediate,
    clearInterval: clearInterval,
    clearTimeout: clearTimeout,
    setImmediate: setImmediate,
    setInterval: setInterval,
    setTimeout: setTimeout,
    console: {},
    process: {
      env: {
        ...process.env,
        NODE_PATH: route.path
      },
      __path: '/',
      cwd: path => path ? this.__path = path : this.__path 
    },
    Buffer: Buffer,
    require: (path) => {
      switch(path) {
        case 'fs':
        case 'net':
        case 'process':
        case 'http': 
        case 'https':
          throw new Error('You cannot yet require this module for security reasons.')

        default:
          const modulePath = join(route.path, 'node_modules', path)

          return require(modulePath)
      } 
    }
  })

  const pkg = require(join(route.path, 'package.json'))
  const content = readFileSync(join(route.path, pkg.main))

  runInNewContext(content.toString(), context)

  const result = mod.__esModule ? mod.exports.default : mod.exports

  return result
}

export const getHandler = route => typeof route == 'function' 
  ? route 
  : getFunction(route)