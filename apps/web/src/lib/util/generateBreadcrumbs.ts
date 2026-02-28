import { getCompanyContext } from '$lib/state/getContexts'
import { getContext } from 'svelte'

interface RouteConfig {
  label?: string
  dynamicLabel?: (getBreadCrumbLabel: (type: string, id: string) => string, value: string) => string
}

type Breadcrumb = {
  to: string
  label: string
}

interface RouteConfigTree {
  uri: string
  conf: RouteConfig
  uris?: RouteConfigTree[]
}

const breadcrumbConfig: RouteConfigTree = {
  uri: 'manage',
  conf: { label: 'Manage' },
  uris: [
    {
      uri: 'companies',
      conf: { label: 'Companies' },
      uris: [
        {
          uri: ':companyId',
          conf: {
            dynamicLabel: (
              getBreadCrumbLabel: (type: string, id: string) => string,
              companyId: string,
            ) => getBreadCrumbLabel('company', companyId),
          },
          uris: [
            { uri: 'sets', conf: { label: 'Report' } },
            {
              uri: 'user',
              conf: {},
              uris: [
                {
                  uri: ':userId',
                  conf: {
                    dynamicLabel: (
                      getBreadCrumbLabel: (type: string, id: string) => string,
                      userId: string,
                    ) => getBreadCrumbLabel('user', userId),
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export function generateBreadcrumbs(
  path: string,
  getBreadCrumbLabel: (type: string, id: string) => string = (type, id) => id,
  configTree: RouteConfigTree = breadcrumbConfig,
  currentPath = '',
): Breadcrumb[] {
  const pathSegments = path.split('/').filter((segment) => segment)
  const breadcrumbs: Breadcrumb[] = []

  if (!pathSegments.length) return []

  const segment = pathSegments.shift()
  if (!segment) return breadcrumbs

  let matchedConfig: RouteConfigTree | undefined

  // Check for direct match
  for (const childConfig of configTree.uris || []) {
    if (childConfig.uri === segment) {
      matchedConfig = childConfig
      break
    }
  }

  // Check for dynamic segments if no direct match found
  if (!matchedConfig) {
    for (const childConfig of configTree.uris || []) {
      if (childConfig.uri.startsWith(':')) {
        matchedConfig = childConfig
        break
      }
    }
  }

  if (matchedConfig) {
    // Ensure we're not on the current page
    const label =
      matchedConfig.conf.label ||
      (matchedConfig.conf.dynamicLabel &&
        matchedConfig.conf.dynamicLabel(getBreadCrumbLabel, segment))
    if (label) {
      breadcrumbs.push({
        to: `${currentPath}/${segment}`,
        label: label,
      })
    }
  }

  // Continue processing the path
  breadcrumbs.push(
    ...generateBreadcrumbs(
      pathSegments.join('/'),
      getBreadCrumbLabel,
      matchedConfig || configTree,
      `${currentPath}/${segment}`,
    ),
  )

  return breadcrumbs
}
