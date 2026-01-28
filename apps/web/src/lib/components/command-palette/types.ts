import type { ComponentType } from 'svelte'

export interface SearchResult {
	id: string
	label: string
	sublabel?: string
	group: string
	groupOrder: number
	icon?: ComponentType
	avatarUrl?: string
	avatarFallback?: string
	href?: string
	action?: () => void
	keywords?: string[]
}

export interface SearchProvider {
	group: string
	groupOrder: number
	icon: ComponentType
	search(query: string): Promise<SearchResult[]> | SearchResult[]
}
