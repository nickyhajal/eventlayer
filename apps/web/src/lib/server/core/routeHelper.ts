import { routeConfig, routeDefaults, type RouteConfig, type RouteConfigTree } from './routeConfig'

type ConfigsByRoute = { [key: string]: RouteConfig }

function applyRouteConfig(routeConfig: RouteConfigTree, base = '', out = {} as ConfigsByRoute) {
  const path = `${base}/${routeConfig.uri.replace('index', '')}`.replace('//', '/')
  const vals = routeConfig.conf || {}
  out[path] = { ...routeDefaults, ...vals }
  if (routeConfig.uris) {
    routeConfig.uris.forEach((next) => applyRouteConfig(next, path, out))
  }
  return out
}

const routes = applyRouteConfig(routeConfig)

// Accepts partial match, which allows for cascading values
function doesRouteMatch(route: string, current: string) {
  let doesMatch = true
  const routeParts = route.split('/')
  const currentParts = current.split('/')
  for (let i = 0; i < routeParts.length; i++) {
    const part = routeParts[i]
    if (part[0] !== ':' && part !== currentParts[i]) {
      doesMatch = false
      break
    }
  }
  return doesMatch
}

export function validRouteAuth(route: RouteConfig, user: boolean) {
  const { auth } = route
  if (auth) {
    if (auth === 'logged-in' && !user) return false
  }
  return true
}
export const getConfigForRoute = (route: string) => {
  if (routes[route]) return routes[route]
  let match = { ...routeDefaults }
  Object.entries(routes).forEach(([key, val]) => {
    const currMatch = doesRouteMatch(key, route)
    if (currMatch) {
      match = { ...match, ...val }
    }
  })
  return match || routeDefaults
}
