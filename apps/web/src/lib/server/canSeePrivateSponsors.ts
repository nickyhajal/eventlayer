// Staff can open private sponsor pages in the app to preview them before making them public
export function canSeePrivateSponsors(me?: { isSuperAdmin?: boolean | null; type?: string | null } | null) {
	return Boolean(me?.isSuperAdmin || ['staff', 'volunteer'].includes(me?.type ?? ''))
}
