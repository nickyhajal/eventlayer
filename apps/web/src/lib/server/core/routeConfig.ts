interface RedirectConfig {
	base: string
}
export interface RouteConfig {
	navVisible?: boolean
	navClass?: string
	mainClass?: string
	mobileNavVisible?: boolean
	bgColor?: string
	exactRedirect?: boolean | string
	auth?:
		| 'public'
		| 'logged-out'
		| 'logged-in'
		| 'event-staff'
		| 'community-admin'
		| 'not-community-member'
		| 'super-admin'
	failedAuthRedirect?: RedirectConfig
}

export interface RouteConfigTree {
	uri: string
	conf: RouteConfig
	uris?: RouteConfigTree[]
}

export const routeDefaults: RouteConfig = {
	navVisible: true,
	navClass: '',
	mobileNavVisible: true,
	bgColor: 'white',
	exactRedirect: false,
	auth: 'public', // public, loggedOut, authd
}

export const routeConfig: RouteConfigTree = {
	uri: 'index',
	conf: {
		navVisible: true,
		mainClass: 'bg-white',
		navClass: 'border-b-0',
	},
	uris: [
		{
			uri: 'manage',
			conf: {
				mainClass: 'bg-slate',
				navClass: 'bg-slate',
				auth: 'super-admin',
			},
		},
		{
			uri: 'checkin',
			conf: {
				mainClass: 'bg-slate',
				navClass: 'bg-slate',
				auth: 'event-staff',
			},
		},
		{
			uri: 'join',
			conf: { mainClass: 'bg-white', auth: 'not-community-member' },
		},
		{
			uri: 'signup',
			conf: {
				mainClass: 'bg-white',
				auth: 'logged-out',
			},
		},
		{ uri: 'login', conf: { mainClass: 'bg-white', auth: 'logged-out' } },
		{ uri: 'create-board', conf: { mainClass: 'bg-slate' } },
		{ uri: 'become-a-teacher', conf: { mainClass: 'bg-slate' } },
		{
			uri: 'account',
			conf: {
				mainClass: 'bg-slate',
				navClass: 'bg-slate',
				auth: 'logged-in',
			},
		},
		{
			uri: 'settings',
			conf: { mainClass: 'bg-slate', auth: 'community-admin' },
		},
		{ uri: 'admin', conf: { mainClass: 'bg-slate', auth: 'super-admin' } },
		{
			uri: 'community',
			conf: {
				auth: 'community-member',
				exactRedirect: '/community',
				mainClass: 'bg-slate',
			},
			uris: [
				{
					uri: ':communityId',
					conf: {
						mainClass: 'bg-slate full',
						navClass: 'bg-slate-300',
						navVisible: true,
						mobileNavVisible: false,
					},
					uris: [
						{
							uri: 'admin',
							conf: {
								mainClass: 'bg-white',
								navClass: 'bg-slate-400 border-b border-slate-600',
							},
						},
						{ uri: 'feed', conf: { mainClass: 'bg-slate' } },
					],
				},
			],
		},
	],
}
