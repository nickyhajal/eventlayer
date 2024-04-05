import { parse } from 'csv-parse/sync'

import {
	and,
	db,
	eq,
	eventUserInfoTable,
	eventUserTable,
	formResponseTable,
	formSessionTable,
	userTable,
} from '@matterloop/db'
import { dayjs } from '@matterloop/util'

let eventId = '3b41ad8e-649e-42be-b9a4-e7b94dd98e74'
let formId = '206c5453-6369-46c6-bf59-6504b9eb44cc'

export async function loadUsers() {
	let input = Object.entries(cols).reduce((out, [col, val]) => {
		if (val) {
			out = out.replace(col, val)
		}
		return out
	}, csv)
	const eusers = await db.query.eventUserTable.findMany({
		where: and(eq(eventUserTable.eventId, eventId)),
	})
	// if (eusers.length > 100) return
	// const us = users.split('\n')
	const records = parse(input, {
		columns: true,
		delimiter: ';',
		trim: true,
		skip_empty_lines: true,
	})
	return await Promise.all(records.map((u) => loadUser(u)))
}

interface Row {
	type: string
	name: string
	email: string
	company: string
	title: string
	linkedin_url: string
	hearabout: string
	why: string
	topics: string
	feedback: string
	traveling: string
	dietary: string
	accessibility: string
	sayhi: string
}
export async function loadUser(line: Row) {
	function replaceBlanks(str: string) {
		if (['.', 'self', 'N/A', 'NONE', 'n/a', 'None', 'none', 'Na', 'na'].includes(str)) return ''
		return str
	}
	function getLIUrl(str: string) {
		let clean = replaceBlanks(line.linkedin_url)
			.replaceAll(' ', '')
			.split('?')[0]
			.toLowerCase()
			.replace('https://www.linkedin.com', '')
			.replace('https://linkedin.com', '')
			.replace('http://www.linkedin.com', '')
			.replace('http://linkedin.com', '')
			.replace('www.linkedin.com', '')
			.replace('@linkedin.com', '')
			.replace('linkedin.com', '')
			.replace(/\/$/, '')
			.replace(/^\//, '')
		if (clean && !clean.includes('/')) {
			clean = `in/${clean}`
		}
		return clean
	}
	line.company = replaceBlanks(line.company)
	line.title = replaceBlanks(line.title)
	line.linkedin_url = getLIUrl(line.linkedin_url)
	const { type, name, email } = line
	// console.log(line, name)
	const firstName = name.substring(0, name.indexOf(' ')).replace('&comma;', ',')
	const lastName = name.substring(name.indexOf(' ') + 1).replace('&comma;', ',')
	const types = {
		Team: 'staff',
		Attendee: 'attendee',
		'Impact Partner': 'impact-partner',
		Speaker: 'speaker',
		Sponsor: 'sponsor',
	}
	const elementMap = {
		company: '425bd460-e65c-41f3-a784-6de624a05c97',
		title: 'cb47d60a-6988-4adb-b12b-601ff4763bae',
		linkedin_url: '1f95c2ec-fda6-43d4-8bf4-ce7baa2c958d',
		hearabout: '51aefb0b-022f-4963-849e-8f8b8cfd2f27',
		why: 'fab5b1f3-42bc-43ed-b9ed-e0bcef47101b',
		topics: 'b18f27f6-7a95-4f8c-9c69-b7f54f9e2019',
		feedback: '66f9fcae-3b9c-4f74-8a8e-3c66f9fc36db',
		traveling: '6abc2861-8316-4d4e-9556-76b7e0e5a05a',
		dietary: '33fc341a-08eb-4074-b76c-de8800a80216',
		accessibility: '2a6f52c6-4c20-4011-bc58-df54a4814c1d',
		sayhi: '8c66cf9a-5029-4533-afd3-967da51b20de',
	}
	const infoMap = {
		company: 'company',
		title: 'title',
		linkedin_url: 'linkedin_url',
		why: 'why-attending',
		topics: 'interests',
		traveling: 'traveling-from',
	}
	const whyAttendingMap = {
		minded: 'community',
		technology: 'learn',
		knowledge: 'connect',
		policy: 'contribute',
		support: 'understand',
		justice: 'justice',
		message: 'other',
	}
	const topicsMap = {
		behavior: 'behavior',
		future: 'future',
		health: 'health',
		workforce: 'workforce',
		energy: 'energy',
		buildings: 'buildings',
		vehicles: 'vehicles',
	}
	line.why = JSON.stringify(
		Object.entries(whyAttendingMap).reduce((out, [key, val]) => {
			if (line.why.toLowerCase().includes(key)) {
				out.push(val)
			}
			return out
		}, []),
	)
	line.topics = JSON.stringify(
		Object.entries(topicsMap).reduce((out, [key, val]) => {
			if (line.topics.toLowerCase().includes(key)) {
				out.push(val)
			}
			return out
		}, []),
	)
	let user = await db.query.userTable.findFirst({
		where: eq(userTable.email, email),
	})
	if (!user) {
		const inserted = await db
			.insert(userTable)
			.values({
				email,
				firstName,
				lastName,
			})
			.returning()
		if (inserted) {
			user = inserted[0]
		}
	}
	if (user) {
		let eventUser = await db.query.eventUserTable.findFirst({
			where: and(eq(eventUserTable.eventId, eventId), eq(eventUserTable.userId, user.id)),
		})
		if (!eventUser) {
			const inserted = await db
				.insert(eventUserTable)
				.values({
					type: types[type] || 'attendee',
					userId: user.id,
					eventId,
					// title,
					// url,
					// company,
				})
				.returning()
			if (inserted) {
				eventUser = inserted[0]
			}
		}
		await db
			.delete(eventUserInfoTable)
			.where(and(eq(eventUserInfoTable.eventId, eventId), eq(eventUserInfoTable.userId, user.id)))
		await db
			.delete(formSessionTable)
			.where(and(eq(formSessionTable.formId, formId), eq(formSessionTable.userId, user.id)))
		await db
			.delete(formResponseTable)
			.where(and(eq(formResponseTable.formId, formId), eq(formResponseTable.userId, user.id)))
		const infoRows = Object.entries(infoMap)
			.map(([key, infoKey]) => ({
				userId: user?.id,
				eventId: eventId,
				public: true,
				key: infoKey,
				value: line[key] || '',
			}))
			.filter(({ value }) => value)
		if (infoRows.length) {
			await db.insert(eventUserInfoTable).values(infoRows)
		}
		if (infoRows.length) {
			const sessionRes = await db
				.insert(formSessionTable)
				.values({
					userId: user?.id,
					eventId: eventId,
					formId: formId,
					status: 'submitted',
					submissionDate: dayjs().format('YYYY-MM-DD'),
				})
				.returning()
			const session = sessionRes[0]
			if (session) {
				const elementRows = Object.entries(elementMap)
					.map(([key, rowKey]) => ({
						userId: user?.id,
						formId: formId,
						eventId: eventId,
						type: 'text',
						sessionId: session.id,
						elementId: rowKey,
						value: line[key] || '',
					}))
					.filter(({ value }) => value)
				if (elementRows.length) {
					await db.insert(formResponseTable).values(elementRows)
				}
			}
		}
	}
}

const cols = {
	'attendee BADGE type': 'type',
	name: false,
	email: false,
	'Company or Organization you are representing': 'company',
	'Position Title': 'title',
	'Your Linkedin Profile URL (If you do not have one, please write NONE)': 'linkedin_url',
	'How did you hear about the WINGS conference?': 'hearabout',
	'Why are you attending the Wings conference? What do you hope to get out of it? (Please choose your top 1-3 statements that best match you)':
		'why',
	'Which of the following topics interest you the most that we’ll be addressing at the Wings conference? (Please choose your top 3 preferences)':
		'topics',
	'Do you have any initial feedback or recommendations about the topics we will be discussing at Wings?':
		'feedback',
	'Where are you traveling from to attend the Wings conference? (City and State). If you are coming from Portland, please indicate the specific part of the city.':
		'traveling',
	'Do you have any dietary restrictions we should be aware of? (Please be as specific as possible)':
		'dietary',
	'Do you have any accessibility needs we should be aware of? (We are committed to providing equal access and attendee experience for all)':
		'accessibility',
	'Anything else you’d like to share with us? Did we miss anything? Just wanted to say hi? Let us know here.':
		'sayhi',
}

const csv = `attendee BADGE type;name;email;Company or Organization you are representing;Position Title;Your Linkedin Profile URL (If you do not have one, please write NONE);How did you hear about the WINGS conference?;Why are you attending the Wings conference? What do you hope to get out of it? (Please choose your top 1-3 statements that best match you);Which of the following topics interest you the most that we’ll be addressing at the Wings conference? (Please choose your top 3 preferences);Do you have any initial feedback or recommendations about the topics we will be discussing at Wings?;Where are you traveling from to attend the Wings conference? (City and State). If you are coming from Portland, please indicate the specific part of the city.;Do you have any dietary restrictions we should be aware of? (Please be as specific as possible);Do you have any accessibility needs we should be aware of? (We are committed to providing equal access and attendee experience for all);Anything else you’d like to share with us? Did we miss anything? Just wanted to say hi? Let us know here.
Staff;Michelle Jones;michelle@smithandjonesinnovation.com;Smith and Jones Innovation;Partner;https://www.linkedin.com/in/michelledjones1/;Other;;Behavior & Adoption, Future-Planning & Health;The drop down menu above needs some work so it is more clear. At minimum let's split the duos and have each thing listed individually (i.e., list Future Planning as one and Health as another). We might also need teeny phrases to clarify what each one means. I think people will automatically choose just one because even though the drop down DOES let you choose three it does not look like it does and folks are used to having check boxes if they are supposed to choose more than one thing.;Portland (should we prompt for city and state or let people write something like SE Portland if they want?;None;None;"For the thumbnail / image for this I would suggest using a version of the logo without the trees behind it and just the logo lockup without the date included since the page already has the date in several places. 
 

 Thanks, Jedd, for building this registration page for us!"
Staff;Heejae Jeong;heejae@smithandjonesinnovation.com;Smith and Jones Innovation;Business Developer;https://www.linkedin.com/in/heejae-jeong/;Other;;Future-Planning, Health, Behavior & Adoption;;Seoul, South Korea;No;No;
Staff;Katherine Krajnak;krajnakk@prosperportland.us;Prosper Portland;Green Cities Industry Liaison;https://www.linkedin.com/in/katherinekrajnak/;I’m a sponsor;;Energy & Storage, Behavior & Adoption, Infrastructure;;Portland;Lactose intolerant;No;
Staff;Juan Barraza;juan.barraza@vertuelab.org;VertueLab;Director of Innvoation and Entrepreneurship;https://www.linkedin.com/in/barrazajuan/;I’m an Impact Partner;;Behavior & Adoption;NA;Portland;None;None;Hi
Staff;Elaine Hsieh;elaine.hsieh@techoregon.org;Technology Association of Oregon;Director of Community Engagement;https://www.linkedin.com/in/hsiehelaine/;Other;;Workforce, Future-Planning, Health;;SE Portland;None;None;
Staff;Topher Burns;topher@bivalve.co;Climate Curious;Cofounder;https://www.linkedin.com/in/topherburns/;Other;Join a community of like-minded people in Oregon, Learn about climate technology advancements being made in Oregon, Connect with other people from other knowledge areas than my own;Behavior & Adoption, Workforce, Future-Planning;;SE Portland;n/a;n/a;
Attendee;Kristin Leiber;kristin@ecolloyd.org;Lloyd EcoDistrict;Executive Director;https://www.linkedin.com/in/kristinleiber/;Impact Partner’s Invite;Join a community of like-minded people in Oregon;Energy & Storage, Buildings, Behavior & Adoption;;Portland - N/NE;None;None;Thrilled to join!
Attendee;Brian Clark;brian.clark@ecobadlandz.com;Ecobadlandz, Inc.;Co-founder & CEO;https://www.linkedin.com/in/brian-clark-ecobadlander-in-chief/;I’m a startup;Learn about climate technology advancements being made in Oregon, Connect with other people from other knowledge areas than my own, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Energy & Storage, Vehicles, Behavior & Adoption;;SE Portland;None.;None.;
Attendee;Brian Ellin;brianellin@gmail.com;Tempo;CPO;https://www.linkedin.com/in/brianellin/;Other;Learn about climate technology advancements being made in Oregon, Join a community of like-minded people in Oregon, Understand how I can help support climate efforts in Oregon;Vehicles, Buildings, Behavior & Adoption;;SE Portland - Mt Tabor Neighborhood;No;No;Heard about the conference through the Climate Curious community newsletter. Looking forward to it!
Attendee;Kristen Aramthanapon;karamtha@hotmail.com;NEEA;Product Manager;https://www.linkedin.com/in/kristen-aramthanapon-0bb41020?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app;Other;Learn about climate technology advancements being made in Oregon, Join a community of like-minded people in Oregon;Energy & Storage, Buildings;;Portland;Vegetarian;NA;
Attendee;Kayla Calkins;kayla@kaycalkins.com;Kay Calkins Consulting;Fractional CMO;https://www.linkedin.com/in/kaycalkins/;I’m an Impact Partner;Learn about climate justice in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Learn about how we building an inclusive economy in climate;Behavior & Adoption, Future-Planning, Health;;Montavilla, Portland;Vegetarian (no meat, dairy and eggs OK);No;
Attendee;Nat West;natjwest@gmail.com;self;self;https://www.linkedin.com/in/reverendnat/;Other;Understand more about climate solutions generally, Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon;Buildings, Behavior & Adoption, Infrastructure;;Northeast PDX;None;None;
Attendee;Jason Trager;jason@plentiful.ai;Plentiful.ai;Founder;https://www.linkedin.com/in/sustainabilist/;Other;Other (I'll add it in the final message area at the end of the form);Buildings, Energy & Storage, Vehicles;I'd like to talk about data infrastructure for utilities, DER implementers, and other providers.;Mt. Scott;Pescatarian;No;I'd be open to speaking about our work in using machine learning to accelerate the adoption of DERS.
Staff;Spenser Meeks;spenser@apexpresentations.com;Apex Presentations;Principal;https://www.linkedin.com/in/spenser-meeks-apex/;Impact Partner’s Invite;Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon, Learn about climate technology advancements being made in Oregon;Energy & Storage, Workforce, Behavior & Adoption;Would be interested to better understand better the current gaps are slowing the energy transition in the PNW and how people can help address those issues. Things like directly addressing that we have a lot of hydro, but what is stopping us from shutting off coal, gas, and oil?;North Portland;No;No;
Attendee;Nick Keenan;nick@gameflowinteractive.com;Climate Curious, Gameflow Interactive;CEO;https://www.linkedin.com/in/nick-keenan-9608548;Impact Partner’s Invite;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Behavior & Adoption, Future-Planning, Buildings;;Hillsboro, OR;None;None;
Impact Partner;Ania Korsunska;ania@zemlia.co;Zemlia;Founder;https://www.linkedin.com/in/akorsunska/;Impact Partner’s Invite;Understand how I can help support climate efforts in Oregon, Learn about climate technology advancements being made in Oregon, Understand more about climate solutions generally;Behavior & Adoption, Future-Planning, Health;;SE Portland;No beef or pork;no;Interested in organizing or participating in a panel related to the power of individual action for sustainability
Attendee;Ben Getson;ben.getson@gmail.com;.;Product Manager;https://www.linkedin.com/in/bengetson/;Impact Partner’s Invite;Learn about climate technology advancements being made in Oregon, Understand how I can help support climate efforts in Oregon;Infrastructure, Energy & Storage;;SE Portland;none;none;
Attendee;Dave Peticolas;dave.peticolas@gmail.com;n/a;n/a;https://www.linkedin.com/in/davepeticolas/;Other;Learn about climate technology advancements being made in Oregon, Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon;Energy & Storage, Infrastructure;;Portland;no;no;
Attendee;Ari Simmons;asimmons.professional@gmail.com;Oregon Clean Power Cooperative;Communications Manager;https://www.linkedin.com/in/arisimmons19/;Impact Partner’s Invite;Connect with other people from other knowledge areas than my own;Behavior & Adoption, Energy & Storage, Future-Planning;;PORTLAND;N/A;N/A;
Attendee;Aaron Arnoldy;aaron.arnoldy@gmail.com;Tideline & BlueMark;COO;https://www.linkedin.com/in/aaronarnoldy/;Other;Join a community of like-minded people in Oregon, Connect with other people from other knowledge areas than my own;Energy & Storage, Buildings, Future-Planning;;Portland, OR (NE Portland);No;No;
Attendee;Brennan Gantner;bgantner@skiptechnology.com;Skip Technology;CEO;https://www.linkedin.com/in/bgantner/;Impact Partner’s Invite;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Understand how I can help support climate efforts in Oregon;Energy & Storage, Workforce, Infrastructure;;Central Eastside Portland;None;None;
Attendee;Tong Tong Zhang;ttz@pdx.edu;Portland State University - MCECS;Assistant Dean;https://www.linkedin.com/in/tongtzhang/;I’m an Impact Partner;Learn about how we building an inclusive economy in climate;Future-Planning;;PSU;no pork;none;
Attendee;Margaret R. Smith;margaret@changemakercoach.co;Changemaker Coaching;Founder;www.linkedin.com/in/margaretrsmith/;Impact Partner’s Invite;Join a community of like-minded people in Oregon, Connect with other people from other knowledge areas than my own, Learn about climate technology advancements being made in Oregon;Future-Planning, Workforce, Behavior & Adoption;;NW Portland;No;No;
Attendee;Jim Huston;jim@portlandseedfund.com;JH Climate Ventures;Partner;https://linkedin.com/in/jimhustonvc;Other;Learn about climate technology advancements being made in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Understand how I can help support climate efforts in Oregon;Energy & Storage, Workforce, Infrastructure;;Sherwood OR;Mussels;No;
Speaker;Marcelino Alvarez;marcelino@photonmarine.com;Photon Marine;CEO;https://www.linkedin.com/in/marcelino;I’m a speaker;Learn about climate technology advancements being made in Oregon;Infrastructure, Vehicles, Future-Planning;;SE Portland;N/A;N/A;
Attendee;Suhasini Gavarshetty;suhasini.cg@gmail.com;Yahoo;Sr. Account Strategist;https://www.linkedin.com/in/suhasini-gavarshetty/;Other;Understand how I can help support climate efforts in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Learn about climate technology advancements being made in Oregon, Join a community of like-minded people in Oregon;Workforce, Behavior & Adoption, Future-Planning;;Northeast Portland, OR;Vegan preferred or else vegetarian;NA;Excited to be attending this!
Speaker;Alicia Chapman;alicia.chapman@wtfllc.com;Willamette Technical Fabricators;Owner & CEO;https://www.linkedin.com/company/willamette-technical-fabricators-llc/;I’m a speaker;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon;Energy & Storage, Workforce, Future-Planning;;Marshall Park, Portland;n/a;n/a;
Attendee;Keith Chapman;keith.chapman@wtfllc.com;Willamette Technical Fabricators;President;https://www.linkedin.com/company/willamette-technical-fabricators-llc/;I’m a startup;Learn about climate technology advancements being made in Oregon;Infrastructure;;Portland;n/a;n/a;
Sponsor;Anne Crispino-Taylor;crispino-taylora@prosperportland.us;Prosper Portland;Program Manager;NONE;I’m a sponsor;Learn about climate technology advancements being made in Oregon;Behavior & Adoption;;Portland;No;NO;
Impact Partner;Andrew Desmond;andrew@orbusinesscouncil.org;Oregon Business Council;Economic Development Policy Director;https://www.linkedin.com/in/andrewldesmond/;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Learn about climate technology advancements being made in Oregon, Join a community of like-minded people in Oregon;Energy & Storage, Vehicles, Workforce;;Portland, Oregon;NA;NA;
Sponsor;Amanda Park;amanda.jean.park@gmail.com;Prosper Portland;Sr. Project Manager;https://www.linkedin.com/in/amandajeanpark/;I’m a sponsor;Learn about climate justice in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Behavior & Adoption, Infrastructure, Future-Planning;;Portland;NONE;NONE;
Sponsor;Pamela Neal;nealp@prosperportland.us;Prosper Portland;Manager, Business Advancement;https://www.linkedin.com/in/pamelaneal/;I’m a sponsor;Learn about climate technology advancements being made in Oregon;Workforce, Infrastructure, Future-Planning;;Vancouver;No;No;
Sponsor;Shea Flaherty Betin;flahertybetins@prosperportland.us;Prosper Portland;Economic Development Director;https://www.linkedin.com/in/shea-flaherty-betin-b5275568/;I’m a sponsor;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Energy & Storage, Infrastructure, Workforce;;SE Portland;None;None;Hi :) Katherine is an amazing member of my team and I'm here to support her work with you all! Thank you for all the partnership and for your work to bring these issues forward in Portland.
Sponsor;Anielis Raas Nebelecky;raasa@prosperportland.us;Prosper Portland;Project Manager-Affordable Commercial Tenanting;https://www.linkedin.com/in/anielis-r-785061a6?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;I’m a sponsor;Learn about climate technology advancements being made in Oregon, Learn about how we building an inclusive economy in climate, Connect with other people from other knowledge areas than my own;Infrastructure, Future-Planning, Workforce;No;Outer SE Portland;No;No;Looking forward to sharing in community, learning where we're at and help create systems that allow us to move forward and being inclusive of everyone, specially disadvantaged communities that don't have deep pockets to make purchases and system change for climate resiliency
Sponsor;Ness Zolan;zolann@prosperportland.us;Prosper Portland;Project Manager;https://www.linkedin.com/in/nesszolan/;I’m a sponsor;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Learn about climate technology advancements being made in Oregon;Behavior & Adoption, Energy & Storage, Future-Planning;;Central City, Portland;Pescatarian (no shellfish) and vegetarian. No meat.;No;
Speaker;Cynthia Carmina Gomez;gomezc@pdx.edu;Portland State University;Director, Community & Civic Impact;https://www.linkedin.com/in/cynthiacarminagomez/;I’m a speaker;Learn about climate justice in Oregon;Future-Planning, Behavior & Adoption, Infrastructure;;NE;NA;NA;
Sponsor;Rachel Benton;bentonr@prosperportland.us;Prosper Portland;Grants Team;www.linkedin.com/in/ rachel-benton-7003;I’m a sponsor;Connect with other people from other knowledge areas than my own, Learn about climate technology advancements being made in Oregon, Learn about how we building an inclusive economy in climate;Infrastructure, Buildings, Future-Planning;;Old Town;Eggs;hard of hearing - subtitles are great;
Attendee;Brian Boshes;boshes@ecobadlandz.com;Ecobadlandz;Cofounder;https://www.linkedin.com/in/brianboshes/;I’m a startup;Join a community of like-minded people in Oregon, Learn about how we building an inclusive economy in climate, Learn about climate technology advancements being made in Oregon, Connect with other people from other knowledge areas than my own, Understand more about climate solutions generally, Understand how I can help support climate efforts in Oregon;Energy & Storage, Infrastructure, Future-Planning, Vehicles;;Hillsdale;None;None;
Attendee;Johan Kers;jkers@birchbiosciences.com;Birch Biosciences Inc.;Co-founder and CEO;https://www.linkedin.com/in/johankers/;Impact Partner’s Invite;Learn about climate technology advancements being made in Oregon, Join a community of like-minded people in Oregon, Understand how I can help support climate efforts in Oregon;Future-Planning, Infrastructure, Workforce;"Opportunities for government programs to help startups get off the ground. For example, why don't we have have government sponsored ""We work"" facilities for climate tech startups in Portland or state of Oregon-owned buildings? My perception is that there is a lot of talk about Oregon wanting to do things about climate, but little real action from government leadership on this. We need programs that will attract companies and talent from other geographies to build a startup ecosystem with critical mass that is working on climate. I find it odd that our company gets recruiting solicitations from other states with generous offers of relocation and subsidy but Oregon doesn't seem to have a robust vision to drive development of this ecosystem. I would love to learn more (and be proven wrong!)";NE Portland;None;None;
Attendee;Debbie Silva;debbie.silva@evrazna.com;Evraz Oregon Steel Mills - Portland;Environmental Manager;www.linkedin.com/in/ debbie-deetz-silva-54994516;Other;Connect with other people from other knowledge areas than my own, Learn about climate technology advancements being made in Oregon;Energy & Storage;;SE PORTLAND;None;none;Hi.
Attendee;Sunanda Chunder;sunanda.chunder@evrazna.com;EVRAZ Inc.;Environmental Engineer;www.linkedin.com/in/sunanda-chunder;Other;Learn about climate technology advancements being made in Oregon;Energy & Storage, Infrastructure, Future-Planning;;Portland;No meat. Fish, eggs and dairy ok.;None;
Staff;Jedd Chang;jedd@smithandjonesinnovation.com;Smith and Jones Innovation;Attendee Concierge;https://www.linkedin.com/in/jeddchang/;Other;Join a community of like-minded people in Oregon;Future-Planning;;Monmouth;No spicy food. In fact, I'll get my own meals.;None. Thanks!;Good to go.
Staff;Jeff Smith;jeffersonsmith@gmail.com;Smith and Jones Innovation;Partnera;egaega;Other;Learn about climate justice in Oregon;Workforce;awgaeg;asaegaea;egaega;gawegae;agaweg
Attendee;Morgan Pitts;morgan.pitts@essinc.com;ESS Inc.;Director, Corporate Communications;https://www.linkedin.com/in/morgan-pitts-7222a07;I’m a sponsor;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Connect with other people from other knowledge areas than my own, Join a community of like-minded people in Oregon;Energy & Storage, Infrastructure, Workforce;;Northeast PDX - Eliot Neighborhood;No;No;
Speaker;Edward Benote Hill;edwardb@foodloopnw.com;FoodLoop Northwest;Co-Founder/Partner/FOTH Director;https://www.linkedin.com/in/eddie-benote-hill;I’m a speaker;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Behavior & Adoption, Infrastructure, Health;Not at this time, I am excited to experience the event.;West Hills, Portland;Vegetarian minimum;None, thank you;Thank you for the invitation
Impact Partner;Nicole Miranda;nicole.miranda@portofportland.com;Swan Island Business Association;Secretary;NONE;Other;Understand how I can help support climate efforts in Oregon;Buildings, Energy & Storage, Infrastructure;;Mill Park;None;N/A;
Attendee;Ethan Knight;ethan@carpediemeducation.org;Carpe Diem Education;Executive Director;https://www.linkedin.com/in/ethan-knight-a0a642b;Impact Partner’s Invite;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Understand more about climate solutions generally, Learn about climate technology advancements being made in Oregon;Future-Planning, Energy & Storage, Behavior & Adoption;;Portland, OR;None;None;
Attendee;Emi Day;emiday@gmail.com;Wind River;Senior User Experience Designer;https://www.linkedin.com/in/emiday/;Impact Partner’s Invite;Learn about climate technology advancements being made in Oregon, Understand more about climate solutions generally, Understand how I can help support climate efforts in Oregon;Behavior & Adoption, Future-Planning, Infrastructure;;NW;none;none;
Attendee;Nate Conroy;nate@raincatalysts.org;RAIN Catalysts;Rural Venture Catalyst;https://www.linkedin.com/in/nathanconroy/;Impact Partner’s Invite;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Behavior & Adoption, Workforce, Infrastructure;How can we ensure rural communities buy-in and benefit from our efforts;Albany, Oregon;None;None;Thank you for holding the event downtown
Impact Partner;Tanya Hartnett;tanya.hartnett@workingwaterfrontportland.org;Working Waterfront Coalition;Executive Director;Tanyahartnett;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Behavior & Adoption, Workforce, Future-Planning;No;Portland;Vegetarian;No;No
Staff;Wes Wages;wes@armosastudios.com;Armosa Studios;Storyteller;https://www.linkedin.com/in/weswages/;Other;Learn about climate technology advancements being made in Oregon;Behavior & Adoption;;Nashville Tn;None;None;None
Speaker;Noel Kinder;noelkinder510@gmail.com;Nike;Former CSO Nike, Inc.;https://www.linkedin.com/in/noel-kinder-148b521b4/;I’m a speaker;Learn about climate technology advancements being made in Oregon;Behavior & Adoption;;Portland;no;no;
Attendee;Ian Greenfield;igreenfield@me.com;YPrime;Chief Strategy Officer;https://www.linkedin.com/in/ianmgreenfield;Other;Learn about how we building an inclusive economy in climate, Connect with other people from other knowledge areas than my own;Future-Planning, Energy & Storage;;Portland, OR;None;None;
Impact Partner;Bill Henry;b.henry@pacificoceanenergy.org;Pacific Ocean Energy Trust;Program Manager;https://www.linkedin.com/in/bill-henry-2b8b3616/;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Energy & Storage, Infrastructure, Workforce;POET is interested in helping to bring an ocean-based climate technology component to Wings.;Northeast Portland;No;No;
Impact Partner;David Kirshbaum;dk@vitalmessage.co;Vital Message;Founder and Principal;https://linkedin.com/in/davidkirshbaum;I’m an Impact Partner;Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon, Join a community of like-minded people in Oregon;Buildings, Health, Behavior & Adoption;I notice agriculture is missing from the list of topics and is an important one both in the climate space and in Oregon that would be good to include.;Portland, OR;I try to minimize gluten, dairy, and sugar.;No;Excited for this!
Attendee;Nicholas Day;daynicho@gmail.com;Arrow Carbon;CTO;https://www.linkedin.com/in/nicholas-upton-day/;I’m a startup;Learn about climate technology advancements being made in Oregon, Understand how I can help support climate efforts in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Future-Planning;;Portland;I am a vegetarian;No;
Attendee;Alex DeNuzzo;adenuzzo@lclark.edu;Lewis & Clark College;Student;https://www.linkedin.com/in/alexdenuzzo/;Student;Join a community of like-minded people in Oregon, Learn about climate technology advancements being made in Oregon;Energy & Storage, Workforce, Vehicles;;NW Portland;Non-dairy milk!;No;Howdy! :)
Impact Partner;Martina Steinkusz;m.steinkusz@renewableh2.org;Renewable Hydrogen Alliance;Director of Market Development;https://www.linkedin.com/in/martina-steinkusz/;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Energy & Storage;"Let's talk about:
 

 - how Oregon is planning to realistically decarbonize hard-to-electrify sectors like rail (diesel), shipping (bunker fuels), aviation (jet fuels), and heavy-duty, long-range trucks (diesel/gasoline). Those sectors are a cause to bad air quality in neighboring communities.
 

 - Energy resiliency? What's our clean, climate-friendly, long-duration (multi-day) backup plan? What solutions are out there, and how is it backed by city or county policy? With the ice storm and multi-day power outages, everyone in the neighborhood turned on their loud and stinky diesel or natural gas backup generators. What can the city do to offer opportunities for community resiliency / clean energy pilot projects apart from solar? 
 

 - how is the clean energy/climate community and local government supporting kids / younger generations in taking responsibility?";SW Portland;No;No;Let's do this, Portland!
Impact Partner;Corky Collier;corky@columbiacorridor.org;Columbia Corridor Association;Executive Director;https://www.linkedin.com/in/corky-collier-49472310/;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Future-Planning;;N Portland;none;none;
Impact Partner;Kristi DeGroat;kristi@oseia.org;Oregon Solar Storage Industry Indust;Development Director;https://www.linkedin.com/in/kristin-degroat-7a00b37/;Impact Partner’s Invite;Join a community of like-minded people in Oregon;Workforce;;Tualatin;none;none;
Speaker;Joseph Bull;bull2@pdx.edu;Portland State College - Maseeh College of Engineering & Computer Science;H. Chik M. Erzurumlu Dean;https://www.linkedin.com/in/josephbullphd;I’m a speaker;Other (I'll add it in the final message area at the end of the form);Infrastructure, Energy & Storage, Future-Planning;;SW Portland, Portland State University Campus;n/a;n/a;
Speaker;Tanya Barham;tanyab@communityenergylabs.com;Community Energy Labs, Inc.;Founder & CEO;https://www.linkedin.com/in/tanyabarham/;Other;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Join a community of like-minded people in Oregon, Understand how I can help support climate efforts in Oregon;Buildings, Behavior & Adoption, Energy & Storage;;401 NE 19th Avenue, Portland, OR 97232;No;No;Thanks for the opportunity!
Attendee;Ozzie Gonzalez;ozzie@p3-associates.com;P3 Consulting;Owner + Founder;www.linkedin.com/in/ozziegonzalez;I’m a startup, Impact Partner’s Invite;Join a community of like-minded people in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Understand how I can help support climate efforts in Oregon;Workforce, Infrastructure, Future-Planning;We don't have the workforce we need in Oregon to build the infrastructure we intend to build in Oregon over the next 10 years. Like by a long shot. I want to get involved in closing that gap.;Portland, SW. Homestead Neighborhood.;no restrictions.;none.;I am glad this is happening.
Impact Partner;Patti Brooke;patti@moonbeam.ai;Moonbeam;Managing Director;https://www.linkedin.com/in/pattibrooke/;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Understand how I can help support climate efforts in Oregon, Learn about how we building an inclusive economy in climate;Energy & Storage, Workforce, Future-Planning;No;SEATTLE;No;No;Hi!
Attendee;Aaron Weast;aaron@cruciblepd.com;Crucible Product Development;Principal;www.linkedin.com/in/aaron-weast;I’m a startup;Learn about climate technology advancements being made in Oregon, Understand how I can help support climate efforts in Oregon, Join a community of like-minded people in Oregon;Energy & Storage;Just excited to know what's happening around Portland/PNW in the realm of climate;Battle Ground, WA;Nope - just healthy food please :);No;Stoked!
Impact Partner;Troy DeFrank;troy@moonbeam.ai;Moonbeam;VP, International Programs;https://www.linkedin.com/in/troydefrank/;Impact Partner’s Invite;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Connect with other people from other knowledge areas than my own;Energy & Storage, Infrastructure, Agriculture;;Seattle, WA;None;None;
Staff;Patrick Prothe;patrickprothe@gmail.com;Design Buddha;Founder;https://www.linkedin.com/in/pprothe/;Other;Join a community of like-minded people in Oregon;Future-Planning, Health, Buildings;;SE Portland;Mostly Vegetarian but flexible.;None;
Attendee;Leah Plack;leah.plack@pdxstem.org;Portland Metro STEM Partnership;Project Coordinator;https://www.linkedin.com/in/leah-plack-aa568b14a/;Impact Partner’s Invite;Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon, Join a community of like-minded people in Oregon;Infrastructure, Energy & Storage, Future-Planning;;North Tabor neighborhood;None, although I prefer vegetarian;None;
Impact Partner;Jessica Carmona;jcarmona@b-e-f.org;Bonneville Environmental Foundation;Sr Program Manager;https://www.linkedin.com/in/jessica-carmona/;I’m an Impact Partner;Understand how I can help support climate efforts in Oregon;Energy & Storage, Future-Planning, Workforce;;Portland;No;No;
Attendee;Erin Fish;erin@gowanderwell.com;Wanderwell;CEO;https://www.linkedin.com/in/fisherin/;Impact Partner’s Invite;Learn about climate technology advancements being made in Oregon;Behavior & Adoption, Future-Planning;;Inner NE Portland;Veggie;No;
Impact Partner;Angela Borden Jackson;angela.jackson@pdx.edu;Portland State University / Powerize Northwest;Powerize NW CEO;https://www.linkedin.com/in/angelajackson/;;;;;;;;
Impact Partner;Gigi Harker-Olguin;gigi.olguin@greaterportlandinc.com;Greater Portland Inc;Business Development Manager;https://www.linkedin.com/in/gimena-gigi/;;;;;;;;
Attendee;Merry Ann Moore;merryannmoore@gmail.com;Moore Creative Strategies;Marketing consultant;https://www.linkedin.com/in/merryannmoore/;;;;;;;;
Attendee;Maggie Flanagan;maggief@lemelson.org;The Lemelson Foundation;Program Officer;https://www.linkedin.com/in/maggie-flanagan-6b5a2b25/;;;;;;;;
Staff;Walter James;wmjames07@gmail.com;Power Japan Consulting;Principal Analyst;https://www.linkedin.com/in/wjames2/;;;;;;;;
Staff;Melanie Adamson;melanie@alderagency.com;Alder & Co.;Partner & CEO;https://www.linkedin.com/in/melanieadamson/;;;;;;;;
Attendee;Justin Carven;juc421@g.harvard.edu;BEYOND Circular Solutions;Founder;https://www.linkedin.com/in/justin-carven-5b13983a/;;;;;;;;
Staff;Michelle Chang;mcmeeshi@gmail.com;Intentional Travelers;Owner;https://www.linkedin.com/in/michelle-chang-411b2b16/;;;;;;;;
Staff;Abby Schwalb;abby.schwalb@gmail.com;N/A;N/A;https://www.linkedin.com/in/abbyschwalb/;;;;;;;;Looking forward to supporting!
Attendee;David Worth;dave.worth@zakti.biz;Zakti;Principal Avisor, Founder;https://www.linkedin.com/in/daveworth/;;;;;;;;Thank you for approving my discount. Looking forward to the conference. If there is any opportunity for me to support the event through a small presentation or by facilitating a special topic session please let me know.
Impact Partner;Abigail Van Gelder;a.vangelder@pdx.edu;PSU Center for Entrepreneurship;Director;https://www.linkedin.com/in/akrsouth/;;;;;;;;
Attendee;Kirk Ellis;iamkirkellis@gmail.com;St. Marys Academy;Faculty;NONE;;;;;;;;I am attending as Cynthia Carmina's guest.
Attendee;Tom Yeager;tom.yeager.tdy@gmail.com;Looking for Work;Software Engineer;https://www.linkedin.com/in/yeagertom/;;;;;;;;Thanks for getting back so quickly! Looking forward to learning more through the conference.
Staff;Linda Robertson;lr@lindarobertsonarts.com;Linda Robertson Arts;Owner;https://www.linkedin.com/in/1lindarobertson/;;;;;;;;
Staff;Steve Harper;steve@indigodesignllc.com;Indigo Design LLC;Owner;NONE;;;;;;;;Registered by Jedd for Steve.
Staff;Hunter Loveridge;hunter@pixthis.com;Pix This;Ownder;NONE;;;;;;;;Registered by Jedd for Hunter.
Staff;Sigfried Seeliger;seesigi@me.com;NONE;NONE;NONE;;;;;;;;Registered by Jedd for Sigi
Staff;Sara Beukers;sarabeukers@gmail.com;NONE;NONE;NONE;;;;;;;;Registered by Jedd (Smith and Jones Innovation) for Sara. Requested by Michelle Jones.
Staff;Denise Ransome;denise@deniseransome.com;NONE;NONE;NONE;;;;;;;;Registered by Jedd on behalf of Denise.
Attendee;Colleen Murray;colleen1murray2@gmail.com;Perkins & Co;Consultant;https://www.linkedin.com/in/colleenlmurray/;;;;;;;;
Impact Partner;Kayla Anderson;kayla@riparianmedia.com;Riparian Media;Founder, Creative Director;https://www.linkedin.com/in/kaylanderson/;;;;;;;;
Attendee;Ty Adams;tyadams@gmail.com;Leaven Community Center;Climate Team Member;https://www.linkedin.com/in/tykadams/;;;;;;;;
Attendee;Krista Reynolds;krista@engagingeverystudent.com;Engaging Every Student;Director of Educational Support and Research;https://www.linkedin.com/krista-reynolds-pdx;;;;;;;;
Impact Partner;Bianca Gonzalez;bianca@theblueprintfoundation.org;The Blueprint Foundation;Development and Communications Manager;https://www.linkedin.com/in/bianca-gonzalez-90a7b5196/;;;;;;;;
Attendee;Evan Ramsey;eramsey@b-e-f.org;Bonneville Environmental Foundation;Senior Director;https://www.linkedin.com/in/evan-ramsey-b01b1213/;;;;;;;;
Attendee;Javier Cobian;javier.cobian11@gmail.com;HDR Inc.;Electrical EIT;www.linkedin.com/in/javier-cobian;;;;;;;;
Attendee;Olivia Vulpin;opt@uoregon.edu;University of Oregon;PhD Candidate;https://www.linkedin.com/in/olivia-vulpin/;;;;;;;;
Speaker;Aina Abiodun;aina.abiodun@vertuelab.org;VertueLab;President & Executive Director;https://www.linkedin.com/in/ainaabiodun/;;;;;;;;
Staff;Jane Comeault;janevthomson@hotmail.com;None;None;www.linkedin.com/in/jane-comeault-0373073;;;;;;;;
Attendee;Kristin Wolff;kristin_wolff@spra.com;Social Policy Research;Senior Associate;https://www.linkedin.com/in/kristinwolff?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;;;;;;;;Looking forward to it! Appreciate the code (I’m PTOing and self-paying.)
Impact Partner;Rick Reynolds;rick@engagingeverystudent.com;Engaging Every Student / Engaging Press;Founder;https://www.linkedin.com/in/rick-reynolds-04b4668;;;;;;;;Krista and I are looking forward to it, Michelle and team--thanks for organizing it!
Impact Partner;Anna Almonte;anna.almonte@energyally.com;Intact Energy Consulting;Founder & Managing Director;https://www.linkedin.com/in/annaalmonte/;;;;;;;;
Impact Partner;Lance Randall;lance@bbaoregon.org;Black Business Association of Oregon;Executive Director;https://www.linkedin.com/in/lance-j-randall-a741b88/;;;;;;;;
Impact Partner;Marquita Jaramillo;marquita@bbaoregon.org;Black Business Association of Oregon;Business Retention & Expansion Director;https://www.linkedin.com/in/marquita-jaramillo/;;;;;;;;
Impact Partner;Nick Triska;nick.triska@greaterportlandinc.com;Greater Portland Inc;Senior Manager, Business Development;https://www.linkedin.com/in/nick-triska-6761241a/;;;;;;;;
Impact Partner;Mary Peveto;mary@neighborsforcleanair.org;Neighbors for Clean Air;Co-Director;None;;;;;;;;
Attendee;Christopher Butler;chris@evolvecollab.com;Evolve Collaborative;Co-Founder;https://www.linkedin.com/in/chrisbutlerlondon/;;;;;;;;
Attendee;Kellen Moody;kel@alluviumgatherings.com;Alluvium Gatherings;Founder and Director;https://www.linkedin.com/in/kellen-moody-aa068239/;;;;;;;;
Staff;Gillian Wildfire;gillianwildfire@gmail.com;Volunteering;Na;https://www.linkedin.com/in/gillianwildfire?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;;;;;;;;
Attendee;Kaya Kachigian;kayakachigian@gmail.com;N/A;Climate Tech;https://www.linkedin.com/in/kaya-kachigian;;;;;;;;
Attendee;Itanna Murphy;itanna.murphy@gmail.com;SHEBA;Founder;https://www.linkedin.com/in/itanna-murphy-pa-c-24086b142?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;;;;;;;;Just attended VertueLab / Tabor 100 workshops in PDX and SEA. So excited to be networking with like-minded folks.
Attendee;Yosafe Murphy;yosafemurphyrt@gmail.com;SHEBA;Founder;https://www.linkedin.com/in/yosafe-murphy-918bb9183?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;;;;;;;;Working with NREL to create a 1-acre agrivoltaic farm in rural Junction City.
Attendee;Rachel Maas;rachel.maas@ccconcern.org;Central City Concern;Director of Climate Action;https://www.linkedin.com/in/rachel-maas-a7738616/;;;;;;;;
Attendee;Annie Murai;annie@measurepnw.com;United States;Partner;https://www.linkedin.com/in/annie-murai-sustainability/;;;;;;;;I am excited to join! Let me know if there are ways that I can help out in a volunteering capacity to help run the event.
Attendee;Colin Tomkins-Bergh;colintomkinsbergh@gmail.com;South Pole;Senior Climate Solutions Manager;https://www.linkedin.com/in/colin-tomkins-bergh/;;;;;;;;Can't wait!
Staff;Laurie Ann (L.A.) Silberman;lasilberman@duck.com;N/A;Director of Unique Choices (LoL);https://www.linkedin.com/in/lasilberman;;;;;;;;
Attendee;Richard Tankersley;rtankers@pdx.edu;Portland State University - RGS;Vice President for Research & Graduate Studies;https://www.linkedin.com/in/richard-tankersley-2401a635?trk=people-guest_people_search-card;;;;;;;;
Attendee;Annie Lindgren;annie.lindgren@pdx.edu;Portland State University - RGS;Int. Associate VP for Research;https://www.linkedin.com/in/annie-lindgren-30656b15?trk=people-guest_people_search-card&original_referer=https%3A%2F%2Fwww.linkedin.com%2Fpub%2Fdir%3FfirstName%3DAnnie%26lastName%3DLindgren%26trk%3Dpeople-guest_people-search-bar_search-submit;;;;;;;;
Attendee;Erik M Gordon;egordon@percipiogroup.com;Percipio Consulting;Director;https://www.linkedin.com/in/erik-maximilian-gordon;;;;;;;;
Attendee;Mark Brady;mark.brady@biz.oregon.gov;Business Oregon;Innovation and Entrepreneurship Manager;https://www.linkedin.com/in/mark-brady-oregon;;;;;;;;
Attendee;Kelly Lyons;kelly@climbsmartstrategies.com;Climb Smart Strategies;Principal Consultant;https://www.linkedin.com/in/kelly-lyons-2713725a/;VertueLab Board Member;;;;;;;
Attendee;Carmella West;carmella.m.west@gmail.com;Carmella West Solutions, LLC;Marketing Consultant;https://www.linkedin.com/in/carmellawest/;;;;;;;;
Attendee;Derron Coles;derron@drclearningsolutions.com;DRC Learning Solutions;Principal Consultant;NONE;;;;;;;;
Attendee;Dimitry Gershenson;dimitry@enduringplanet.com;Enduring Planet;CEO;https://linkedin.com/in/dgershenson;;;;;;;;
Attendee;Jess Kincaid;labonn@bpa.gov;Bonneville Power Administration;Director of Technology Innovation;NONE;;;;;;;;
Attendee;Liam Twight;liamt@uoregon.edu;University of Oregon;PhD Student;www.linkedin.com/in/liam-t-b178a0a3;;;;;;;;
Impact Partner;Dwindell Feeley;dwindell.feeley@freegeek.org;Free Geek;Manager of Business Development;https://www.linkedin.com/in/dwindell-feeley/;;;;;;;;
Impact Partner;Juan Muro, Jr.;j.muro@freegeek.org;Free Geek;Executive Director;https://www.linkedin.com/in/jmmurojr;;;;;;;;
Impact Partner;Amber Brink;amber.brink@freegeek.org;Free Geek;Director of Technology;https://www.linkedin.com/in/amber-brink-81b80557;;;;;;;;
Attendee;Ben Peterson;ben@think3thirds.com;United States;Head of Writing;https://www.linkedin.com/in/benpetersonpdx/;;;;;;;;
Attendee;David Tetrick;tanja.olson@oregonmetro.gov;Oregon Metro;Economic Development Planner;https://www.linkedin.com/in/david-t-125777121/;David's email is david.tetrick@oregonmetro.gov;;;;;;;
Attendee;Cassidy Moyer;casmoyer@pdx.edu;Portland State University;Student;linkedin.com/in/cassidy-moyer-210980225;;;;;;;;
Attendee;Kelson Redding;kredding@energy350.com;Energy Trust of Oregon;Industrial Outreach Manager;https://www.linkedin.com/in/kelson-redding-p-e-88120b48/;;;;;;;;I work with manufacturers to help them find and implement energy efficiency improvement projects at their facilities. We also work to connect these projects to incentive funding from Energy Trust of Oregon and other sources.
Attendee;Leon O. Wolf;leon.o.wolf@gmail.com;LEONWOLFCONSULTING;Principal;https://www.linkedin.com/in/leonwolf23?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app;;;;;;;;
Attendee;Gunnar Vulpin;gunnar.knost@gmail.com;University of Oregon;Law Student;https://www.linkedin.com/in/gunnar-vulpin;;;;;;;;
Staff;Julia Babcock;jjb@pdx.edu;PSU;Senior Project Manager;https://www.linkedin.com/in/juliajoanb?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app;;;;;;;;I am so excited about the content of this conference and supporting the good work and partnerships!
Speaker;Jocelyn Quarrell;jocelyn@boldreuse.com;Bold Reuse;CEO;https://www.linkedin.com/in/jocelyngaudiquarrell/;;;;;;;;Registration by Jedd of Smith & Jones Innovation on behalf of speaker, Jocelyn.
Speaker;Dexter Turner;dturner@opconnect.com;OpConnect;CEO;https://www.linkedin.com/in/dexterturner/;;;;;;;;Wings registration by Jedd of Smith & Jones Innovation on behalf of speaker, Dexter.
Speaker;Pat Crowley;pat@chapulfarms.com;Chapul Farms;CEO;https://www.linkedin.com/in/patrick-crowley-b43b131a/;;;;;;;;Wings registration by Jedd of Smith & Jones Innovation on behalf of speaker, Pat.
Attendee;Sarah Strobl;sstrobl@pdx.edu;Portland State University;MBA Candidate;https://www.linkedin.com/in/sefstrobl/;;;;;;;;
Attendee;Sarah Brennan;sbren2@pdx.edu;Portland State University;Net Impact Chapter Co-President;https://www.linkedin.com/in/sarah-brennan-59211a133/;;;;;;;;Thank you for making this accessible for students!
Attendee;Clark Brockman;clark@brockmanclimatestrategies.com;Brockman Climate Strategies LLC;Founder-Principal;https://www.linkedin.com/in/clark-brockman-83911b8/;;;;;;;;Looking forward to the conference - thank you for the Start-up discount!
Attendee;Daryl Lambert;dlambert@worksystems.org;WORKSYSTEMS,INC;Senior Project Manager - Clean Energy Sector Lead;www.linkedin.com/in/daryl-lambert-62395811;;;;;;;;
Attendee;Joseph Janda;janda@pdx.edu;Portland State University;Assistant Vice President for Innovation—Propel PSU;https://www.linkedin.com/in/joseph-janda-752a266/;;;;;;;;
Speaker;Keith Crossland;carbonegativesolutions@gmail.com;Carbon Negative Solutions;CEO/Co-Founder;https://www.linkedin.com/in/keith-crossland-022a0a26;;;;;;;;
Attendee;Ramsey McPhillips;ramseymcphillips@tainablelabs.com;Tainable Regenerative Agricultural Laboratory;Executive Director;tainablelabs@linkedin.com;;;;;;;;
Attendee;Eric King;eric.king@nike.com;Nike;Director, Sustainable Innovation;https://www.linkedin.com/in/eric-m-king/;;;;;;;;
Attendee;Daniel Ricardo Saa Zaniefski;dsaa@centrocultural.org;Centro Cultural;Grants Manager;https://www.linkedin.com/in/danielsaazaniefski-ri/;;;;;;;;
Attendee;Charles Letherwood;charles@tomdwyer.com;Tom Dwyer Automotive Services;Outreach Advisor;NONE;;;;;;;;Looking forward to reporting back to our clients with the results of the conference!
Attendee;Len Harris;lenwealth@icloud.com;Radical Ventures Group;Project Supervisor;None;;;;;;;;
Attendee;Amber Peoples;amber@earthrelationship.com;Earth Archetypes;Chief Relationship Officer;https://www.linkedin.com/in/ambermpeoples/;;;;;;;;
Staff;Ashley Kmiecik;ashley.kmiecik@techoregon.org;Technology Association of Oregon;Director of Sponsorship & Events;https://www.linkedin.com/in/ashley-kmiecik/;;;;;;;;This conference (volunteer) registration is for Ashley Kmiecik who was registered by Jedd Chang of Smith & Jones Innovation with information they provided and also information found on Linkedin.
Staff;Becca Baugh;becca.baugh@techoregon.org;Technology Association of Oregon;Finance and Operations Manager;https://www.linkedin.com/in/rebecca-baugh-88a0a121a/;;;;;;;;This conference (volunteer) registration is for Becca Baugh who was registered by Jedd Chang of Smith & Jones Innovation with information they provided and also information found on Linkedin.
Attendee;Robert Bass;robert.bass@pdx.edu;Portland State Univesity;Professor;https://www.linkedin.com/in/robert-bass-993b0514/;;;;;;;;
Attendee;Abby Chroman;achroman@pdx.edu;Portland State University;Student;None;;;;;;;;
Attendee;Chelsea L. Nikirk;nikirk@pdx.edu;Portland State University;Employed - Graduate Student;https://www.linkedin.com/in/chelsea-l-nikirk/;;;;;;;;
Staff;Geff Zamor;zamor@gmsmediaco.com;GMS Media and Advertising;;NONE;;;;;;;;Registered by Jedd Chang of Smith & Jones innovation on behalf of crew member, Geff.
Staff;Jonathan Gibson;jonathan.s.gibson@gmail.com;CREW;CREW;NONE;;;;;;;;Registered by Jedd on behalf of crew member Jonathan.
Staff;Gabriel Lawler;lawler@goodmorningsoldier.com;GMS Media and Advertising;;None;;;;;;;;Registered by Jedd of Smith & Jones Innovation on behalf of crew member, Gabriel.
Attendee;Penelope Harwood;pharwood@londonandpartners.com;London & Partners;SVP Business Development;https://www.linkedin.com/in/peharwood/;;;;;;;;
Staff;Kaitlin Leonard;kaitlin.beauregard@techoregon.org;Technology Association of Oregon;Communications & PR Coordinator;https://www.linkedin.com/in/kaitlin-beauregard-leonard-a2b380130/;;;;;;;;Kaitlin has been officially registered as a volunteer for Wings by Jedd Chang of Smith & Jones Innovation using information they have provided and found on Linkedin.
Attendee;Billy Afghan;billyafghan@geniiearth.com;Genii Earth;CEO;https://www.linkedin.com/in/billy-afghan-72831419/;;;;;;;;
Attendee;Michael Tank;1dream2create@gmail.com;FFA;Western Regional Design | Install Manager;https://www.linkedin.com/in/mftank;;;;;;;;
Sponsor;Sean Gestson;gesetson@up.edu;University of Portland;Assistant Professor in Civil and Environmental Engineering;https://www.linkedin.com/in/seangestson/;;;;;;;;
Attendee;Paul Kempler;pkempler@uoregon.edu;University of Oregon;Research Assistant Professor;https://www.linkedin.com/in/paulkempler/;;;;;;;;
Attendee;Christian Emeodi;eemeodi@uoregon.edu;University of Oregon;Grad Student;linkedin.com/in/christian-emeodi;;;;;;;;
Attendee;Nicole Sagui;nsagui@uoregon.edu;University of Oregon;PhD student;https://www.linkedin.com/in/nicoleasagui;;;;;;;;
Attendee;Elizabeth Asha Mackay;elizashamack@gmail.com;Volunteer;Volunteer;LinkedIn.com/in/elizabethashamackay;;;;;;;;
Attendee;Jonathan Fink;jon.fink@pdx.edu;Portland State University;Professor of Geology;https://www.linkedin.com/in/jonathanfink/;;;;;;;;
Attendee;Michael Jung;michael.jung@icf.com;ICF Climate Center;Executive Director;http://linkedin.com/in/mikejung;;;;;;;;
Attendee;Andrew Goldman;agol@uoregon.edu;University of Oregon;Graduate Researcher;https://www.linkedin.com/in/andrew-carl-goldman/;;;;;;;;
Sponsor;Dave Vernier;dvernier@vernier.com;Vernier Science Education;President;NONE;;;;;;;;
Attendee;Christy Chen;yingchieh05@gmail.com;N/A;N/A;https://www.linkedin.com/in/christy-ying-chieh-chen/;;;;;;;;
Speaker;James Metoyer;james@advancedenergyinspections.com;Executive Director;EnerCity Collaborative;https://www.linkedin.com/in/james-metoyer-iii-6452bb35/;;;;;;;;James has been officially registered as a speaker for Wings by Jedd Chang of Smith & Jones Innovation.
Attendee;Thien-Kim Bui;thienkim.bui@gmail.com;Portland State University;PhD student;https://www.linkedin.com/in/thien-kim-bui-81957555;;;;;;;;
Attendee;Rita Haberman;rita.haberman@deq.oregon.gov;Oregon Department of Environmental Quality;Natural Resource Specialist 4;https://www.linkedin.com/in/rita-haberman-05a33721/;;;;;;;;
Attendee;Kim Allchurch Flick;mightyepiphyte@duck.com;Mighty Epiphyte Consulting;Founder - Impacts Coach;https://linkedin.com/company/mightyepiphyte;;;;;;;;
Attendee;Louisa Mariki;louisam@traveloregon.com;Travel Oregon;Stewardship Investments Manager;https://www.linkedin.com/in/louisa-mariki;;;;;;;;
Attendee;Marianna Grossman;mgrossman@minervaventures.com;Minerva Ventures;Founder and Managing Partner;mariannagrossman;;;;;;;;
Attendee;Martin Lemke;mlemke@pdx.edu;Portland State University;Assistant Trip Leader;www.linkedin.com/in/martin-lemke-63a323276;;;;;;;;
Staff;Megan Murphy;megan@invest.green;Invest.Green;SVP, Investor Engagement & Business Development;www.linkedin.com/in/megankatemurphy;;;;;;;;
Attendee;Edith Qurioz;equiroz@elprograma.org;El Programa Hispano Catolico;Executive Director;NONE;;;;;;;;
Attendee;Morgan Garritson;garritsonm@gmail.com;ImpactPDX;Director, ImpactPDX;https://www.linkedin.com/in/garritsonm/;;;;;;;;
Attendee;Misha Franklin;misha.franklin.2023@gmail.com;;Aspiring Sustainability Professional;https://www.linkedin.com/in/mishajfranklin/;;;;;;;;
Attendee;Estefani Reyes Moreno;estef3@pdx.edu;Portland State University;Undergraduate Student (EE);https://www.linkedin.com/in/estefani-reyes-m/;;;;;;;;
Attendee;Kirsten Midura;kirsten.midura@gmail.com;GlobalPDX & Twende Solar;Board Director;https://www.linkedin.com/in/kirstenmidura/;;;;;;;;
Attendee;Cyrus Wadia;cyrus.wadia@activate.org;Activate Global;CEO;https://www.linkedin.com/in/cyruswadia/;;;;;;;;
Attendee;Katherine Gamblin;gamblin24@up.edu;University of Portland;Undergraduate Student;https://www.linkedin.com/in/katherinegamblin/;;;;;;;;
Sponsor;Jude Gabriel;gabriel23@up.edu;University of Portland;Firmware Engineer;https://www.linkedin.com/in/jude-gabriel-/;;;;;;;;
Sponsor;Susana Rivera;rivera23@up.edu;University of Portland Shiley School of Engineering;Student;linkedin.com/in/susana-g-rivera;;;;;;;;
Sponsor;Maya Struzak;struzak24@up.edu;University of Portland;Student;www.linkedin.com/in/mayastruzak;;;;;;;;
Attendee;Jennifer Miller;jennifertonimiller@gmail.com;GlobalPDX;Private Contractor;https://www.linkedin.com/in/jennifertonimiller/;;;;;;;;
Staff;Alex Wick;alex@cascadiacarbon.com;Cascadia Carbon Inc.;Master Forester;/in/alexwick;Https://linktr.ee/codexcarbon;;;;;;;
Attendee;Andrew Fitzpatrick;jennifer.villarreal@portlandoregon.gov;City of Portland Oregon;Director of Economic Development;none;;;;;;;;
Attendee;Kat Hunt;kat@earthfinance.com;Earth Finance;Sr Director, ClimateTech;https://www.linkedin.com/in/kat~hunt;;;;;;;;
Staff;George Mihaly;george@storyfirm.com;CREW;;;;;;;;;;
Speaker;Dwayne Johnson;dwayne@oregonif.org;Oregon Innovation Fund;N/A;N/A;;;;;;;;Dwayne is being registered by Jedd Chang of Smith & Jones Innovation as a main stage participant helping at the Wings Conference. Thanks - Jedd
Speaker;Ann Cudd;meeseon@pdx.edu;Portland State University;President;N/A;;;;;;;;Ann is being registered by Jedd Chang of Smith & Jones Innovation as a main stage participant helping at the Wings Conference. Thanks - Jedd
Speaker;Steve Eichenlaub;steve@portlandseedfund.com;Portland Seed Fund;N/A;N/A;;;;;;;;Steve is being registered by Jedd Chang of Smith & Jones Innovation as a main stage participant helping at the Wings Conference. Thanks - Jedd
Speaker;Katie Meeker;katie.meeker@portofportland.com;Port of Portland;N/A;N/A;;;;;;;;Katie is being registered by Jedd Chang of Smith & Jones Innovation as a main stage participant helping at the Wings Conference. Thanks - Jedd
Speaker;Alando Simpson;alando@cordr.com;COR Disposal & Recyling;CEO;https://www.linkedin.com/in/alando-simpson-29570b16/;;;;;;;;Alando is being registered by Jedd Chang of Smith & Jones Innovation as a main stage speaker at the Wings Conference. Thanks - Jedd
Speaker;Jacob Dunn;jacob.dunn@zgf.com;ZGF Architects;Principal;https://www.linkedin.com/in/jacob-dunn-1347b925/;;;;;;;;Jacob is being registered by Jedd Chang of Smith & Jones Innovation as a main stage speaker at the Wings Conference. Thanks - Jedd
`
