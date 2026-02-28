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
    return `https://www.linkedin.com/${clean}`
  }
  line.company = replaceBlanks(line.company)
  line.title = replaceBlanks(line.title)
  line.linkedin_url = getLIUrl(line.linkedin_url)
  const { type, name, email } = line
  let user = await db.query.userTable.findFirst({
    where: eq(userTable.email, email),
  })
  if (user?.id) return
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
    firstName: '238f370d-8345-48f0-aa98-a333270e9859',
    lastName: 'f8c62cdd-14c7-4b1c-ac1c-7aceb4c2fe81',
  }
  const infoMap = {
    company: 'company',
    title: 'title',
    linkedin_url: 'linkedin_url',
    why: 'why-attending',
    topics: 'interests',
    traveling: 'traveling-from',
    bio: 'bio',
    proBio: 'proBio',
    firstName: 'firstName',
    lastName: 'lastName',
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
      .update(eventUserTable)
      .set({
        onboardStatus: 'not-sent',
        onboardFormId: '206c5453-6369-46c6-bf59-6504b9eb44cc',
      })
      .where(eq(eventUserTable.id, eventUser.id))
    line.firstName = user.firstName
    line.lastName = user.lastName
    line.bio = eventUser.bio
    line.proBio = eventUser.proBio

    // Clear user info, form sessions and responses
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

const csv = `attendee BADGE type;name;email;phone_number;created_at;coupon_code;Company or Organization you are representing;Position Title;Your Linkedin Profile URL (If you do not have one, please write NONE);How did you hear about the WINGS conference?;Why are you attending the Wings conference? What do you hope to get out of it? (Please choose your top 1-3 statements that best match you);Which of the following topics interest you the most that we’ll be addressing at the Wings conference? (Please choose your top 3 preferences);Do you have any initial feedback or recommendations about the topics we will be discussing at Wings?;Where are you traveling from to attend the Wings conference? (City and State). If you are coming from Portland, please indicate the specific part of the city.;Do you have any dietary restrictions we should be aware of? (Please be as specific as possible);Do you have any accessibility needs we should be aware of? (We are committed to providing equal access and attendee experience for all);Anything else you’d like to share with us? Did we miss anything? Just wanted to say hi? Let us know here.;JEDD NOTES
Staff;Michelle Jones;michelle@smithandjonesinnovation.com;14016921578;2023-12-29T10:39:02.041Z;STEERING24;Smith and Jones Innovation;Partner;https://www.linkedin.com/in/michelledjones1/;Other;;Behavior & Adoption, Future-Planning & Health;The drop down menu above needs some work so it is more clear. At minimum let's split the duos and have each thing listed individually (i.e., list Future Planning as one and Health as another). We might also need teeny phrases to clarify what each one means. I think people will automatically choose just one because even though the drop down DOES let you choose three it does not look like it does and folks are used to having check boxes if they are supposed to choose more than one thing.;Portland (should we prompt for city and state or let people write something like SE Portland if they want?;None;None;"For the thumbnail / image for this I would suggest using a version of the logo without the trees behind it and just the logo lockup without the date included since the page already has the date in several places. 
 

 Thanks, Jedd, for building this registration page for us!";
Staff;Heejae Jeong;heejae@smithandjonesinnovation.com;821035810516;2024-01-17T11:56:41.166Z;STEERING24;Smith and Jones Innovation;Business Developer;https://www.linkedin.com/in/heejae-jeong/;Other;;Future-Planning, Health, Behavior & Adoption;;Seoul, South Korea;No;No;;
Staff;Katherine Krajnak;krajnakk@prosperportland.us;15038230013;2024-01-17T13:39:06.719Z;STEERING24;Prosper Portland;Green Cities Industry Liaison;https://www.linkedin.com/in/katherinekrajnak/;I’m a sponsor;;Energy & Storage, Behavior & Adoption, Infrastructure;;Portland;Lactose intolerant;No;;
Staff;Juan Barraza;juan.barraza@vertuelab.org;15034773706;2024-01-17T14:56:02.719Z;STEERING24;VertueLab;Director of Innvoation and Entrepreneurship;https://www.linkedin.com/in/barrazajuan/;I’m an Impact Partner;;Behavior & Adoption;NA;Portland;None;None;Hi;
Staff;Elaine Hsieh;elaine.hsieh@techoregon.org;;2024-01-17T18:32:32.548Z;STEERING24;Technology Association of Oregon;Director of Community Engagement;https://www.linkedin.com/in/hsiehelaine/;Other;;Workforce, Future-Planning, Health;;SE Portland;None;None;;
Staff;Topher Burns;topher@bivalve.co;12028218691;2024-01-22T15:23:59.189Z;STEERING24;Climate Curious;Cofounder;https://www.linkedin.com/in/topherburns/;Other;Join a community of like-minded people in Oregon, Learn about climate technology advancements being made in Oregon, Connect with other people from other knowledge areas than my own;Behavior & Adoption, Workforce, Future-Planning;;SE Portland;n/a;n/a;;
Attendee;Kristin Leiber;kristin@ecolloyd.org;12149065735;2024-01-23T22:57:40.032Z;CC85;Lloyd EcoDistrict;Executive Director;https://www.linkedin.com/in/kristinleiber/;Impact Partner’s Invite;Join a community of like-minded people in Oregon;Energy & Storage, Buildings, Behavior & Adoption;;Portland - N/NE;None;None;Thrilled to join!;
Attendee;Brian Clark;brian.clark@ecobadlandz.com;;2024-01-23T23:00:49.876Z;CC85;Ecobadlandz, Inc.;Co-founder & CEO;https://www.linkedin.com/in/brian-clark-ecobadlander-in-chief/;I’m a startup;Learn about climate technology advancements being made in Oregon, Connect with other people from other knowledge areas than my own, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Energy & Storage, Vehicles, Behavior & Adoption;;SE Portland;None.;None.;;
Attendee;Brian Ellin;brianellin@gmail.com;15034848287;2024-01-24T00:13:17.012Z;CC85;Tempo;CPO;https://www.linkedin.com/in/brianellin/;Other;Learn about climate technology advancements being made in Oregon, Join a community of like-minded people in Oregon, Understand how I can help support climate efforts in Oregon;Vehicles, Buildings, Behavior & Adoption;;SE Portland - Mt Tabor Neighborhood;No;No;Heard about the conference through the Climate Curious community newsletter. Looking forward to it!;
Attendee;Kristen Aramthanapon;karamtha@hotmail.com;12177217309;2024-01-24T01:07:16.979Z;CC85;NEEA;Product Manager;https://www.linkedin.com/in/kristen-aramthanapon-0bb41020?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app;Other;Learn about climate technology advancements being made in Oregon, Join a community of like-minded people in Oregon;Energy & Storage, Buildings;;Portland;Vegetarian;NA;;
Attendee;Kayla Calkins;kayla@kaycalkins.com;15033336552;2024-01-24T02:13:07.546Z;CC85;Kay Calkins Consulting;Fractional CMO;https://www.linkedin.com/in/kaycalkins/;I’m an Impact Partner;Learn about climate justice in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Learn about how we building an inclusive economy in climate;Behavior & Adoption, Future-Planning, Health;;Montavilla, Portland;Vegetarian (no meat, dairy and eggs OK);No;;
Attendee;Nat West;natjwest@gmail.com;19712550617;2024-01-24T21:31:17.938Z;CC85;self;self;https://www.linkedin.com/in/reverendnat/;Other;Understand more about climate solutions generally, Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon;Buildings, Behavior & Adoption, Infrastructure;;Northeast PDX;None;None;;
Attendee;Jason Trager;jason@plentiful.ai;15102146739;2024-01-24T22:06:31.172Z;CC85;Plentiful.ai;Founder;https://www.linkedin.com/in/sustainabilist/;Other;Other (I'll add it in the final message area at the end of the form);Buildings, Energy & Storage, Vehicles;I'd like to talk about data infrastructure for utilities, DER implementers, and other providers.;Mt. Scott;Pescatarian;No;I'd be open to speaking about our work in using machine learning to accelerate the adoption of DERS.;
Staff;Spenser Meeks;spenser@apexpresentations.com;15413011415;2024-01-25T20:15:41.233Z;STEERING24;Apex Presentations;Principal;https://www.linkedin.com/in/spenser-meeks-apex/;Impact Partner’s Invite;Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon, Learn about climate technology advancements being made in Oregon;Energy & Storage, Workforce, Behavior & Adoption;Would be interested to better understand better the current gaps are slowing the energy transition in the PNW and how people can help address those issues. Things like directly addressing that we have a lot of hydro, but what is stopping us from shutting off coal, gas, and oil?;North Portland;No;No;;
Attendee;Nick Keenan;nick@gameflowinteractive.com;19712021221;2024-01-25T21:06:53.546Z;CC85;Climate Curious, Gameflow Interactive;CEO;https://www.linkedin.com/in/nick-keenan-9608548;Impact Partner’s Invite;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Behavior & Adoption, Future-Planning, Buildings;;Hillsboro, OR;None;None;;
Impact Partner;Ania Korsunska;ania@zemlia.co;14586002459;2024-01-25T21:53:34.268Z;PARTNER24;Zemlia;Founder;https://www.linkedin.com/in/akorsunska/;Impact Partner’s Invite;Understand how I can help support climate efforts in Oregon, Learn about climate technology advancements being made in Oregon, Understand more about climate solutions generally;Behavior & Adoption, Future-Planning, Health;;SE Portland;No beef or pork;no;Interested in organizing or participating in a panel related to the power of individual action for sustainability;
Attendee;Ben Getson;ben.getson@gmail.com;19723420782;2024-01-26T17:36:20.956Z;CC85;.;Product Manager;https://www.linkedin.com/in/bengetson/;Impact Partner’s Invite;Learn about climate technology advancements being made in Oregon, Understand how I can help support climate efforts in Oregon;Infrastructure, Energy & Storage;;SE Portland;none;none;;
Attendee;Dave Peticolas;dave.peticolas@gmail.com;19719019052;2024-01-27T17:31:02.746Z;FULLPRICE;n/a;n/a;https://www.linkedin.com/in/davepeticolas/;Other;Learn about climate technology advancements being made in Oregon, Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon;Energy & Storage, Infrastructure;;Portland;no;no;;
Attendee;Ari Simmons;asimmons.professional@gmail.com;19718089026;2024-01-30T20:01:48.460Z;CC85;Oregon Clean Power Cooperative;Communications Manager;https://www.linkedin.com/in/arisimmons19/;Impact Partner’s Invite;Connect with other people from other knowledge areas than my own;Behavior & Adoption, Energy & Storage, Future-Planning;;PORTLAND;N/A;N/A;;
Attendee;Aaron Arnoldy;aaron.arnoldy@gmail.com;;2024-02-01T05:54:45.352Z;CC85;Tideline & BlueMark;COO;https://www.linkedin.com/in/aaronarnoldy/;Other;Join a community of like-minded people in Oregon, Connect with other people from other knowledge areas than my own;Energy & Storage, Buildings, Future-Planning;;Portland, OR (NE Portland);No;No;;
Attendee;Brennan Gantner;bgantner@skiptechnology.com;15039674075;2024-02-08T19:27:03.127Z;LETSFLY70;Skip Technology;CEO;https://www.linkedin.com/in/bgantner/;Impact Partner’s Invite;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Understand how I can help support climate efforts in Oregon;Energy & Storage, Workforce, Infrastructure;;Central Eastside Portland;None;None;;
Attendee;Tong Tong Zhang;ttz@pdx.edu;15037254268;2024-02-08T22:17:58.890Z;LETSFLY70;Portland State University - MCECS;Assistant Dean;https://www.linkedin.com/in/tongtzhang/;I’m an Impact Partner;Learn about how we building an inclusive economy in climate;Future-Planning;;PSU;no pork;none;;
Attendee;Margaret R. Smith;margaret@changemakercoach.co;15033139100;2024-02-12T19:27:16.533Z;LETSFLY70;Changemaker Coaching;Founder;www.linkedin.com/in/margaretrsmith/;Impact Partner’s Invite;Join a community of like-minded people in Oregon, Connect with other people from other knowledge areas than my own, Learn about climate technology advancements being made in Oregon;Future-Planning, Workforce, Behavior & Adoption;;NW Portland;No;No;;
Attendee;Jim Huston;jim@portlandseedfund.com;15037801952;2024-02-13T17:29:08.563Z;FULLPRICE;JH Climate Ventures;Partner;https://linkedin.com/in/jimhustonvc;Other;Learn about climate technology advancements being made in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Understand how I can help support climate efforts in Oregon;Energy & Storage, Workforce, Infrastructure;;Sherwood OR;Mussels;No;;
Speaker;Marcelino Alvarez;marcelino@photonmarine.com;13057258002;2024-02-13T19:27:25.033Z;SPEAKER;Photon Marine;CEO;https://www.linkedin.com/in/marcelino;I’m a speaker;Learn about climate technology advancements being made in Oregon;Infrastructure, Vehicles, Future-Planning;;SE Portland;N/A;N/A;;
Attendee;Suhasini Gavarshetty;suhasini.cg@gmail.com;15033184921;2024-02-13T19:51:00.812Z;CC85;Yahoo;Sr. Account Strategist;https://www.linkedin.com/in/suhasini-gavarshetty/;Other;Understand how I can help support climate efforts in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Learn about climate technology advancements being made in Oregon, Join a community of like-minded people in Oregon;Workforce, Behavior & Adoption, Future-Planning;;Northeast Portland, OR;Vegan preferred or else vegetarian;NA;Excited to be attending this!;
Speaker;Alicia Chapman;alicia.chapman@wtfllc.com;15037190790;2024-02-13T20:30:35.431Z;SPEAKER;Willamette Technical Fabricators;Owner & CEO;https://www.linkedin.com/company/willamette-technical-fabricators-llc/;I’m a speaker;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon;Energy & Storage, Workforce, Future-Planning;;Marshall Park, Portland;n/a;n/a;;
Attendee;Keith Chapman;keith.chapman@wtfllc.com;15034765016;2024-02-13T21:13:40.981Z;COMPED;Willamette Technical Fabricators;President;https://www.linkedin.com/company/willamette-technical-fabricators-llc/;I’m a startup;Learn about climate technology advancements being made in Oregon;Infrastructure;;Portland;n/a;n/a;;
Sponsor;Anne Crispino-Taylor;crispino-taylora@prosperportland.us;15419510828;2024-02-15T16:57:19.048Z;PROSPER2024;Prosper Portland;Program Manager;NONE;I’m a sponsor;Learn about climate technology advancements being made in Oregon;Behavior & Adoption;;Portland;No;NO;;
Impact Partner;Andrew Desmond;andrew@orbusinesscouncil.org;12536773230;2024-02-15T17:30:23.740Z;PARTNER24;Oregon Business Council;Economic Development Policy Director;https://www.linkedin.com/in/andrewldesmond/;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Learn about climate technology advancements being made in Oregon, Join a community of like-minded people in Oregon;Energy & Storage, Vehicles, Workforce;;Portland, Oregon;NA;NA;;
Sponsor;Amanda Park;amanda.jean.park@gmail.com;15034226339;2024-02-15T19:20:06.391Z;PROSPER2024;Prosper Portland;Sr. Project Manager;https://www.linkedin.com/in/amandajeanpark/;I’m a sponsor;Learn about climate justice in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Behavior & Adoption, Infrastructure, Future-Planning;;Portland;NONE;NONE;;
Sponsor;Pamela Neal;nealp@prosperportland.us;13605131989;2024-02-15T19:32:45.673Z;PROSPER2024;Prosper Portland;Manager, Business Advancement;https://www.linkedin.com/in/pamelaneal/;I’m a sponsor;Learn about climate technology advancements being made in Oregon;Workforce, Infrastructure, Future-Planning;;Vancouver;No;No;;
Sponsor;Shea Flaherty Betin;flahertybetins@prosperportland.us;18055737434;2024-02-15T20:13:14.964Z;PROSPER2024;Prosper Portland;Economic Development Director;https://www.linkedin.com/in/shea-flaherty-betin-b5275568/;I’m a sponsor;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Energy & Storage, Infrastructure, Workforce;;SE Portland;None;None;Hi :) Katherine is an amazing member of my team and I'm here to support her work with you all! Thank you for all the partnership and for your work to bring these issues forward in Portland.;
Sponsor;Anielis Raas Nebelecky;raasa@prosperportland.us;15038233355;2024-02-15T21:17:15.673Z;PROSPER2024;Prosper Portland;Project Manager-Affordable Commercial Tenanting;https://www.linkedin.com/in/anielis-r-785061a6?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;I’m a sponsor;Learn about climate technology advancements being made in Oregon, Learn about how we building an inclusive economy in climate, Connect with other people from other knowledge areas than my own;Infrastructure, Future-Planning, Workforce;No;Outer SE Portland;No;No;Looking forward to sharing in community, learning where we're at and help create systems that allow us to move forward and being inclusive of everyone, specially disadvantaged communities that don't have deep pockets to make purchases and system change for climate resiliency;
Sponsor;Ness Zolan;zolann@prosperportland.us;15038230903;2024-02-15T22:39:10.932Z;PROSPER2024;Prosper Portland;Project Manager;https://www.linkedin.com/in/nesszolan/;I’m a sponsor;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Learn about climate technology advancements being made in Oregon;Behavior & Adoption, Energy & Storage, Future-Planning;;Central City, Portland;Pescatarian (no shellfish) and vegetarian. No meat.;No;;
Speaker;Cynthia Carmina Gomez;gomezc@pdx.edu;15037254474;2024-02-16T00:20:54.424Z;SPEAKER;Portland State University;Director, Community & Civic Impact;https://www.linkedin.com/in/cynthiacarminagomez/;I’m a speaker;Learn about climate justice in Oregon;Future-Planning, Behavior & Adoption, Infrastructure;;NE;NA;NA;;
Sponsor;Rachel Benton;bentonr@prosperportland.us;15038233285;2024-02-16T00:52:20.472Z;PROSPER2024;Prosper Portland;Grants Team;www.linkedin.com/in/ rachel-benton-7003;I’m a sponsor;Connect with other people from other knowledge areas than my own, Learn about climate technology advancements being made in Oregon, Learn about how we building an inclusive economy in climate;Infrastructure, Buildings, Future-Planning;;Old Town;Eggs;hard of hearing - subtitles are great;;
Attendee;Brian Boshes;boshes@ecobadlandz.com;12062454039;2024-02-19T20:18:32.496Z;CC85;Ecobadlandz;Cofounder;https://www.linkedin.com/in/brianboshes/;I’m a startup;Join a community of like-minded people in Oregon, Learn about how we building an inclusive economy in climate, Learn about climate technology advancements being made in Oregon, Connect with other people from other knowledge areas than my own, Understand more about climate solutions generally, Understand how I can help support climate efforts in Oregon;Energy & Storage, Infrastructure, Future-Planning, Vehicles;;Hillsdale;None;None;;
Attendee;Johan Kers;jkers@birchbiosciences.com;16505758427;2024-02-21T06:02:55.863Z;LETSFLY70;Birch Biosciences Inc.;Co-founder and CEO;https://www.linkedin.com/in/johankers/;Impact Partner’s Invite;Learn about climate technology advancements being made in Oregon, Join a community of like-minded people in Oregon, Understand how I can help support climate efforts in Oregon;Future-Planning, Infrastructure, Workforce;"Opportunities for government programs to help startups get off the ground. For example, why don't we have have government sponsored ""We work"" facilities for climate tech startups in Portland or state of Oregon-owned buildings? My perception is that there is a lot of talk about Oregon wanting to do things about climate, but little real action from government leadership on this. We need programs that will attract companies and talent from other geographies to build a startup ecosystem with critical mass that is working on climate. I find it odd that our company gets recruiting solicitations from other states with generous offers of relocation and subsidy but Oregon doesn't seem to have a robust vision to drive development of this ecosystem. I would love to learn more (and be proven wrong!)";NE Portland;None;None;;
Attendee;Debbie Silva;debbie.silva@evrazna.com;15039786044;2024-02-21T16:56:46.959Z;LETSFLY70;Evraz Oregon Steel Mills - Portland;Environmental Manager;www.linkedin.com/in/ debbie-deetz-silva-54994516;Other;Connect with other people from other knowledge areas than my own, Learn about climate technology advancements being made in Oregon;Energy & Storage;;SE PORTLAND;None;none;Hi.;
Attendee;Sunanda Chunder;sunanda.chunder@evrazna.com;15039786189;2024-02-21T17:31:24.720Z;LETSFLY70;EVRAZ Inc.;Environmental Engineer;www.linkedin.com/in/sunanda-chunder;Other;Learn about climate technology advancements being made in Oregon;Energy & Storage, Infrastructure, Future-Planning;;Portland;No meat. Fish, eggs and dairy ok.;None;;
Staff;Jedd Chang;jedd@smithandjonesinnovation.com;15038521120;2024-02-22T09:34:36.325Z;STEERING24;Smith and Jones Innovation;Attendee Concierge;https://www.linkedin.com/in/jeddchang/;Other;Join a community of like-minded people in Oregon;Future-Planning;;Monmouth;No spicy food. In fact, I'll get my own meals.;None. Thanks!;Good to go.;
Staff;Jeff Smith;jeff@smithandjonesinnovation.com;;2024-02-22T09:36:31.595Z;STEERING24;Smith and Jones Innovation;Partnera;egaega;Other;Learn about climate justice in Oregon;Workforce;awgaeg;asaegaea;egaega;gawegae;agaweg;
Attendee;Morgan Pitts;morgan.pitts@essinc.com;13018079267;2024-02-22T19:40:41.225Z;LETSFLY70;ESS Inc.;Director, Corporate Communications;https://www.linkedin.com/in/morgan-pitts-7222a07;I’m a sponsor;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Connect with other people from other knowledge areas than my own, Join a community of like-minded people in Oregon;Energy & Storage, Infrastructure, Workforce;;Northeast PDX - Eliot Neighborhood;No;No;;
Speaker;Edward Benote Hill;edwardb@foodloopnw.com;19718088335;2024-02-22T19:47:18.924Z;SPEAKER;FoodLoop Northwest;Co-Founder/Partner/FOTH Director;https://www.linkedin.com/in/eddie-benote-hill;I’m a speaker;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Behavior & Adoption, Infrastructure, Health;Not at this time, I am excited to experience the event.;West Hills, Portland;Vegetarian minimum;None, thank you;Thank you for the invitation;
Impact Partner;Nicole Miranda;nicole.miranda@portofportland.com;15034156507;2024-02-22T23:55:05.245Z;SIBA85;Swan Island Business Association;Secretary;NONE;Other;Understand how I can help support climate efforts in Oregon;Buildings, Energy & Storage, Infrastructure;;Mill Park;None;N/A;;
Attendee;Ethan Knight;ethan@carpediemeducation.org;15038302322;2024-02-23T00:06:26.753Z;LETSFLY70;Carpe Diem Education;Executive Director;https://www.linkedin.com/in/ethan-knight-a0a642b;Impact Partner’s Invite;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Understand more about climate solutions generally, Learn about climate technology advancements being made in Oregon;Future-Planning, Energy & Storage, Behavior & Adoption;;Portland, OR;None;None;;
Attendee;Emi Day;emiday@gmail.com;;2024-02-23T08:48:04.875Z;CC85;Wind River;Senior User Experience Designer;https://www.linkedin.com/in/emiday/;Impact Partner’s Invite;Learn about climate technology advancements being made in Oregon, Understand more about climate solutions generally, Understand how I can help support climate efforts in Oregon;Behavior & Adoption, Future-Planning, Infrastructure;;NW;none;none;;
Attendee;Nate Conroy;nate@raincatalysts.org;15416028150;2024-02-25T21:08:19.227Z;STARTUPS80;RAIN Catalysts;Rural Venture Catalyst;https://www.linkedin.com/in/nathanconroy/;Impact Partner’s Invite;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Behavior & Adoption, Workforce, Infrastructure;How can we ensure rural communities buy-in and benefit from our efforts;Albany, Oregon;None;None;Thank you for holding the event downtown;
Impact Partner;Tanya Hartnett;tanya.hartnett@workingwaterfrontportland.org;15033816713;2024-02-27T12:35:37.974Z;PARTNER24;Working Waterfront Coalition;Executive Director;Tanyahartnett;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Behavior & Adoption, Workforce, Future-Planning;No;Portland;Vegetarian;No;No;
Staff;Wes Wages;wes@armosastudios.com;12567028102;2024-02-28T03:26:49.023Z;CREW24;Armosa Studios;Storyteller;https://www.linkedin.com/in/weswages/;Other;Learn about climate technology advancements being made in Oregon;Behavior & Adoption;;Nashville Tn;None;None;None;
Speaker;Noel Kinder;noelkinder510@gmail.com;15039974743;2024-02-28T19:34:35.432Z;SPEAKER;Nike;Former CSO Nike, Inc.;https://www.linkedin.com/in/noel-kinder-148b521b4/;I’m a speaker;Learn about climate technology advancements being made in Oregon;Behavior & Adoption;;Portland;no;no;;
Attendee;Ian Greenfield;igreenfield@me.com;15039972557;2024-02-29T01:15:06.549Z;LETSFLY70;YPrime;Chief Strategy Officer;https://www.linkedin.com/in/ianmgreenfield;Other;Learn about how we building an inclusive economy in climate, Connect with other people from other knowledge areas than my own;Future-Planning, Energy & Storage;;Portland, OR;None;None;;
Impact Partner;Bill Henry;b.henry@pacificoceanenergy.org;15034750391;2024-02-29T21:58:52.756Z;PARTNER24;Pacific Ocean Energy Trust;Program Manager;https://www.linkedin.com/in/bill-henry-2b8b3616/;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Energy & Storage, Infrastructure, Workforce;POET is interested in helping to bring an ocean-based climate technology component to Wings.;Northeast Portland;No;No;;
Impact Partner;David Kirshbaum;dk@vitalmessage.co;18328037230;2024-03-01T01:10:21.956Z;PARTNER24;Vital Message;Founder and Principal;https://linkedin.com/in/davidkirshbaum;I’m an Impact Partner;Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon, Join a community of like-minded people in Oregon;Buildings, Health, Behavior & Adoption;I notice agriculture is missing from the list of topics and is an important one both in the climate space and in Oregon that would be good to include.;Portland, OR;I try to minimize gluten, dairy, and sugar.;No;Excited for this!;
Attendee;Nicholas Day;daynicho@gmail.com;15038964488;2024-03-01T17:20:13.870Z;STARTUPS80;Arrow Carbon;CTO;https://www.linkedin.com/in/nicholas-upton-day/;I’m a startup;Learn about climate technology advancements being made in Oregon, Understand how I can help support climate efforts in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Future-Planning;;Portland;I am a vegetarian;No;;
Attendee;Alex DeNuzzo;adenuzzo@lclark.edu;19166947632;2024-03-01T17:59:22.886Z;STUDENT95;Lewis & Clark College;Student;https://www.linkedin.com/in/alexdenuzzo/;Student;Join a community of like-minded people in Oregon, Learn about climate technology advancements being made in Oregon;Energy & Storage, Workforce, Vehicles;;NW Portland;Non-dairy milk!;No;Howdy! :);
Impact Partner;Martina Steinkusz;m.steinkusz@renewableh2.org;15034688252;2024-03-02T01:56:36.719Z;PARTNER24;Renewable Hydrogen Alliance;Director of Market Development;https://www.linkedin.com/in/martina-steinkusz/;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Energy & Storage;"Let's talk about:
 

 - how Oregon is planning to realistically decarbonize hard-to-electrify sectors like rail (diesel), shipping (bunker fuels), aviation (jet fuels), and heavy-duty, long-range trucks (diesel/gasoline). Those sectors are a cause to bad air quality in neighboring communities.
 

 - Energy resiliency? What's our clean, climate-friendly, long-duration (multi-day) backup plan? What solutions are out there, and how is it backed by city or county policy? With the ice storm and multi-day power outages, everyone in the neighborhood turned on their loud and stinky diesel or natural gas backup generators. What can the city do to offer opportunities for community resiliency / clean energy pilot projects apart from solar? 
 

 - how is the clean energy/climate community and local government supporting kids / younger generations in taking responsibility?";SW Portland;No;No;Let's do this, Portland!;
Impact Partner;Corky Collier;corky@columbiacorridor.org;15032411888;2024-03-04T16:31:21.319Z;PARTNER24;Columbia Corridor Association;Executive Director;https://www.linkedin.com/in/corky-collier-49472310/;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.;Future-Planning;;N Portland;none;none;;
Impact Partner;Kristi DeGroat;kristi@oseia.org;15038871259;2024-03-04T17:58:07.913Z;PARTNER24;Oregon Solar Storage Industry Indust;Development Director;https://www.linkedin.com/in/kristin-degroat-7a00b37/;Impact Partner’s Invite;Join a community of like-minded people in Oregon;Workforce;;Tualatin;none;none;;
Speaker;Joseph Bull;bull2@pdx.edu;15037258393;2024-03-05T00:20:37.747Z;SPEAKER;Portland State College - Maseeh College of Engineering & Computer Science;H. Chik M. Erzurumlu Dean;https://www.linkedin.com/in/josephbullphd;I’m a speaker;Other (I'll add it in the final message area at the end of the form);Infrastructure, Energy & Storage, Future-Planning;;SW Portland, Portland State University Campus;n/a;n/a;;
Speaker;Tanya Barham;tanyab@communityenergylabs.com;18665787118;2024-03-05T13:42:21.273Z;SPEAKER;Community Energy Labs, Inc.;Founder & CEO;https://www.linkedin.com/in/tanyabarham/;Other;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Join a community of like-minded people in Oregon, Understand how I can help support climate efforts in Oregon;Buildings, Behavior & Adoption, Energy & Storage;;401 NE 19th Avenue, Portland, OR 97232;No;No;Thanks for the opportunity!;
Attendee;Ozzie Gonzalez;ozzie@p3-associates.com;13109956499;2024-03-06T04:25:35.855Z;LETSFLY70;P3 Consulting;Owner + Founder;www.linkedin.com/in/ozziegonzalez;I’m a startup, Impact Partner’s Invite;Join a community of like-minded people in Oregon, Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Understand how I can help support climate efforts in Oregon;Workforce, Infrastructure, Future-Planning;We don't have the workforce we need in Oregon to build the infrastructure we intend to build in Oregon over the next 10 years. Like by a long shot. I want to get involved in closing that gap.;Portland, SW. Homestead Neighborhood.;no restrictions.;none.;I am glad this is happening.;
Impact Partner;Patti Brooke;patti@moonbeam.ai;12062261287;2024-03-06T16:21:25.403Z;PARTNER24;Moonbeam;Managing Director;https://www.linkedin.com/in/pattibrooke/;I’m an Impact Partner;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Understand how I can help support climate efforts in Oregon, Learn about how we building an inclusive economy in climate;Energy & Storage, Workforce, Future-Planning;No;SEATTLE;No;No;Hi!;
Attendee;Aaron Weast;aaron@cruciblepd.com;15038601343;2024-03-06T16:53:38.159Z;CC85;Crucible Product Development;Principal;www.linkedin.com/in/aaron-weast;I’m a startup;Learn about climate technology advancements being made in Oregon, Understand how I can help support climate efforts in Oregon, Join a community of like-minded people in Oregon;Energy & Storage;Just excited to know what's happening around Portland/PNW in the realm of climate;Battle Ground, WA;Nope - just healthy food please :);No;Stoked!;
Impact Partner;Troy DeFrank;troy@moonbeam.ai;19712467119;2024-03-06T18:58:13.899Z;PARTNER24;Moonbeam;VP, International Programs;https://www.linkedin.com/in/troydefrank/;Impact Partner’s Invite;Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc., Connect with other people from other knowledge areas than my own;Energy & Storage, Infrastructure, Agriculture;;Seattle, WA;None;None;;
Staff;Patrick Prothe;patrickprothe@gmail.com;15036019192;2024-03-07T16:49:12.721Z;VOLUNTEER24;Design Buddha;Founder;https://www.linkedin.com/in/pprothe/;Other;Join a community of like-minded people in Oregon;Future-Planning, Health, Buildings;;SE Portland;Mostly Vegetarian but flexible.;None;;
Attendee;Leah Plack;leah.plack@pdxstem.org;;2024-03-07T20:37:00.883Z;LETSFLY70;Portland Metro STEM Partnership;Project Coordinator;https://www.linkedin.com/in/leah-plack-aa568b14a/;Impact Partner’s Invite;Connect with other people from other knowledge areas than my own, Understand how I can help support climate efforts in Oregon, Join a community of like-minded people in Oregon;Infrastructure, Energy & Storage, Future-Planning;;North Tabor neighborhood;None, although I prefer vegetarian;None;;
Impact Partner;Jessica Carmona;jcarmona@b-e-f.org;15035533955;2024-03-07T23:22:09.720Z;PARTNER24;Bonneville Environmental Foundation;Sr Program Manager;https://www.linkedin.com/in/jessica-carmona/;I’m an Impact Partner;Understand how I can help support climate efforts in Oregon;Energy & Storage, Future-Planning, Workforce;;Portland;No;No;;
Attendee;Erin Fish;erin@gowanderwell.com;14155165245;2024-03-07T23:47:19.458Z;CC85;Wanderwell;CEO;https://www.linkedin.com/in/fisherin/;Impact Partner’s Invite;Learn about climate technology advancements being made in Oregon;Behavior & Adoption, Future-Planning;;Inner NE Portland;Veggie;No;;
Impact Partner;Angela Borden Jackson;angela.jackson@pdx.edu;15033195875;2024-03-08T15:22:21.509Z;PARTNER24;Portland State University / Powerize Northwest;Powerize NW CEO;https://www.linkedin.com/in/angelajackson/;;;;;;;;;
Impact Partner;Gigi Harker-Olguin;gigi.olguin@greaterportlandinc.com;15038419215;2024-03-08T15:40:43.686Z;PARTNER24;Greater Portland Inc;Business Development Manager;https://www.linkedin.com/in/gimena-gigi/;;;;;;;;;
Attendee;Merry Ann Moore;merryannmoore@gmail.com;15417498030;2024-03-08T18:42:09.522Z;LETSFLY70;Moore Creative Strategies;Marketing consultant;https://www.linkedin.com/in/merryannmoore/;;;;;;;;;
Attendee;Maggie Flanagan;maggief@lemelson.org;;2024-03-08T23:44:12.118Z;FULLPRICE;The Lemelson Foundation;Program Officer;https://www.linkedin.com/in/maggie-flanagan-6b5a2b25/;;;;;;;;;
Staff;Walter James;wmjames07@gmail.com;14586002064;2024-03-09T17:58:55.732Z;VOLUNTEER24;Power Japan Consulting;Principal Analyst;https://www.linkedin.com/in/wjames2/;;;;;;;;;
Staff;Melanie Adamson;melanie@alderagency.com;15037898455;2024-03-10T19:45:01.139Z;STEERING24;Alder & Co.;Partner & CEO;https://www.linkedin.com/in/melanieadamson/;;;;;;;;;
Attendee;Justin Carven;juc421@g.harvard.edu;;2024-03-11T03:50:29.790Z;STUDENT95;BEYOND Circular Solutions;Founder;https://www.linkedin.com/in/justin-carven-5b13983a/;;;;;;;;;
Staff;Michelle Chang;mcmeeshi@gmail.com;19713046600;2024-03-11T05:34:36.736Z;VOLUNTEER24;Intentional Travelers;Owner;https://www.linkedin.com/in/michelle-chang-411b2b16/;;;;;;;;;
Staff;Abby Schwalb;abby.schwalb@gmail.com;19732295430;2024-03-11T16:06:07.463Z;VOLUNTEER24;N/A;N/A;https://www.linkedin.com/in/abbyschwalb/;;;;;;;;Looking forward to supporting!;
Attendee;David Worth;dave.worth@zakti.biz;15033580737;2024-03-11T21:25:08.584Z;STARTUPS80;Zakti;Principal Avisor, Founder;https://www.linkedin.com/in/daveworth/;;;;;;;;Thank you for approving my discount. Looking forward to the conference. If there is any opportunity for me to support the event through a small presentation or by facilitating a special topic session please let me know.;
Impact Partner;Abigail Van Gelder;a.vangelder@pdx.edu;16122407641;2024-03-11T23:23:51.626Z;PARTNER24;PSU Center for Entrepreneurship;Director;https://www.linkedin.com/in/akrsouth/;;;;;;;;;
Attendee;Kirk Ellis;iamkirkellis@gmail.com;15036807761;2024-03-11T23:25:20.840Z;COMPED;St. Marys Academy;Faculty;NONE;;;;;;;;I am attending as Cynthia Carmina's guest.;
Attendee;Tom Yeager;tom.yeager.tdy@gmail.com;16144462473;2024-03-12T05:34:04.830Z;LETSFLY70;Looking for Work;Software Engineer;https://www.linkedin.com/in/yeagertom/;;;;;;;;Thanks for getting back so quickly! Looking forward to learning more through the conference.;
Staff;Linda Robertson;lr@lindarobertsonarts.com;15033489139;2024-03-12T06:28:13.075Z;VOLUNTEER24;Linda Robertson Arts;Owner;https://www.linkedin.com/in/1lindarobertson/;;;;;;;;;
Staff;Steve Harper;steve@indigodesignllc.com;15032950900;2024-03-12T11:18:28.376Z;CREW24;Indigo Design LLC;Owner;NONE;;;;;;;;Registered by Jedd for Steve.;
Staff;Hunter Loveridge;hunter@pixthis.com;;2024-03-12T11:19:33.490Z;CREW24;Pix This;Ownder;NONE;;;;;;;;Registered by Jedd for Hunter.;
Staff;Sigfried Seeliger;seesigi@me.com;;2024-03-12T11:20:27.025Z;CREW24;NONE;NONE;NONE;;;;;;;;Registered by Jedd for Sigi;
Staff;Sara Beukers;sarabeukers@gmail.com;;2024-03-12T11:22:31.706Z;CREW24;NONE;NONE;NONE;;;;;;;;Registered by Jedd (Smith and Jones Innovation) for Sara. Requested by Michelle Jones.;
Staff;Denise Ransome;denise@deniseransome.com;;2024-03-12T11:26:21.122Z;CREW24;NONE;NONE;NONE;;;;;;;;Registered by Jedd on behalf of Denise.;
Attendee;Colleen Murray;colleen1murray2@gmail.com;;2024-03-12T22:58:33.997Z;CC85;Perkins & Co;Consultant;https://www.linkedin.com/in/colleenlmurray/;;;;;;;;;
Attendee;Kayla Anderson;kayla@riparianmedia.com;13609101956;2024-03-13T00:39:43.016Z;APEXWINGS85;Riparian Media;Founder, Creative Director;https://www.linkedin.com/in/kaylanderson/;;;;;;;;;
Attendee;Ty Adams;tyadams@gmail.com;15416541799;2024-03-13T17:33:36.997Z;LETSFLY70;Leaven Community Center;Climate Team Member;https://www.linkedin.com/in/tykadams/;;;;;;;;;
Attendee;Krista Reynolds;krista@engagingeverystudent.com;15033587357;2024-03-13T18:55:50.110Z;LETSFLY70;Engaging Every Student;Director of Educational Support and Research;https://www.linkedin.com/krista-reynolds-pdx;;;;;;;;;
Impact Partner;Bianca Gonzalez;bianca@theblueprintfoundation.org;15032703816;2024-03-13T19:07:02.946Z;PARTNER24;The Blueprint Foundation;Development and Communications Manager;https://www.linkedin.com/in/bianca-gonzalez-90a7b5196/;;;;;;;;;
Attendee;Evan Ramsey;eramsey@b-e-f.org;15033417694;2024-03-13T23:21:28.458Z;85,00 BEF;Bonneville Environmental Foundation;Senior Director;https://www.linkedin.com/in/evan-ramsey-b01b1213/;;;;;;;;;
Attendee;Javier Cobian;javier.cobian11@gmail.com;17608838345;2024-03-14T15:20:43.087Z;LETSFLY70;HDR Inc.;Electrical EIT;www.linkedin.com/in/javier-cobian;;;;;;;;;
Attendee;Olivia Vulpin;opt@uoregon.edu;15082733371;2024-03-14T18:53:44.242Z;LETSFLY70;University of Oregon;PhD Candidate;https://www.linkedin.com/in/olivia-vulpin/;;;;;;;;;
Speaker;Aina Abiodun;aina.abiodun@vertuelab.org;16468740850;2024-03-14T19:11:56.562Z;SPEAKER;VertueLab;President & Executive Director;https://www.linkedin.com/in/ainaabiodun/;;;;;;;;;
Staff;Jane Comeault;janevthomson@hotmail.com;15039756870;2024-03-14T23:37:56.746Z;VOLUNTEER24;None;None;www.linkedin.com/in/jane-comeault-0373073;;;;;;;;;
Attendee;Kristin Wolff;kristin_wolff@spra.com;15038881022;2024-03-15T06:54:10.086Z;LETSFLY70;Social Policy Research;Senior Associate;https://www.linkedin.com/in/kristinwolff?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;;;;;;;;Looking forward to it! Appreciate the code (I’m PTOing and self-paying.);
Impact Partner;Rick Reynolds;rick@engagingeverystudent.com;15033804140;2024-03-15T15:34:00.375Z;PARTNER24;Engaging Every Student / Engaging Press;Founder;https://www.linkedin.com/in/rick-reynolds-04b4668;;;;;;;;Krista and I are looking forward to it, Michelle and team--thanks for organizing it!;
Impact Partner;Anna Almonte;anna.almonte@energyally.com;19174369581;2024-03-15T20:24:24.600Z;PARTNER24;Intact Energy Consulting;Founder & Managing Director;https://www.linkedin.com/in/annaalmonte/;;;;;;;;;
Impact Partner;Lance Randall;lance@bbaoregon.org;12064550266;2024-03-15T23:19:33.471Z;PARTNER24;Black Business Association of Oregon;Executive Director;https://www.linkedin.com/in/lance-j-randall-a741b88/;;;;;;;;;
Impact Partner;Marquita Jaramillo;marquita@bbaoregon.org;19714081570;2024-03-15T23:20:54.335Z;PARTNER24;Black Business Association of Oregon;Business Retention & Expansion Director;https://www.linkedin.com/in/marquita-jaramillo/;;;;;;;;;
Impact Partner;Nick Triska;nick.triska@greaterportlandinc.com;17573101524;2024-03-15T23:38:53.457Z;PARTNER24;Greater Portland Inc;Senior Manager, Business Development;https://www.linkedin.com/in/nick-triska-6761241a/;;;;;;;;;
Impact Partner;Mary Peveto;mary@neighborsforcleanair.org;15037050481;2024-03-15T23:42:03.967Z;PARTNER24;Neighbors for Clean Air;Co-Director;None;;;;;;;;;
Attendee;Christopher Butler;chris@evolvecollab.com;15035440451;2024-03-16T00:47:33.181Z;CC85;Evolve Collaborative;Co-Founder;https://www.linkedin.com/in/chrisbutlerlondon/;;;;;;;;;
Staff;Gillian Wildfire;gillianwildfire@gmail.com;12023605117;2024-03-16T20:43:40.062Z;VOLUNTEER24;Volunteering;Na;https://www.linkedin.com/in/gillianwildfire?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;;;;;;;;;
Attendee;Kaya Kachigian;kayakachigian@gmail.com;14156378655;2024-03-17T20:16:33.507Z;CC85;N/A;Climate Tech;https://www.linkedin.com/in/kaya-kachigian;;;;;;;;;
Attendee;Itanna Murphy;itanna.murphy@gmail.com;15417603234;2024-03-18T04:32:49.093Z;STARTUPS80;SHEBA;Founder;https://www.linkedin.com/in/itanna-murphy-pa-c-24086b142?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;;;;;;;;Just attended VertueLab / Tabor 100 workshops in PDX and SEA. So excited to be networking with like-minded folks.;
Attendee;Yosafe Murphy;yosafemurphyrt@gmail.com;12064952089;2024-03-18T04:37:40.119Z;STARTUPS80;SHEBA;Founder;https://www.linkedin.com/in/yosafe-murphy-918bb9183?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;;;;;;;;Working with NREL to create a 1-acre agrivoltaic farm in rural Junction City.;
Attendee;Rachel Maas;rachel.maas@ccconcern.org;19712445023;2024-03-18T17:48:30.929Z;85,00 BEF;Central City Concern;Director of Climate Action;https://www.linkedin.com/in/rachel-maas-a7738616/;;;;;;;;;
Attendee;Annie Murai;annie@measurepnw.com;15038047940;2024-03-18T18:33:06.005Z;CC85;Measure Ment;Partner;https://www.linkedin.com/in/annie-murai-sustainability/;;;;;;;;I am excited to join! Let me know if there are ways that I can help out in a volunteering capacity to help run the event.;
Staff;Laurie Ann (L.A.) Silberman;lasilberman@duck.com;19713809558;2024-03-18T22:46:35.614Z;VOLUNTEER24;N/A;Director of Unique Choices (LoL);https://www.linkedin.com/in/lasilberman;;;;;;;;;
Attendee;Richard Tankersley;rtankers@pdx.edu;15037259944;2024-03-18T23:41:29.254Z;PSU75;Portland State University - RGS;Vice President for Research & Graduate Studies;https://www.linkedin.com/in/richard-tankersley-2401a635?trk=people-guest_people_search-card;;;;;;;;;
Attendee;Annie Lindgren;annie.lindgren@pdx.edu;15037259944;2024-03-19T00:12:28.575Z;PSU75;Portland State University - RGS;Int. Associate VP for Research;https://www.linkedin.com/in/annie-lindgren-30656b15?trk=people-guest_people_search-card&original_referer=https%3A%2F%2Fwww.linkedin.com%2Fpub%2Fdir%3FfirstName%3DAnnie%26lastName%3DLindgren%26trk%3Dpeople-guest_people-search-bar_search-submit;;;;;;;;;
Attendee;Erik M Gordon;egordon@percipiogroup.com;14049132256;2024-03-19T16:52:50.510Z;FULLPRICE;Percipio Consulting;Director;https://www.linkedin.com/in/erik-maximilian-gordon;;;;;;;;;
Attendee;Mark Brady;mark.brady@biz.oregon.gov;15036895638;2024-03-19T17:29:18.917Z;LETSFLY70;Business Oregon;Innovation and Entrepreneurship Manager;https://www.linkedin.com/in/mark-brady-oregon;;;;;;;;;
Attendee;Kelly Lyons;kelly@climbsmartstrategies.com;14846788168;2024-03-19T23:19:27.222Z;VERTUELAB75;Climb Smart Strategies;Principal Consultant;https://www.linkedin.com/in/kelly-lyons-2713725a/;VertueLab Board Member;;;;;;;;
Attendee;Carmella West;carmella.m.west@gmail.com;;2024-03-20T15:51:06.476Z;CC85;Carmella West Solutions, LLC;Marketing Consultant;https://www.linkedin.com/in/carmellawest/;;;;;;;;;
Attendee;Derron Coles;derron@drclearningsolutions.com;15419081594;2024-03-20T16:05:11.950Z;DEEPDIVE24;DRC Learning Solutions;Principal Consultant;NONE;;;;;;;;;
Attendee;Dimitry Gershenson;dimitry@enduringplanet.com;18314546818;2024-03-20T16:15:26.618Z;DEEPDIVE24;Enduring Planet;CEO;https://linkedin.com/in/dgershenson;;;;;;;;;
Attendee;Jess Kincaid;labonn@bpa.gov;15038941770;2024-03-20T16:35:13.283Z;LETSFLY70;Bonneville Power Administration;Director of Technology Innovation;NONE;;;;;;;;;
Attendee;Liam Twight;liamt@uoregon.edu;;2024-03-20T16:49:08.528Z;STUDENT95;University of Oregon;PhD Student;www.linkedin.com/in/liam-t-b178a0a3;;;;;;;;;
Impact Partner;Dwindell Feeley;dwindell.feeley@freegeek.org;;2024-03-20T18:31:32.390Z;PARTNER24;Free Geek;Manager of Business Development;https://www.linkedin.com/in/dwindell-feeley/;;;;;;;;;
Impact Partner;Juan Muro, Jr.;j.muro@freegeek.org;;2024-03-20T18:32:38.116Z;PARTNER24;Free Geek;Executive Director;https://www.linkedin.com/in/jmmurojr;;;;;;;;;
Impact Partner;Amber Brink;amber.brink@freegeek.org;;2024-03-20T19:30:36.625Z;PARTNER24;Free Geek;Director of Technology;https://www.linkedin.com/in/amber-brink-81b80557;;;;;;;;;
Attendee;Ben Peterson;ben@think3thirds.com;15037309381;2024-03-20T20:52:13.187Z;CC85;United States;Head of Writing;https://www.linkedin.com/in/benpetersonpdx/;;;;;;;;;
Attendee;David Tetrick;tanja.olson@oregonmetro.gov;19713933226;2024-03-20T23:02:51.175Z;LETSFLY70;Oregon Metro;Economic Development Planner;https://www.linkedin.com/in/david-t-125777121/;David's email is david.tetrick@oregonmetro.gov;;;;;;;;
Attendee;Cassidy Moyer;casmoyer@pdx.edu;17609140725;2024-03-21T00:59:01.907Z;STUDENT95;Portland State University;Student;linkedin.com/in/cassidy-moyer-210980225;;;;;;;;;
Attendee;Kelson Redding;kredding@energy350.com;15034420656;2024-03-21T16:50:12.452Z;FULLPRICE;Energy Trust of Oregon;Industrial Outreach Manager;https://www.linkedin.com/in/kelson-redding-p-e-88120b48/;;;;;;;;I work with manufacturers to help them find and implement energy efficiency improvement projects at their facilities. We also work to connect these projects to incentive funding from Energy Trust of Oregon and other sources.;
Attendee;Leon O. Wolf;leon.o.wolf@gmail.com;15412315199;2024-03-21T18:33:41.953Z;LETSFLY70;LEONWOLFCONSULTING;Principal;https://www.linkedin.com/in/leonwolf23?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app;;;;;;;;;
Attendee;Gunnar Vulpin;gunnar.knost@gmail.com;18509100008;2024-03-21T23:18:40.067Z;LETSFLY70;University of Oregon;Law Student;https://www.linkedin.com/in/gunnar-vulpin;;;;;;;;;
Staff;Julia Babcock;jjb@pdx.edu;17274094160;2024-03-22T03:40:17.902Z;VOLUNTEER24;PSU;Senior Project Manager;https://www.linkedin.com/in/juliajoanb?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app;;;;;;;;I am so excited about the content of this conference and supporting the good work and partnerships!;
Speaker;Jocelyn Quarrell;jocelyn@boldreuse.com;;2024-03-22T05:53:00.648Z;SPEAKER;Bold Reuse;CEO;https://www.linkedin.com/in/jocelyngaudiquarrell/;;;;;;;;Registration by Jedd of Smith & Jones Innovation on behalf of speaker, Jocelyn.;
Speaker;Dexter Turner;dturner@opconnect.com;;2024-03-22T05:55:25.056Z;SPEAKER;OpConnect;CEO;https://www.linkedin.com/in/dexterturner/;;;;;;;;Wings registration by Jedd of Smith & Jones Innovation on behalf of speaker, Dexter.;
Speaker;Pat Crowley;pat@chapulfarms.com;;2024-03-22T05:56:15.823Z;SPEAKER;Chapul Farms;CEO;https://www.linkedin.com/in/patrick-crowley-b43b131a/;;;;;;;;Wings registration by Jedd of Smith & Jones Innovation on behalf of speaker, Pat.;
Attendee;Sarah Strobl;sstrobl@pdx.edu;;2024-03-22T16:31:02.290Z;STUDENT95;Portland State University;MBA Candidate;https://www.linkedin.com/in/sefstrobl/;;;;;;;;;
Attendee;Sarah Brennan;sbren2@pdx.edu;18584447874;2024-03-22T16:37:28.064Z;STUDENT95;Portland State University;Net Impact Chapter Co-President;https://www.linkedin.com/in/sarah-brennan-59211a133/;;;;;;;;Thank you for making this accessible for students!;
Attendee;Clark Brockman;clark@brockmanclimatestrategies.com;19712271514;2024-03-22T17:28:53.807Z;STARTUPS80;Brockman Climate Strategies LLC;Founder-Principal;https://www.linkedin.com/in/clark-brockman-83911b8/;;;;;;;;Looking forward to the conference - thank you for the Start-up discount!;
Attendee;Daryl Lambert;dlambert@worksystems.org;18312382389;2024-03-22T17:38:22.028Z;DEEPDIVE24;WORKSYSTEMS,INC;Senior Project Manager - Clean Energy Sector Lead;www.linkedin.com/in/daryl-lambert-62395811;;;;;;;;;
Attendee;Joseph Janda;janda@pdx.edu;15037256168;2024-03-22T23:01:59.340Z;PSU75;Portland State University;Assistant Vice President for Innovation—Propel PSU;https://www.linkedin.com/in/joseph-janda-752a266/;;;;;;;;;
Speaker;Keith Crossland;carbonegativesolutions@gmail.com;14016266157;2024-03-23T02:58:17.114Z;SPEAKER;Carbon Negative Solutions;CEO/Co-Founder;https://www.linkedin.com/in/keith-crossland-022a0a26;;;;;;;;;
Attendee;Ramsey McPhillips;ramseymcphillips@tainablelabs.com;15032237777;2024-03-23T17:54:31.194Z;DEEPDIVE24;Tainable Regenerative Agricultural Laboratory;Executive Director;tainablelabs@linkedin.com;;;;;;;;;
Attendee;Eric King;eric.king@nike.com;15182655339;2024-03-24T04:03:15.337Z;CC85;Nike;Director, Sustainable Innovation;https://www.linkedin.com/in/eric-m-king/;;;;;;;;;
Attendee;Daniel Ricardo Saa Zaniefski;dsaa@centrocultural.org;19713966868;2024-03-25T17:32:45.294Z;LETSFLY70;Centro Cultural;Grants Manager;https://www.linkedin.com/in/danielsaazaniefski-ri/;;;;;;;;;
Attendee;Charles Letherwood;charles@tomdwyer.com;15032302300;2024-03-25T19:44:26.697Z;COMPED;Tom Dwyer Automotive Services;Outreach Advisor;NONE;;;;;;;;Looking forward to reporting back to our clients with the results of the conference!;
Attendee;Len Harris;lenwealth@icloud.com;12068893045;2024-03-25T22:15:20.103Z;COMPED;Radical Ventures Group;Project Supervisor;None;;;;;;;;;
Attendee;Amber Peoples;amber@earthrelationship.com;15037572182;2024-03-25T23:46:51.183Z;CC85;Earth Archetypes;Chief Relationship Officer;https://www.linkedin.com/in/ambermpeoples/;;;;;;;;;
Staff;Ashley Kmiecik;ashley.kmiecik@techoregon.org;15094321472;2024-03-26T09:57:22.188Z;VOLUNTEER24;Technology Association of Oregon;Director of Sponsorship & Events;https://www.linkedin.com/in/ashley-kmiecik/;;;;;;;;This conference (volunteer) registration is for Ashley Kmiecik who was registered by Jedd Chang of Smith & Jones Innovation with information they provided and also information found on Linkedin.;
Staff;Becca Baugh;becca.baugh@techoregon.org;15038990817;2024-03-26T09:58:55.605Z;VOLUNTEER24;Technology Association of Oregon;Finance and Operations Manager;https://www.linkedin.com/in/rebecca-baugh-88a0a121a/;;;;;;;;This conference (volunteer) registration is for Becca Baugh who was registered by Jedd Chang of Smith & Jones Innovation with information they provided and also information found on Linkedin.;
Attendee;Robert Bass;robert.bass@pdx.edu;;2024-03-26T17:35:36.985Z;DEEPDIVE24;Portland State Univesity;Professor;https://www.linkedin.com/in/robert-bass-993b0514/;;;;;;;;;
Attendee;Abby Chroman;achroman@pdx.edu;15302771259;2024-03-26T18:01:51.242Z;STUDENT95;Portland State University;Student;None;;;;;;;;;
Attendee;Chelsea L. Nikirk;nikirk@pdx.edu;15032097798;2024-03-26T21:03:55.545Z;STUDENT95;Portland State University;Employed - Graduate Student;https://www.linkedin.com/in/chelsea-l-nikirk/;;;;;;;;;
Staff;Geff Zamor;zamor@gmsmediaco.com;;2024-03-26T21:30:42.961Z;CREW24;GMS Media and Advertising;;NONE;;;;;;;;Registered by Jedd Chang of Smith & Jones innovation on behalf of crew member, Geff.;
Staff;Jonathan Gibson;jonathan.s.gibson@gmail.com;;2024-03-26T21:31:53.087Z;CREW24;CREW;CREW;NONE;;;;;;;;Registered by Jedd on behalf of crew member Jonathan.;
Staff;Gabriel Lawler;lawler@goodmorningsoldier.com;;2024-03-26T21:33:03.463Z;CREW24;GMS Media and Advertising;;None;;;;;;;;Registered by Jedd of Smith & Jones Innovation on behalf of crew member, Gabriel.;
Attendee;Penelope Harwood;pharwood@londonandpartners.com;;2024-03-26T21:38:05.879Z;LETSFLY70;London & Partners;SVP Business Development;https://www.linkedin.com/in/peharwood/;;;;;;;;;
Staff;Kaitlin Leonard;kaitlin.beauregard@techoregon.org;15204650737;2024-03-27T05:24:00.386Z;VOLUNTEER24;Technology Association of Oregon;Communications & PR Coordinator;https://www.linkedin.com/in/kaitlin-beauregard-leonard-a2b380130/;;;;;;;;Kaitlin has been officially registered as a volunteer for Wings by Jedd Chang of Smith & Jones Innovation using information they have provided and found on Linkedin.;
Attendee;Billy Afghan;billyafghan@geniiearth.com;15038843048;2024-03-27T08:26:01.369Z;LETSFLY70;Genii Earth;CEO;https://www.linkedin.com/in/billy-afghan-72831419/;;;;;;;;;
Attendee;Michael Tank;1dream2create@gmail.com;16502106596;2024-03-27T15:50:08.532Z;CC85;FFA;Western Regional Design | Install Manager;https://www.linkedin.com/in/mftank;;;;;;;;;
Sponsor;Sean Gestson;gesetson@up.edu;15039437361;2024-03-27T16:13:38.960Z;UPSHILEY24;University of Portland;Assistant Professor in Civil and Environmental Engineering;https://www.linkedin.com/in/seangestson/;;;;;;;;;
Attendee;Paul Kempler;pkempler@uoregon.edu;15413467652;2024-03-27T18:19:12.792Z;LETSFLY70;University of Oregon;Research Assistant Professor;https://www.linkedin.com/in/paulkempler/;;;;;;;;;
Attendee;Christian Emeodi;eemeodi@uoregon.edu;15416507895;2024-03-28T00:39:41.786Z;STUDENT95;University of Oregon;Grad Student;linkedin.com/in/christian-emeodi;;;;;;;;;
Attendee;Nicole Sagui;nsagui@uoregon.edu;15416509588;2024-03-28T00:43:13.735Z;STUDENT95;University of Oregon;PhD student;https://www.linkedin.com/in/nicoleasagui;;;;;;;;;
Staff;Elizabeth Asha Mackay;elizashamack@gmail.com;19712678205;2024-03-28T01:07:55.720Z;VOLUNTEER24;Volunteer;Volunteer;LinkedIn.com/in/elizabethashamackay;;;;;;;;;
Attendee;Jonathan Fink;jon.fink@pdx.edu;14802394594;2024-03-28T03:38:22.140Z;PSU75;Portland State University;Professor of Geology;https://www.linkedin.com/in/jonathanfink/;;;;;;;;;
Attendee;Michael Jung;michael.jung@icf.com;15033603881;2024-03-28T05:32:01.068Z;LETSFLY70;ICF Climate Center;Executive Director;http://linkedin.com/in/mikejung;;;;;;;;;
Attendee;Andrew Goldman;agol@uoregon.edu;19735909911;2024-03-28T16:23:14.391Z;STUDENT95;University of Oregon;Graduate Researcher;https://www.linkedin.com/in/andrew-carl-goldman/;;;;;;;;;
Sponsor;Dave Vernier;dvernier@vernier.com;15037017806;2024-03-29T21:57:49.091Z;VERNIER24;Vernier Science Education;President;NONE;;;;;;;;;
Attendee;Christy Chen;yingchieh05@gmail.com;15037935564;2024-04-01T01:18:13.388Z;LETSFLY70;N/A;N/A;https://www.linkedin.com/in/christy-ying-chieh-chen/;;;;;;;;;
Speaker;James Metoyer;james@advancedenergyinspections.com;;2024-04-01T01:35:38.611Z;SPEAKER;Executive Director;EnerCity Collaborative;https://www.linkedin.com/in/james-metoyer-iii-6452bb35/;;;;;;;;James has been officially registered as a speaker for Wings by Jedd Chang of Smith & Jones Innovation.;
Attendee;Thien-Kim Bui;thienkim.bui@gmail.com;15033587785;2024-04-01T14:21:37.417Z;STUDENT95;Portland State University;PhD student;https://www.linkedin.com/in/thien-kim-bui-81957555;;;;;;;;;
Attendee;Rita Haberman;rita.haberman@deq.oregon.gov;19713578660;2024-04-01T16:57:01.262Z;PROSPER75;Oregon Department of Environmental Quality;Natural Resource Specialist 4;https://www.linkedin.com/in/rita-haberman-05a33721/;;;;;;;;;
Attendee;Kim Allchurch Flick;mightyepiphyte@duck.com;15032000201;2024-04-01T19:04:01.901Z;CC85;Mighty Epiphyte Consulting;Founder - Impacts Coach;https://linkedin.com/company/mightyepiphyte;;;;;;;;;
Attendee;Louisa Mariki;louisam@traveloregon.com;15033479818;2024-04-01T22:56:55.139Z;COMPED;Travel Oregon;Stewardship Investments Manager;https://www.linkedin.com/in/louisa-mariki;;;;;;;;;
Attendee;Marianna Grossman;mgrossman@minervaventures.com;16505207003;2024-04-01T22:59:16.340Z;PROSPER75;Minerva Ventures;Founder and Managing Partner;mariannagrossman;;;;;;;;;
Attendee;Martin Lemke;mlemke@pdx.edu;;2024-04-02T02:21:36.916Z;STUDENT95;Portland State University;Assistant Trip Leader;www.linkedin.com/in/martin-lemke-63a323276;;;;;;;;;
Staff;Megan Murphy;megan@invest.green;19176903103;2024-04-02T05:20:09.350Z;VOLUNTEER24;Invest.Green;SVP, Investor Engagement & Business Development;www.linkedin.com/in/megankatemurphy;;;;;;;;;
Attendee;Edith Qurioz;equiroz@elprograma.org;15038164571;2024-04-02T16:12:27.819Z;LETSFLY70;El Programa Hispano Catolico;Executive Director;NONE;;;;;;;;;
Attendee;Morgan Garritson;garritsonm@gmail.com;19495104579;2024-04-02T16:24:45.462Z;COMPED;ImpactPDX;Director, ImpactPDX;https://www.linkedin.com/in/garritsonm/;;;;;;;;;
Attendee;Misha Franklin;misha.franklin.2023@gmail.com;15038079737;2024-04-02T16:41:39.742Z;CC85;;Aspiring Sustainability Professional;https://www.linkedin.com/in/mishajfranklin/;;;;;;;;;
Attendee;Estefani Reyes Moreno;estef3@pdx.edu;15033484365;2024-04-02T17:27:59.865Z;STUDENT95;Portland State University;Undergraduate Student (EE);https://www.linkedin.com/in/estefani-reyes-m/;;;;;;;;;
Attendee;Kirsten Midura;kirsten.midura@gmail.com;15039759018;2024-04-02T17:29:01.742Z;COMPED;GlobalPDX & Twende Solar;Board Director;https://www.linkedin.com/in/kirstenmidura/;;;;;;;;;
Attendee;Cyrus Wadia;cyrus.wadia@activate.org;;2024-04-02T18:29:28.683Z;DEEPDIVE24;Activate Global;CEO;https://www.linkedin.com/in/cyruswadia/;;;;;;;;;
Attendee;Katherine Gamblin;gamblin24@up.edu;15419744757;2024-04-02T19:35:07.079Z;STUDENT95;University of Portland;Undergraduate Student;https://www.linkedin.com/in/katherinegamblin/;;;;;;;;;
Sponsor;Jude Gabriel;gabriel23@up.edu;19073986703;2024-04-02T19:56:26.629Z;UPSHILEY24;University of Portland;Firmware Engineer;https://www.linkedin.com/in/jude-gabriel-/;;;;;;;;;
Attendee;Susana Rivera;rivera23@up.edu;19152416135;2024-04-02T20:10:37.244Z;STUDENT95;University of Portland;Student;linkedin.com/in/susana-g-rivera;;;;;;;;;
Attendee;Maya Struzak;struzak24@up.edu;14085335451;2024-04-02T20:11:02.177Z;STUDENT95;University of Portland;Student;www.linkedin.com/in/mayastruzak;;;;;;;;;
Attendee;Jennifer Miller;jennifertonimiller@gmail.com;15038584140;2024-04-02T21:23:33.412Z;COMPED;GlobalPDX;Private Contractor;https://www.linkedin.com/in/jennifertonimiller/;;;;;;;;;
Staff;Alex Wick;alex@cascadiacarbon.com;19147151770;2024-04-02T21:28:44.390Z;VOLUNTEER24;Cascadia Carbon Inc.;Master Forester;/in/alexwick;;;;;;;;;
Attendee;Andrew Fitzpatrick;jennifer.villarreal@portlandoregon.gov;15038238172;2024-04-02T22:24:25.258Z;FULLPRICE;City of Portland Oregon;Director of Economic Development;none;;;;;;;;;
Attendee;Kat Hunt;kat@earthfinance.com;17146790285;2024-04-02T22:48:41.905Z;DEEPDIVE24;Earth Finance;Sr Director, ClimateTech;https://www.linkedin.com/in/kat~hunt;;;;;;;;;
Staff;George Mihaly;george@storyfirm.com;;2024-04-03T00:38:05.834Z;CREW24;CREW;;;;;;;;;;;
Speaker;Dwayne Johnson;dwayne@oregonif.org;;2024-04-03T02:27:02.885Z;SPEAKER;Oregon Innovation Foundation;N/A;N/A;;;;;;;;Dwayne is being registered by Jedd Chang of Smith & Jones Innovation as a main stage participant helping at the Wings Conference. Thanks - Jedd;
Speaker;Ann Cudd;meeseon@pdx.edu;;2024-04-03T02:28:35.490Z;SPEAKER;Portland State University;President;N/A;;;;;;;;Ann is being registered by Jedd Chang of Smith & Jones Innovation as a main stage participant helping at the Wings Conference. Thanks - Jedd;
Speaker;Steve Eichenlaub;steve@portlandseedfund.com;;2024-04-03T02:29:46.790Z;SPEAKER;Portland Seed Fund;N/A;N/A;;;;;;;;Steve is being registered by Jedd Chang of Smith & Jones Innovation as a main stage participant helping at the Wings Conference. Thanks - Jedd;
Speaker;Katie Meeker;katie.meeker@portofportland.com;;2024-04-03T02:32:16.451Z;SPEAKER;Port of Portland;N/A;N/A;;;;;;;;Katie is being registered by Jedd Chang of Smith & Jones Innovation as a main stage participant helping at the Wings Conference. Thanks - Jedd;
Speaker;Alando Simpson;alando@cordr.com;;2024-04-03T03:17:35.060Z;SPEAKER;COR Disposal & Recyling;CEO;https://www.linkedin.com/in/alando-simpson-29570b16/;;;;;;;;Alando is being registered by Jedd Chang of Smith & Jones Innovation as a main stage speaker at the Wings Conference. Thanks - Jedd;
Speaker;Jacob Dunn;jacob.dunn@zgf.com;;2024-04-03T03:18:41.353Z;SPEAKER;ZGF Architects;Principal;https://www.linkedin.com/in/jacob-dunn-1347b925/;;;;;;;;Jacob is being registered by Jedd Chang of Smith & Jones Innovation as a main stage speaker at the Wings Conference. Thanks - Jedd;
Speaker;Ajay Malhotra;ajay.malhotra@cbre.com;;2024-04-03T03:18:41.353Z;SPEAKER;CBRE;Vice President, Advisory & Transaction Services;https://www.linkedin.com/in/malhotraajay/;;;;;;;;;
Sponsor;Wade Hopkins;wadeh@nesteamcoalition.org;;2024-04-03T03:18:41.353Z;SPONSOR;NE Steam Coalition;Director;https://www.linkedin.com/in/therealwadehopkins/;;;;;;;;Wade is being registered by Jedd Chang of Smith & Jones Innovation as a sponsor participant for the Wings Conference. Thanks - Jedd;
Staff;Skip Newberry;skip.newberry@techoregon.org;;2024-04-03T15:07:25.773Z;STEERING24;Technology Association of Oregon;President and CEO;https://www.linkedin.com/in/skipnewberry/;;;;;;;;;Indicates the last person on this list to have their namebadge printed in RD. 1
Attendee;Brittany Bagent;bagent@econw.com;13128986738;2024-04-03T17:42:20.066Z;CC85;ECOnorthwest;Project Director;https://www.linkedin.com/in/brittanybagent/;;;;;;;;;
Attendee;Greg Cermak;gc166475@gmail.com;13609019031;2024-04-03T17:48:44.588Z;FULLPRICE;USGS;Intern;NONE;Natural Capital Accounting and Ecosystem Service Valuation;;;;;;;;
Speaker;Andrea Marquez;andrea.marquez@portlandoregon.gov;15035048575;2024-04-03T18:06:39.875Z;SPEAKER;Multnomah Youth Commission;Director;https://www.linkedin.com/in/andrea-marquez-8202965b;;;;;;;;;
Attendee;Garrett Wong;garrett@meetgreen.com;16506781074;2024-04-03T19:55:55.054Z;COMPED;United States;Sustainable Event Specialist;https://www.linkedin.com/in/wonggarrett/;;;;;;;;;
Attendee;Amanda Caffall;amanda.caffall@gmail.com;13609071227;2024-04-03T20:10:39.313Z;JSI80;The Commons Law Center;Ready for a New Adventure;https://www.linkedin.com/in/amanda-caffall-596a2943/;;;;;;;;;
Attendee;Drew Lebowitz;drew@powerswitchus.com;15184668075;2024-04-03T20:46:28.042Z;LETSFLY70;PowerSwitch;Managing Director;https://www.linkedin.com/in/drew-lebowitz-3bbb6215/;;;;;;;;;
Attendee;Josh Hatch;josh.hatch@brightworks.net;19713408654;2024-04-03T20:51:30.043Z;CC85;Brightworks Sustainability;Partner;https://www.linkedin.com/in/1joshuahatch/;;;;;;;;;
Attendee;Julia Stenson;julia.stenson0@gmail.com;14154972491;2024-04-03T22:00:27.711Z;CC85;ENGIE Impact;Client Success, Decarbonization Platform;https://www.linkedin.com/in/julia-stenson-7a518213/;;;;;;;;;
Attendee;Marc Heisterkamp;marcheisterkamp@gmail.com;12023440417;2024-04-03T23:12:29.993Z;CC85;N/A;Job Seeker;https://www.linkedin.com/in/marcheisterkamp/;;;;;;;;;
Attendee;Curtis Young;curtis@theblueprintfoundation.org;19135227042;2024-04-04T00:00:58.345Z;BLUEPRINT85;The Blueprint Foundation;Executive Director;https://www.linkedin.com/in/curtis-young-0b34143a/;;;;;;;;;
Attendee;Katie Mangle;katiemangle@altago.com;15032303249;2024-04-04T00:01:23.674Z;PROSPER75;Alta Planning + Design;Principal;linkedin.com/in/katiemangle;;;;;;;;;
Attendee;Marnie Glickman;marnie.glickman@gmail.com;19715336162;2024-04-04T01:06:33.349Z;JSI80;Self;Candidate for PDX City Council;https://www.linkedin.com/in/marnieglickman/;;;;;;;;;
Attendee;Louka Moutarlier;loukajaymes@gmail.com;18312515086;2024-04-04T13:03:34.167Z;STUDENT95;University of Oregon;PhD Researcher;NONE;;;;;;;;;
Attendee;Ruma Awess;jedd+wingsregister1@smithandjonesinnovation.com;;2024-04-04T13:07:52.595Z;NESTEAM100;NE Steam Coalition;NONE;NONE;;;;;;;;Ruma is being registered by Jedd Chang of Smith & Jones Innovation as a youth participant from sponsor, NE Steam Coalition at the Wings Conference.;
Attendee;Caleb Kidivai;jedd+wingsregister2@smithandjonesinnovation.com;;2024-04-04T13:09:04.421Z;NESTEAM100;NE Steam Coalition;NONE;NONE;;;;;;;;Caleb is being registered by Jedd Chang of Smith & Jones Innovation as a youth participant from sponsor, NE Steam Coalition at the Wings Conference.;
Attendee;Ahmed Abalo;jedd+wingsregister3@smithandjonesinnovation.com;;2024-04-04T13:10:03.150Z;NESTEAM100;NE Steam Coalition;NONE;NONE;;;;;;;;Ahmed - is being registered by Jedd Chang of Smith & Jones Innovation as a youth participant from sponsor, NE Steam Coalition at the Wings Conference.;
Attendee;Jay Nyaminani;jedd+wingsregister4@smithandjonesinnovation.com;;2024-04-04T13:10:52.371Z;NESTEAM100;NE Steam Coalition;NONE;NONE;;;;;;;;Jay is being registered by Jedd Chang of Smith & Jones Innovation as a youth participant from sponsor, NE Steam Coalition at the Wings Conference.;
Attendee;Mazen Elsheikh;mazen@cairopdx.org;;2024-04-04T13:13:32.275Z;NESTEAM100;CAIRO;STEAM Education Coordinator;https://www.linkedin.com/in/mazen-elsheikh-88b13923b/;;;;;;;;Mazen is being registered by Jedd Chang of Smith & Jones Innovation as a guest of NE Steam Coalition at the Wings Conference.;
Attendee;Nandini;nandini@ceti.institute;;2024-04-04T13:15:12.577Z;NESTEAM100;CETI;Founder & President;https://www.linkedin.com/in/nandini-ranganathan/;;;;;;;;Nandini is being registered by Jedd Chang of Smith & Jones Innovation as a guest of NE Steam Coalition at the Wings Conference.;
Attendee;Yoseph Ukbazghi;yosephukbazghi@gmail.com;;2024-04-04T13:18:19.120Z;NESTEAM100;ASML;System Owner, EXE:5000;https://www.linkedin.com/in/yosephukbazghi/;;;;;;;;Yoseph is being registered by Jedd Chang of Smith & Jones Innovation as a guest of NE Steam Coalition at the Wings Conference.;
Attendee;Emily Maass;emily.maass@immixlaw.com;15038025540;2024-04-04T13:30:57.773Z;LETSFLY70;Immix Law;Attorney (Technology & Privacy);https://www.linkedin.com/in/emily-m-maass;;;;;;;;;
Attendee;Carmen Denison;carmen@oregoncampuscompact.org;15039270548;2024-04-04T13:45:13.480Z;LETSFLY70;Campus Compact of Oregon (Black Student Success Advisory);Executive Director;https://www.linkedin.com/feed/;;;;;;;;;
Attendee;Chris Smith;chris@chrissmith.us;15032233688;2024-04-04T15:46:14.008Z;TAOWINGS75;Portland Transport;Treasurer;https://www.linkedin.com/in/smith-chris/;;;;;;;;;
Attendee;Andrzej Kozlowski;andrzej@paragonphilanthropy.com;15102804837;2024-04-04T16:02:46.416Z;CC85;Paragon Philanthropy;Managing Director;https://www.linkedin.com/in/andrzej-kozlowski-56a58710/;;;;;;;;;
Attendee;Joseph Emerson;work@emer.so;15033671627;2024-04-04T16:21:40.469Z;JSI80;Portland Forward;Volunteer;NONE;;;;;;;;;
Attendee;Eliot Headley;eliot@ecolloyd.org;15303188075;2024-04-04T16:57:56.113Z;CC85;Lloyd EcoDistrict;Project manager;https://www.linkedin.com/in/eliot-headley-95a565145/;;;;;;;;;
Attendee;Lauren Zimmermann;lauren.zimmermann@portlandoregon.gov;12063275311;2024-04-04T17:30:55.126Z;DEEPDIVE24;United States;Sustainable Building and Deconstruction Specialist;https://www.linkedin.com/in/renzimm/;;;;;;;;;
Attendee;Amanda Ingmire;amanda.ingmire@deq.oregon.gov;15032295105;2024-04-04T17:57:56.336Z;PROSPER75;Oregon Department of Environmental Quality;Natural Resource Specialist 4;NONE;;;;;;;;;
Attendee;Al Miller;Last person on the list to receive the first mailing to attendees from CK;18604601260;2024-04-04T18:04:57.910Z;CC85;Pachama;Software Engineer;https://www.linkedin.com/in/al-miller;;;;;;;;;
Attendee;Benjamin Ariff;benjamin@straw-gold.com;15036833328;2024-04-04T18:06:30.285Z;TAOWINGS75;Straw to Gold;Creative Director;http://linkedin.com/in/benjaminariff/;;;;;;;;;
Attendee;Paul Weinert;paul@graybox.co;15035752485;2024-04-04T18:08:15.113Z;TAOWINGS75;GRAYBOX;Managing Principal;https://www.linkedin.com/in/paulweinert/;;;;;;;;;
Attendee;Thomas Baker;thomasb@oeconline.org;12065916035;2024-04-04T18:51:54.356Z;DEEPDIVE24;Oregon Environmental Council;Legislative Director;none;;;;;;;;;
Attendee;Thomas Doherty;clientcare@selfsustain.com;15032881213;2024-04-04T18:56:13.628Z;TAOWINGS75;United States;Psychologist;https://www.linkedin.com/in/tjdohertypsychology/;;;;;;;;This looks like an interesting conference. I'm a clinical and environmental psychologist who specializes in adaption and wellbeing in terms of climate change of environmental issues. See www.selfsustain.com and podcast www.climatechangeandhappiness.com.;
Attendee;Madeline O'Dwyer;madelinekodwyer@gmail.com;18478675554;2024-04-04T20:19:49.565Z;CC85;NA;Sustainability Analyst;https://www.linkedin.com/in/madeline-odwyer?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;;;;;;;;Really excited to learn more about what the Portland area is doing!;
Attendee;Jillian Schaffer;jillians@sgainc.com;15037034031;2024-04-04T20:32:34.913Z;TAOWINGS75;SGA;Account Manager;linkedin.com/jillianschaffer;;;;;;;;;
Attendee;Joshua Baker;joshua@ecolloyd.org;13152865594;2024-04-04T20:43:53.875Z;CC85;Lloyd EcoDistrict;Outreach Program Manager;www.linkedin.com/in/joshua-baker-292ba314;;;;;;;;;
Attendee;Jo Brickman;jo@enso-consult.com;15033134507;2024-04-04T21:48:26.608Z;COMPED;Enso Consulting;Principal;https://www.linkedin.com/in/jo-brickman/;;;;;;;;;
Attendee;Brooke Brownlee;brooke.brownlee@pgn.com;15035097321;2024-04-04T22:51:05.027Z;DEEPDIVE24;Portland General Eletric;Labor, Workforce, and Economic Prosperity Manager;https://www.linkedin.com/in/brooke-brownlee-5558313/;;;;;;Gluten free;No;;
Attendee;Amy Hall;amy@triplewinadvisory.com;15032875641;2024-04-04T23:47:08.021Z;STUDENT95;TripleWin Advisory;Sustainability Consultant;https://www.linkedin.com/in/amyshall/;;;;;;Mostly vegan, fully vegetarian;;;
Attendee;KB Mercer;comms@mcat-cliamte.org;16198905399;2024-04-04T23:55:08.966Z;MCAT75;MCAT;Communications;None;;;;;;Gluten free, vegetarian;None;Thank you, I am really looking froward to it!;
Attendee;Emily Leach;emily.leach@heritagebanknw.com;19714047596;2024-04-05T00:18:14.294Z;85,00 BEF;Heritage Bank;SVP & Commercial Banking Team Leader;://www.linkedin.com/in/emilykleach/;;;;;;no;no;I'm also a board member at Bonneville Environmental Foundation;
Attendee;Steve Corbató;corbato@linkoregon.org;15039983957;2024-04-05T00:18:28.467Z;TAOWINGS75;Link Oregon;Executive Director;https://www.linkedin.com/in/stevecorbato/;;;;;;Prefer vegetarian;None;Thanks for organizing this event!;
Attendee;Brad Buchholz;buchholz.brad@gmail.com;19712058071;2024-04-05T00:34:16.831Z;85,00 BEF;Heritage Bank;SVP;https://www.linked.com/in/brad-buchholz-69075916;;;;;;no;no;noon;
Attendee;Hale Forster;hale.forster@gmail.com;16462560188;2024-04-05T00:41:18.022Z;TAOWINGS75;Society for Environmental Population and Conservation Psychology;President;linkedin.com/in/haleforster/;;;;;;no;no;;
Attendee;Jeff Doolittle;jeff_doolittle@trimble.com;;2024-04-05T00:43:32.651Z;TAOWINGS75;Trimble;Senior Software Architect;https://www.linkedin.com/in/jeffdoolittle/;;;;;;none;none;;
Attendee;Akshay Gupta;akshay.gupta@asvitagroup.com;15033178768;2024-04-05T00:54:10.556Z;TAOWINGS75;Asvita Group;Founder and Managing Member;LinkedIn.com/in/akshay1611;;;;;;No hazelnuts;;;
Speaker;Joe Smith;joe@smithcompound.com;;2024-04-05T03:54:52.668Z;SPEAKER;N/A;N/A;N/A;;;;;;N/A;N/A;Joe has been registered by Jedd Chang of Smith & Jones Innovation.;
Attendee;Ben Burmeister;burmeister@berkeley.edu;;2024-04-05T15:24:11.269Z;CC85;Environmental Voter Project / Our Children's Trust;Environmental Political Organizing Intern / Events and Engagement Intern / Qualitative Analyst;https://www.linkedin.com/in/benburm/;;;;;;N/A;;Thanks for putting on such a wonderful event for the community!;
Attendee;James Lund;jlund@profocustechnology.com;15032362008;2024-04-05T15:30:12.882Z;TAOWINGS75;ProFocus Technology;President;https://www.linkedin.com/in/jamesdrakelund/;;;;;;No, but I prefer plant-based and unprocessed if possible.;No.;;
Sponsor;Jasmine Fullman;fullman@up.edu;15033605581;2024-04-05T21:49:38.465Z;UPSHILEY24;University of Portland;Associate Director;https://www.linkedin.com/in/jasmine-fullman-58043a231/;;;;;;NONE;NONE;;
Attendee;Jonathan Knapp;jonknapp@pdx.edu;15038014256;2024-04-05T23:27:58.955Z;STUDENT95;Portland State;Student;NONE;;;;;;NONE;;;
Attendee;Baofeng Dong;baofeng197@gmail.com;14433269593;2024-04-05T23:47:21.563Z;CC85;Myself;Senior Technical Program Manager;https://www.linkedin.com/in/baofengdong/;;;;;;None;None;Look forward to networking and learning amazing new tech applications for helping with climate and sustainability;
Staff;Maya von Geldern;maya@inkandtailor.com;;2024-04-06T02:48:43.981Z;CREW24;Smith & Jones Innovation;CREW;https://www.linkedin.com/in/maya-pueo-von-geldern-3319baa/;;;;;;N/A;N/A;Maya has been registered by Jedd Chang on behalf of Smith & Jones Innovation.;
Sponsor;Shashi Jain;shashi@portlandseedfund.com;;2024-04-06T02:59:03.133Z;PSF24;Portland Seed Fund;Principal;https://www.linkedin.com/in/skjain2/;;;;;;N/A;N/A;"Shashi has been registered by Jedd Chang of Smith & Jones Innovation on by request of Steve of Portland Seed Fund.
 

 Shashi - if you have any dietary restrictions or accessibility needs that you'd like to share with us, please email me at jedd@smithandjonesinnovation.com. Thanks! -Jedd";
Attendee;Jordana Barclay;jordana.barclay@biz.oregon.gov;;2024-04-06T03:00:28.835Z;PSF;Business Oregon;Innovation Strategist;https://www.linkedin.com/in/jordana-b-92a9ba1b/;;;;;;See note;See note;"Jordana has been registered by Jedd Chang of Smith & Jones Innovation on by request of Steve of Portland Seed Fund.
 

 Jordana- if you have any dietary restrictions or accessibility needs that you'd like to share with us, please email me at jedd@smithandjonesinnovation.com. Thanks! -Jedd";
Attendee;Thomas Manson;tsmanson@gmail.com;;2024-04-06T03:46:32.621Z;SJI85;None;None;None;;;;;;N/A;None;;
Attendee;Elizabeth Manson;elmanson@gmail.com;;2024-04-06T03:47:30.176Z;SJI85;None;None;None;;;;;;Vegetarian;None;;
Staff;Winfield Henry Jackson;winfieldhenryjackson@gmail.com;15039364573;2024-04-06T06:39:28.753Z;VOLUNTEER24;Portland Seed Fund;Donor;Www.linkedin.com/in/winfieldjackson;;;;;;None;None;;
Sponsor;Lisa K Bassett;bassettl@up.edu;15039010254;2024-04-06T11:54:48.364Z;UPSHILEY24;University of Portland;Operations Manager;N/A;;;;;;None;;;
Attendee;Üma Kleppinger;uma@alliedindependent.com;15038196953;2024-04-06T16:56:56.823Z;CC85;Allied Independent;Communications Strategist;HTTPS://www.LinkedIn.com/in/umakleppinger;;;;;;Gluten-free;;;
Attendee;Anne McHugh;akmchugh@gmail.com;15204409416;2024-04-06T21:52:22.862Z;COMPED;- None -;Climatebase Fellow;https://www.linkedin.com/in/anne-mchugh/;;;;;;I am vegetarian;seating;Thank you for working with me around attendance.;
Attendee;Dominique Alepin;dominique@alepinlaw.com;16507934318;2024-04-06T23:25:59.391Z;CC85;Alepin Law & Consulting;Owner;https://www.linkedin.com/in/dominique-alepin/;;;;;;No;No;;
Attendee;Brian Batchelder;brian@batchelder.org;15037097588;2024-04-07T01:36:33.039Z;LETSFLY70;N/A;Retired;https://www.linkedin.com/in/brian-batchelder/;;;;;;No;;;
Speaker;Mona Pearson;mona@pdx.edu;;2024-04-07T10:40:22.333Z;SPEAKER;Needs to be updated.;Needs to be updated.;Needs to be updated.;;;;;;Needs to be updated.;Needs to be updated.;Mona has been registered by Jedd Chang of Smith & Jones Innovation as a showcase speaker.;
Attendee;Kyle chipman;kylechipman@outlook.com;18476446885;2024-04-07T15:23:01.935Z;FULLPRICE;Chipman Design Architecture;Chief Process Officer;https://www.linkedin.com/in/kyle-chipman-57a429a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;;;;;;Gluten (celiac). Ingestion through cross contamination affects my cerebellum, so I’m really not fussed figuring out my own food. Thanks!;;;
Attendee;Martin Taylor;martintaylorpdx@gmail.com;15032004053;2024-04-07T19:54:23.289Z;JSI80;Taylor insights LLC;President;http://linkedin.com/in/martintaylorpdx;;;;;;No;None;;
Attendee;Jessica Vaughan;jessicajvaughan@gmail.com;12063219109;2024-04-07T20:36:52.889Z;CC85;N/A;N/A;https://www.linkedin.com/in/jessicavaughan/;;;;;;N/A;N/A;I am seeking to broaden my network, explore career opportunities, and deepen my understanding in the field of sustainability, following the completion of my Sustainability Graduate Certificate at Portland State University.;
Staff;Nursi Elahi;elahi@gmsmediaco.com;;2024-04-08T01:04:46.564Z;CREW24;N/A;N/A;N/A;;;;;;N/A;N/A;Nursi is being registered by Jedd Chang of Smith & Jones innovation as a crew member helping with photography. Nursi, please note you'll be able to update any of the information attached to your account later in the app. Thanks! -Jedd;
Attendee;James Ofsink;james@portlandforward.org;15039019032;2024-04-08T03:28:49.464Z;JSI80;Portland Forward;Board President;NONE;;;;;;vegan;;;
Attendee;Olubunmi Eleoramo;eleoramoolubunmi@gmail.com;16506654762;2024-04-08T05:28:18.648Z;TAOWINGS75;Not Applicable;Sustainability Analyst;http://linkedin.com/in/olubunmieleoramo;;;;;;;;;
Impact Partner;Willie Levenson;willie@humanaccessproject.com;15039366920;2024-04-08T13:56:40.957Z;PARTNER24;Human Access Project;Ringleader;NONE;No;;;;;;;;
Attendee;Bill Winett;bill.winett@gmail.com;15033511795;2024-04-08T15:48:48.974Z;STARTUPS80;self;IT Guy;https://www.linkedin.com/in/bwinett;vegetarian;;;;;;;;
Attendee;Nora Sluzas;nsluzas@gmail.com;12676264247;2024-04-08T18:46:43.665Z;TAOWINGS75;;;www.linkedin.com/in/norasluzas;None;None;;;;;;;
Attendee;Shreeya Kathuria;shreeyaverma@gmail.com;18184869800;2024-04-08T21:27:42.383Z;TAOWINGS75;-;Lead Data Scientist;https://www.linkedin.com/in/shreeyakathuria/;N/A;;;;;;;;
Attendee;Lily Herd;lily.herd@refed.org;15415105202;2024-04-08T22:44:45.939Z;CC85;ReFED;Capital, Innovation, and Engagement Manager;www.linkedin.com/in/lily-herd/;no meat, no fish, no gluten (eggs and dairy are okay);n/a;;;;;;;
Speaker;Mart Cenek;cenek@up.edu;15039437524;2024-04-09T00:01:46.960Z;SPEAKER;University of Portland;Associate Professor of Computer Science;www.linkedin.com/in/martin-cenek-12691427;No;No;;;;;;;
Sponsor;Karsten Zuendel;zuendel@up.edu;15034736419;2024-04-09T01:36:46.681Z;UPSHILEY24;University of Portland;Instructor of Mechanical Engineering;www.linkedin.com/in/karsten-zuendel-b633a91;none;none;;;;;;;
Attendee;Dave Barcos;dave.barcos@formos.com;13609801420;2024-04-09T02:09:01.277Z;APEXWINGS85;Formos;Director of Business Development;Http://www.linkedin.com/in/dbarcos;None;;;;;;;;
Attendee;Lauren Teague;lauren@fanwagn.com;19049239400;2024-04-09T16:13:01.306Z;STARTUPS80;FanWagn;Founder;http://www.linkedin.com/in/teaguelauren;Gluten Free / Celiac;No;Startup founder looking to connect with climate tech efforts across Oregon.;;;;;;
Attendee;Trenton DuVal;trentonduval@gmail.com;15103133465;2024-04-09T16:39:24.032Z;STARTUPS80;Self-Employed;Writer;https://www.linkedin.com/in/trentonduval/;Vegetarian, I eat dairy and eggs;;;;;;;;
Attendee;Shadia Duery;shadia.duery@pgn.com;15034678229;2024-04-09T17:23:33.379Z;FULLPRICE;Portland General Electric;Distribution System Plan Project Manager;https://www.linkedin.com/in/shadiaduery/;none;no;;;;;;;
Attendee;Mark McCaslin;mark.mccaslin@heritagebanknw.com;15038884563;2024-04-09T18:51:57.638Z;85,00 BEF;Heritage Bank;VP & Commercial Banking Officer;https://www.linkedin.com/in/mark-m-810ab05a?trk=people-guest_people_search-card;none;none;;;;;;;
Attendee;Sam Adams;sam@samadamspdx.com;15034218925;2024-04-09T20:15:03.951Z;ALDER75;SamAdamsPDX;Policy Advocate;https://www.linkedin.com/in/samadamspdx/;None;;;;;;;;
Attendee;Kenny Asher;kennya@tigard-or.gov;15037182443;2024-04-09T20:17:33.315Z;OSSIA85;City of Tigard;Community Development Director;https://www.linkedin.com/in/kenny-asher-58a60445/;no;no;;;;;;;
Sponsor;Brian C Fabien;fabien@up.edu;15039437292;2024-04-09T21:03:03.323Z;UPSHILEY24;university of portland - portland,or,usa;Dean, Shiley School of Engineering;NONE;NONE;NONE;;;;;;;
Attendee;Karen Nashiwa;nashiwa@tripleoakpower.com;19713582187;2024-04-09T21:36:05.917Z;ALDER75;Triple Oak Power;Deputy General Counsel;https://wwww.linkedin.com/in/karen-nashiwa-9b222b4/;No;No;;;;;;;
Attendee;Abdi Vicenciodelmoral;a.vicenciodelmoral@gmail.com;12102530488;2024-04-09T22:12:44.744Z;LETSFLY70;Independent;Machine Learning Specialist;https://www.linkedin.com/in/abdi-vicenciodelmoral/;N/A;N/A;;;;;;;
Attendee;Antonie Jetter;ajetter@pdx.edu;19712279317;2024-04-09T22:24:19.844Z;PROSPER75;Portland State University;Associate Dean for Research Maseeh College;https://www.linkedin.com/in/antonie-jetter-54bab02/;no;;;;;;;;
Attendee;Tara Dahl;tara@mytechworks.org;;2024-04-09T22:25:59.108Z;TAOWINGS75;Techworks;Executive Director;https://www.linkedin.com/in/tara-d-7636506b/;N/A;;;;;;;;
Attendee;Ty Phillippay;ty@get-benefits.com;;2024-04-09T22:27:57.988Z;TAOWINGS75;Techworks;Director of Business Development;https://www.linkedin.com/in/ty-phillippay/;N/A;;;;;;;;
Attendee;Mark Ehl;mark@get-benefits.com;;2024-04-09T22:29:23.793Z;TAOWINGS75;Techworks;Strategic Partner;https://www.linkedin.com/in/mark-ehl/;N/A;;;;;;;;
Attendee;Kyle Huck;kyle@kinesis.team;19288990289;2024-04-09T22:45:04.798Z;CC85;Kinesis;Strategist;https://www.linkedin.com/in/kyle-huck/;None;;;;;;;;
Attendee;Bruce Coleman;colemanb@sherwoodoregon.gov;15032179012;2024-04-09T22:46:41.922Z;GREATER75;City of Sherwood Economic Development;Economic Development Manager;www.sherwoodoregon.gov;None;No;;;;;;;
Staff;Suzanne Gauen;suzanne@batchelder.org;15038163254;2024-04-09T23:27:54.401Z;VOLUNTEER24;none;none;none (I have one but am retired);none;none;;;;;;;
Attendee;Iain Sterry;isterry@b-e-f.org;15035533920;2024-04-09T23:43:19.753Z;LETSFLY70;Bonneville Environmental Foundation;STEM Engagement and Training Manager, CE;https://www.linkedin.com/in/ian-sterry/;none;OR;;;;;;;
Attendee;Gail Chastain;gail8@pdx.edu;18438220435;2024-04-09T23:59:57.638Z;STUDENT95;PSU;MURP;https://www.linkedin.com/in/gail-chastain-623508ab/;no;no;This seems really cool and I'm glad my former classmate shared it with me! Shoutout to Jessica Vaughan!;;;;;;
Attendee;Madeleine Wolfe;chinookwa@gmail.com;13602818687;2024-04-10T00:39:34.814Z;LETSFLY70;Chinook River;None;None;gluten free;;;;;;;;
Attendee;Marta aller gutierrez;marta.aller.gutierrez@gmail.com;19712713961;2024-04-10T01:19:10.163Z;ALDER75;Wrise Portland Oregon;Marketing manager;linkedin.com/in/marta-aller-gutiérrez-513300125;No;No;;;;;;;
Attendee;Skylar Hall;skylar.hall@aimco-global.com;15037191012;2024-04-10T03:23:18.944Z;FULLPRICE;AcraDyne;VP of Marketing;https://www.linkedin.com/in/skylar-hall-a0640b50/;Dairy Free;;;;;;;;
Attendee;Susan Bladholm;susanb@traveloregon.com;15033192164;2024-04-10T04:19:13.383Z;LETSFLY70;Travel Oregon;Chief Administrative Officer;https://www.linkedin.com/in/susanbladholm;No;No;;;;;;;
Attendee;Kryn Sausedo;sausedo@econw.com;19176857245;2024-04-10T05:10:44.114Z;STARTUPS80;ECOnorthwest;Senior Project Manager;https://www.linkedin.com/in/kryn-sausedo-6b85773/;No;No;;;;;;;
Attendee;Kevin Kecskes;kecskesk@pdx.edu;15033581987;2024-04-10T06:03:46.507Z;PSU75;Portland State University;Department Chair & Professor, Public Administration;https://www.linkedin.com/in/kevin-kecskes-5575093/;none;;;;;;;;
Speaker;Kellen Moody;kel@alluviumgatherings.com;15033136160;2024-03-16T16:15:14.944Z;CC85;Alluvium Gatherings;Founder and Director;https://www.linkedin.com/in/kellen-moody-aa068239/;;;;;;;;;
Impact Partner;Andrew Harp;harp3@pdx.edu;;2024-04-10T06:17:58.902Z;PSUCE;please update during the Wings attendee app launch;please update during the Wings attendee app launch;please update during the app launch;see note below;see note below;Andrew is being registered by Jedd Chang of Smith & Jones Innovation in connection with our partnership with the PSUCE.;;;;;;
Impact Partner;Alaaeldin Eltayeb;eltayeb@pdx.edu;;2024-04-10T06:20:22.523Z;PSUCE;please update during the app launch;please update during the app launch;please update during the app launch;please see note below;please see note below;"Alaaeldin is being registered by Jedd Chang of Smith & Jones Innovation in connection with our partnership with the PSUCE. 
 

 Alaaeldin - if you have any dietary or accessibility needs, please let us know by emailing hello@wingsconference.com.";;;;;;
Impact Partner;Shane Pearson;shane@tandap.com;;2024-04-10T06:22:09.565Z;PSUCE;please update during the app launch;please update during the app launch;please update during the app launch;please see note below;please see note below;"Shane is being registered by Jedd Chang of Smith & Jones Innovation in connection with our partnership with the PSUCE. 
 

 Shane - if you have any dietary or accessibility needs, please let us know by emailing hello@wingsconference.com.";;;;;;
Impact Partner;Michael Van Sant;mvansant@pdx.edu;;2024-04-10T06:23:52.739Z;PSUCE;please update during the app launch;please update during the app launch;please update during the app launch;please see note below;please see note below;"Michael is being registered by Jedd Chang of Smith & Jones Innovation in connection with our partnership with the PSUCE. 
 

 Michael - if you have any dietary or accessibility needs, please let us know by emailing hello@wingsconference.com.";;;;;;
Impact Partner;Stacey Hoshimiya;shoshimi@pdx.edu;;2024-04-10T06:25:55.462Z;PSUCE;PSU Center for Entrepreneurship;please update during the app launch;please update during the app launch;please see note below;please see note below;"Stacey is being registered by Jedd Chang of Smith & Jones Innovation in connection with our partnership with the PSUCE. 
 

 Stacey - if you have any dietary or accessibility needs, please let us know by emailing hello@wingsconference.com.";;;;;;
Staff;Quadri Taiwo;quadri@pdx.edu;19715009545;2024-04-10T06:57:48.968Z;VOLUNTEER24;Portland State University;Research assistant;https://www.linkedin.com/in/taiwo123;Halal;None;N/A;;;;;;
Attendee;James Browning;james.browning@fminus.org;12159000869;2024-04-10T13:21:07.247Z;FULLPRICE;F Minus;Executive Director;https://www.linkedin.com/in/james-browning-292641a/;No;No;;;;;;;
Attendee;Michael Heavers;mheavers@mozilla.com;19173456634;2024-04-10T16:46:30.810Z;CC85;Mozilla;Staff Design Technologist;https://www.linkedin.com/in/heaversm/;Vegetarian;No;;;;;;;
Attendee;Adam Nashban;adam@nashbanconsulting.com;19172246584;2024-04-10T17:03:42.409Z;DEEPDIVE24;Oregon Business for Climate/Climate Solutions;Business Engagement Lead/Program Manager;https://www.linkedin.com/in/adam-nashban/;None;None;;;;;;;
Attendee;Kristin Covert;covertinpdx@gmail.com;19712211283;2024-04-10T17:17:21.948Z;CC85;12/30/1971;Product Manager;https://www.linkedin.com/in/kristincovert/;No gluten;;So excited;;;;;;
Attendee;Sandra Brahn;sandra.brahn@gmail.com;15038580504;2024-04-10T17:29:21.491Z;CC85;N/A;Corporate Development;https://www.linkedin.com/in/sandrabrahn?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app;Vegetarian;No;;;;;;;
Attendee;Kris Willingham;kwillin2@pdx.edu;12708604751;2024-04-10T17:43:38.208Z;STUDENT95;Portland State University;Grad Student;None;None;None;;;;;;;
Attendee;Kyrsten Schenck;kschenck00@ft.newyorklife.com;19712191882;2024-04-10T19:33:47.309Z;TAOWINGS75;Portland Pearl Rotary Club;Membership Chair;https://www.linkedin.com/feed/?midToken=AQFus_PVMP6Jsw&midSig=2g8dNc6GNEAbc1&trk=eml-email_career_insights_01-header-0-home_glimmer&trkEmail=eml-email_career_insights_01-header-0-home_glimmer-null-dxhwjg~lut1wgen~2t-null-null&eid=dxhwjg-lut1wgen-2t&otpToken=MWEwMTFjZTMxMDJjYzBjMGI0MjQwNGVkNDcxY2UwYjQ4OGM5ZDE0OTkwYWI4OTYxNzljNzA5Njg0NzVhNWJmMWY2ZGRkZmIwNTVmNWM0ZjM0ZmFiZjZlOGExY2FiZWQ5ZGM5NWYzNjE2NzlmNTZkZDc2NjhmOCwxLDE%3D;None;None;;;;;;;
Attendee;Bria Beale;bria@theblueprintfoundation.org;15033890877;2024-04-10T19:41:04.992Z;BLUEPRINT85;The Blueprint Foundation;Program Coordinator;none;no;;;;;;;;
Staff;Allisandra Stoiko;allisandrastoiko@gmail.com;19107773366;2024-04-10T20:11:56.048Z;VOLUNTEER24;RMI (Rocky Mountain Institute);Senior Associate;https://www.linkedin.com/in/allisandrastoiko/;Vegetarian (no meat/fish);N/A;Volunteering from 9-3 (confirmed with Jedd);;;;;;
Staff;Peter Yao;petermyao@gmail.com;13305100366;2024-04-10T20:15:20.113Z;VOLUNTEER24;Scripps Institution of Oceanography;Climate Data Scientist;linkedin.com/in/p-yao;Vegetarian;N/A;Volunteering 9am-3pm;;;;;;
Sponsor;Robert Schneider;robs@lemelson.org;12026602944;2024-04-10T20:31:41.300Z;LEMELSON24;The Lemelson Foundation;Executive Director;none;none;none;;;;;;;
Staff;Colin Tomkins-Bergh;colintomkinsbergh@gmail.com;17152207882;2024-03-18T18:47:50.227Z;VOLUNTEER24;South Pole;Senior Climate Solutions Manager;https://www.linkedin.com/in/colin-tomkins-bergh/;;;;;;;;Can't wait!;
Attendee;Audrey Desler;info@auddities.com;;2024-04-10T22:12:32.190Z;CC85;(self);Art/Creative Director;https://www.linkedin.com/in/audreydesler/;no fish, no red meat;Will you have any quiet rooms on site that neuro-divergent, autistic, and/or highly anxious people can use for reducing stimuli, calming, regrouping, etc.?;;;;;;;
Impact Partner;Adrian Leon;adrian.leon@freegeek.org;;2024-04-10T22:18:23.649Z;PARTNER24;Free Geek;please update in the event app (coming soon);please update in the event app (coming soon);please see note below;please see note below;"Adrian is being registered by Jedd Chang of Smith & Jones Innovation because of the Wings partnership with Free Geek. 
 

 Adrian - if you have any dietary or accessibility needs, please let us know by emailing hello@wingsconference.com.";;;;;;
Attendee;Eric Noll;eric.noll@pdx.edu;15033020099;2024-04-10T22:38:05.618Z;PSU75;Portland State University;Director of Regional Government Relations and Policy;https://www.linkedin.com/in/eric-noll-08b95aa3;N/A;N/A;;;;;;;
Attendee;Sash Catanzarite;sashcatanzarite@gmail.com;16199947393;2024-04-10T22:46:04.693Z;DEEPDIVE24;N/A;N/A;https://linkedin.com/in/thesash;Vegetarian;;;;;;;;
Attendee;Danny Schleien;daschleien@gmail.com;;2024-04-10T23:10:15.742Z;CCCOMMUNITY;Climate Curious :);Communications Lead;https://www.linkedin.com/in/danny-schleien/;No nuts please;No;;;;;;;
Attendee;Jason Busch;jbusch@pacificoceanenergy.org;15037292253;2024-04-10T23:11:50.725Z;POET85;Pacific Ocean Energy Trust;Executive Director;www.linkedin.com/in/jasonbusch;NOne;None;;;;;;;
Attendee;Ansley Guzynski;ansley.guzynski@clearesult.com;;2024-04-10T23:18:48.705Z;ALDER75;CLEAResult;Project Specialist;https://www.linkedin.com/in/ansley-guzynski-021181195/;No;;;;;;;;
Attendee;Deepthi Madhava;deepthi@oregonventurefund.com;19712827016;2024-04-11T00:06:06.033Z;VERTUELAB75;Oregon Venture Fund;Partner;https://www.linkedin.com/in/deepthi-madhava/;Vegetarian;;;;;;;;
Attendee;Rob Williams;rob.williams@panthalassa.com;;2024-04-11T00:13:10.218Z;PROSPER75;Panthalassa;Executive Vice President;https://www.linkedin.com/in/rob-williams-or/;n/a;;;;;;;;
Sponsor;Minh Bui;minh.bui@firsttechfed.com;;2024-04-11T00:29:00.599Z;FIRSTTECH24;First Tech Federal Credit Union;please update in the event app (coming soon);please update in the event app (coming soon);please see note (below);please see note (below);"Minh is being registered by Jedd Chang of Smith & Jones Innovation because of the Wings sponsorship with First Tech Federal Credit Union. 
 

 Minh - if you have any dietary or accessibility needs, please let us know by emailing hello@wingsconference.com.";;;;;;
Sponsor;Hashim Hunaidi;hashim.hunaidi@firsttechfed.com;;2024-04-11T00:30:08.920Z;FIRSTTECH24;First Tech Federal Credit Union;please update in the event app (coming soon);please update in the event app (coming soon);please see note (below);please see note (below);"Hashim is being registered by Jedd Chang of Smith & Jones Innovation because of the Wings sponsorship with First Tech Federal Credit Union. 
 

 Hashim - if you have any dietary or accessibility needs, please let us know by emailing hello@wingsconference.com.";;;;;;`
