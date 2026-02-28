import { and, db, eq, eventUserTable, userTable } from '@matterloop/db'

let eventId = '3b41ad8e-649e-42be-b9a4-e7b94dd98e74'

export async function loadUsers() {
  const eusers = await db.query.eventUserTable.findMany({
    where: and(eq(eventUserTable.eventId, eventId)),
  })
  if (eusers.length > 100) return
  const us = users.split('\n')
  return await Promise.all(us.map((u) => loadUser(u)))
}
export async function loadUser(line: string) {
  let [type, name, email, company, role, url] = line.replaceAll('"', '').split(',')
  console.log(line, name)
  const firstName = name.substring(0, name.indexOf(' ')).replace('&comma;', ',')
  const lastName = name.substring(name.indexOf(' ') + 1).replace('&comma;', ',')
  company = company.replace('&comma;', ',')
  role = role.replace('&comma;', ',')
  const types = {
    Team: 'staff',
    Attendee: 'attendee',
    'Impact Partner': 'impact-partner',
    Speaker: 'speaker',
    Sponsor: 'sponsor',
  }
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
          title: role,
          url,
          company,
        })
        .returning()
      if (inserted) {
        eventUser = inserted[0]
      }
    }
  }
}

const users = `Team,Michelle Jones,michelle@smithandjonesinnovation.com,Smith and Jones Innovation,Partner,https://www.linkedin.com/in/michelledjones1/
Team,Heejae Jeong,heejae@smithandjonesinnovation.com,Smith and Jones Innovation,Business Developer,https://www.linkedin.com/in/heejae-jeong/
Team,Katherine Krajnak,krajnakk@prosperportland.us,Prosper Portland,Green Cities Industry Liaison,https://www.linkedin.com/in/katherinekrajnak/
Team,Juan Barraza,juan.barraza@vertuelab.org,VertueLab,Director of Innvoation and Entrepreneurship,https://www.linkedin.com/in/barrazajuan/
Team,Elaine Hsieh,elaine.hsieh@techoregon.org,Technology Association of Oregon,Director of Community Engagement,https://www.linkedin.com/in/hsiehelaine/
Team,Topher Burns,topher@bivalve.co,Climate Curious,Cofounder,https://www.linkedin.com/in/topherburns/
Attendee,Kristin Leiber,kristin@ecolloyd.org,Lloyd EcoDistrict,Executive Director,https://www.linkedin.com/in/kristinleiber/
Attendee,Brian Clark,brian.clark@ecobadlandz.com,"Ecobadlandz&comma; Inc.",Co-founder & CEO,https://www.linkedin.com/in/brian-clark-ecobadlander-in-chief/
Attendee,Brian Ellin,brianellin@gmail.com,Tempo,CPO,https://www.linkedin.com/in/brianellin/
Attendee,Kristen Aramthanapon,karamtha@hotmail.com,NEEA,Product Manager,https://www.linkedin.com/in/kristen-aramthanapon-0bb41020
Attendee,Kayla Calkins,kayla@kaycalkins.com,Kay Calkins Consulting & Happy Mountain Kombucha,Fractional CMO,https://www.linkedin.com/in/kaycalkins/
Attendee,Nat West,natjwest@gmail.com,self,self,https://www.linkedin.com/in/reverendnat/
Attendee,Jason Trager,jason@plentiful.ai,Plentiful.ai,Founder,https://www.linkedin.com/in/sustainabilist/
Team,Spenser Meeks,spenser@apexpresentations.com,Apex Presentations,Principal,https://www.linkedin.com/in/spenser-meeks-apex/
Attendee,Nick Keenan,nick@gameflowinteractive.com,"Climate Curious&comma; Gameflow Interactive",CEO,https://www.linkedin.com/in/nick-keenan-9608548
Impact Partner,Ania Korsunska,ania@zemlia.co,Zemlia,Founder,https://www.linkedin.com/in/akorsunska/
Attendee,Ben Getson,ben.getson@gmail.com,.,Product Manager,https://www.linkedin.com/in/bengetson/
Attendee,Dave Peticolas,dave.peticolas@gmail.com,n/a,n/a,https://www.linkedin.com/in/davepeticolas/
Attendee,Ari Simmons,asimmons.professional@gmail.com,Oregon Clean Power Cooperative,Communications Manager,https://www.linkedin.com/in/arisimmons19/
Attendee,Aaron Arnoldy,aaron.arnoldy@gmail.com,Tideline & BlueMark,COO,https://www.linkedin.com/in/aaronarnoldy/
Attendee,Brennan Gantner,bgantner@skiptechnology.com,Skip Technology,CEO,https://www.linkedin.com/in/bgantner/
Attendee,Tong Tong Zhang,ttz@pdx.edu,Portland State University - MCECS,Assistant Dean,https://www.linkedin.com/in/tongtzhang/
Attendee,Margaret R. Smith,margaret@changemakercoach.co,Changemaker Coaching,Founder,www.linkedin.com/in/margaretrsmith/
Attendee,Jim Huston,jim@portlandseedfund.com,JH Climate Ventures,Partner,https://linkedin.com/in/jimhustonvc
Speaker,Marcelino Alvarez,marcelino@photonmarine.com,Photon Marine,CEO,https://www.linkedin.com/in/marcelino
Attendee,Suhasini Gavarshetty,suhasini.cg@gmail.com,Yahoo,Sr. Account Strategist,https://www.linkedin.com/in/suhasini-gavarshetty/
Speaker,Alicia Chapman,alicia.chapman@wtfllc.com,Willamette Technical Fabricators,Owner & CEO,https://www.linkedin.com/company/willamette-technical-fabricators-llc/
Attendee,Keith Chapman,keith.chapman@wtfllc.com,Willamette Technical Fabricators,President,https://www.linkedin.com/company/willamette-technical-fabricators-llc/
Sponsor,Anne Crispino-Taylor,crispino-taylora@prosperportland.us,Prosper Portland,Program Manager,NONE
Impact Partner,Andrew Desmond,andrew@orbusinesscouncil.org,Oregon Business Council,Economic Development Policy Director,https://www.linkedin.com/in/andrewldesmond/
Sponsor,Amanda Park,amanda.jean.park@gmail.com,Prosper Portland,Sr. Project Manager,https://www.linkedin.com/in/amandajeanpark/
Sponsor,Pamela Neal,nealp@prosperportland.us,Prosper Portland,"Manager&comma; Business Advancement",https://www.linkedin.com/in/pamelaneal/
Sponsor,Shea Flaherty Betin,flahertybetins@prosperportland.us,Prosper Portland,Economic Development Director,https://www.linkedin.com/in/shea-flaherty-betin-b5275568/
Sponsor,Anielis Raas Nebelecky,raasa@prosperportland.us,Prosper Portland,Project Manager-Affordable Commercial Tenanting,https://www.linkedin.com/in/anielis-r-785061a6
Sponsor,Ness Zolan,zolann@prosperportland.us,Prosper Portland,Project Manager,https://www.linkedin.com/in/nesszolan/
Speaker,Cynthia Carmina Gomez,gomezc@pdx.edu,Portland State University,"Director&comma; Community & Civic Impact",https://www.linkedin.com/in/cynthiacarminagomez/
Sponsor,Rachel Benton,bentonr@prosperportland.us,Prosper Portland,Grants Team,www.linkedin.com/in/ rachel-benton-7003
Attendee,Brian Boshes,boshes@ecobadlandz.com,Ecobadlandz,Cofounder,https://www.linkedin.com/in/brianboshes/
Attendee,Johan Kers,jkers@birchbiosciences.com,Birch Biosciences Inc.,Co-founder and CEO,https://www.linkedin.com/in/johankers/
Attendee,Debbie Silva,debbie.silva@evrazna.com,Evraz Oregon Steel Mills - Portland,Environmental Manager,www.linkedin.com/in/ debbie-deetz-silva-54994516
Attendee,Sunanda Chunder,sunanda.chunder@evrazna.com,EVRAZ Inc.,Environmental Engineer,www.linkedin.com/in/sunanda-chunder
Team,Jedd Chang,jedd@smithandjonesinnovation.com,Smith and Jones Innovation,Attendee Concierge,https://www.linkedin.com/in/jeddchang/
Team,Jeff Smith,jeffersonsmith@gmail.com,Smith and Jones Innovation,Partnera,egaega
Attendee,Morgan Pitts,morgan.pitts@essinc.com,ESS Inc.,"Director&comma; Corporate Communications",https://www.linkedin.com/in/morgan-pitts-7222a07
Speaker,Edward Benote Hill,edwardb@foodloopnw.com,FoodLoop Northwest,Co-Founder/Partner/FOTH Director,https://www.linkedin.com/in/eddie-benote-hill
Impact Partner,Nicole Miranda,nicole.miranda@portofportland.com,Swan Island Business Association,Secretary,NONE
Attendee,Ethan Knight,ethan@carpediemeducation.org,Carpe Diem Education,Executive Director,https://www.linkedin.com/in/ethan-knight-a0a642b
Attendee,Emi Day,emiday@gmail.com,Wind River,Senior User Experience Designer,https://www.linkedin.com/in/emiday/
Attendee,Nate Conroy,nate@raincatalysts.org,RAIN Catalysts,Rural Venture Catalyst,https://www.linkedin.com/in/nathanconroy/
Impact Partner,Tanya Hartnett,tanya.hartnett@workingwaterfrontportland.org,Working Waterfront Coalition,Executive Director,Tanyahartnett
Team,Wes Wages,wes@armosastudios.com,Armosa Studios,Storyteller,https://www.linkedin.com/in/weswages/
Speaker,Noel Kinder,noelkinder510@gmail.com,Nike,"Former CSO Nike&comma; Inc.",https://www.linkedin.com/in/noel-kinder-148b521b4/
Attendee,Ian Greenfield,igreenfield@me.com,YPrime,Chief Strategy Officer,https://www.linkedin.com/in/ianmgreenfield
Impact Partner,Bill Henry,b.henry@pacificoceanenergy.org,Pacific Ocean Energy Trust,Program Manager,https://www.linkedin.com/in/bill-henry-2b8b3616/
Impact Partner,David Kirshbaum,dk@vitalmessage.co,Vital Message,Founder and Principal,https://linkedin.com/in/davidkirshbaum
Attendee,Nicholas Day,daynicho@gmail.com,Arrow Carbon,CTO,https://www.linkedin.com/in/nicholas-upton-day/
Attendee,Alex DeNuzzo,adenuzzo@lclark.edu,Lewis & Clark College,Student,https://www.linkedin.com/in/alexdenuzzo/
Impact Partner,Martina Steinkusz,m.steinkusz@renewableh2.org,Renewable Hydrogen Alliance,Director of Market Development,https://www.linkedin.com/in/martina-steinkusz/
Impact Partner,Corky Collier,corky@columbiacorridor.org,Columbia Corridor Association,Executive Director,https://www.linkedin.com/in/corky-collier-49472310/
Impact Partner,Kristi DeGroat,kristi@oseia.org,Oregon Solar Storage Industry Indust,Development Director,https://www.linkedin.com/in/kristin-degroat-7a00b37/
Speaker,Joseph Bull,bull2@pdx.edu,Portland State College - Maseeh College of Engineering & Computer Science,H. Chik M. Erzurumlu Dean,https://www.linkedin.com/in/josephbullphd
Speaker,Tanya Barham,tanyab@communityenergylabs.com,"Community Energy Labs&comma; Inc.",Founder & CEO,https://www.linkedin.com/in/tanyabarham/
Attendee,Ozzie Gonzalez,ozzie@p3-associates.com,P3 Consulting,Owner + Founder,www.linkedin.com/in/ozziegonzalez
Impact Partner,Patti Brooke,patti@moonbeam.ai,Moonbeam,Managing Director,https://www.linkedin.com/in/pattibrooke/
Attendee,Aaron Weast,aaron@cruciblepd.com,Crucible Product Development,Principal,www.linkedin.com/in/aaron-weast
Impact Partner,Troy DeFrank,troy@moonbeam.ai,Moonbeam,"VP&comma; International Programs",https://www.linkedin.com/in/troydefrank/
Team,Patrick Prothe,patrickprothe@gmail.com,Design Buddha,Founder,https://www.linkedin.com/in/pprothe/
Attendee,Leah Plack,leah.plack@pdxstem.org,Portland Metro STEM Partnership,Project Coordinator,https://www.linkedin.com/in/leah-plack-aa568b14a/
Impact Partner,Jessica Carmona,jcarmona@b-e-f.org,Bonneville Environmental Foundation,Sr Program Manager,https://www.linkedin.com/in/jessica-carmona/
Attendee,Erin Fish,erin@gowanderwell.com,Wanderwell,CEO,https://www.linkedin.com/in/fisherin/
Impact Partner,Angela Borden Jackson,angela.jackson@pdx.edu,Portland State University / Powerize Northwest,Powerize NW CEO,https://www.linkedin.com/in/angelajackson/
Impact Partner,Gigi Harker-Olguin,gigi.olguin@greaterportlandinc.com,Greater Portland Inc,Business Development Manager,https://www.linkedin.com/in/gimena-gigi/
Attendee,Merry Ann Moore,merryannmoore@gmail.com,Moore Creative Strategies,Marketing consultant,https://www.linkedin.com/in/merryannmoore/
Attendee,Maggie Flanagan,maggief@lemelson.org,The Lemelson Foundation,Program Officer,https://www.linkedin.com/in/maggie-flanagan-6b5a2b25/
Team,Walter James,wmjames07@gmail.com,Power Japan Consulting,Principal Analyst,https://www.linkedin.com/in/wjames2/
Team,Melanie Adamson,melanie@alderagency.com,Alder & Co.,Partner & CEO,https://www.linkedin.com/in/melanieadamson/
Attendee,Justin Carven,juc421@g.harvard.edu,BEYOND Circular Solutions,Founder,https://www.linkedin.com/in/justin-carven-5b13983a/
Team,Michelle Chang,mcmeeshi@gmail.com,Intentional Travelers,Owner,https://www.linkedin.com/in/michelle-chang-411b2b16/
Team,Abby Schwalb,abby.schwalb@gmail.com,N/A,N/A,https://www.linkedin.com/in/abbyschwalb/
Attendee,David Worth,dave.worth@zakti.biz,Zakti,"Principal Avisor&comma; Founder",https://www.linkedin.com/in/daveworth/
Impact Partner,Abigail Van Gelder,a.vangelder@pdx.edu,PSU Center for Entrepreneurship,Director,https://www.linkedin.com/in/akrsouth/
Attendee,Kirk Ellis,iamkirkellis@gmail.com,St. Marys Academy,Faculty,NONE
Attendee,Tom Yeager,tom.yeager.tdy@gmail.com,Looking for Work,Software Engineer,https://www.linkedin.com/in/yeagertom/
Team,Linda Robertson,lr@lindarobertsonarts.com,Linda Robertson Arts,Owner,https://www.linkedin.com/in/1lindarobertson/
Team,Steve Harper,steve@indigodesignllc.com,Indigo Design LLC,Owner,NONE
Team,Hunter Loveridge,hunter@pixthis.com,Pix This,Ownder,NONE
Team,Sigfried Seeliger,seesigi@me.com,NONE,NONE,NONE
Team,Sara Beukers,sarabeukers@gmail.com,NONE,NONE,NONE
Team,Denise Ransome,denise@deniseransome.com,NONE,NONE,NONE
Attendee,Colleen Murray,colleen1murray2@gmail.com,Perkins & Co,Consultant,https://www.linkedin.com/in/colleenlmurray/
Impact Partner,Kayla Anderson,kayla@riparianmedia.com,Riparian Media,"Founder&comma; Creative Director",https://www.linkedin.com/in/kaylanderson/
Attendee,Ty Adams,tyadams@gmail.com,Leaven Community Center,Climate Team Member,https://www.linkedin.com/in/tykadams/
Attendee,Krista Reynolds,krista@engagingeverystudent.com,Engaging Every Student,Director of Educational Support and Research,https://www.linkedin.com/krista-reynolds-pdx
Impact Partner,Bianca Gonzalez,bianca@theblueprintfoundation.org,The Blueprint Foundation,Development and Communications Manager,https://www.linkedin.com/in/bianca-gonzalez-90a7b5196/
Attendee,Evan Ramsey,eramsey@b-e-f.org,Bonneville Environmental Foundation,Senior Director,https://www.linkedin.com/in/evan-ramsey-b01b1213/
Attendee,Javier Cobian,javier.cobian11@gmail.com,HDR Inc.,Electrical EIT,www.linkedin.com/in/javier-cobian
Attendee,Olivia Vulpin,opt@uoregon.edu,University of Oregon,PhD Candidate,https://www.linkedin.com/in/olivia-vulpin/
Speaker,Aina Abiodun,aina.abiodun@vertuelab.org,VertueLab,President & Executive Director,https://www.linkedin.com/in/ainaabiodun/
Team,Jane Comeault,janevthomson@hotmail.com,None,None,www.linkedin.com/in/jane-comeault-0373073
Attendee,Kristin Wolff,kristin_wolff@spra.com,Social Policy Research,Senior Associate,https://www.linkedin.com/in/kristinwolff?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app
Impact Partner,Rick Reynolds,rick@engagingeverystudent.com,Engaging Every Student / Engaging Press,Founder,https://www.linkedin.com/in/rick-reynolds-04b4668
Impact Partner,Anna Almonte,anna.almonte@energyally.com,Intact Energy Consulting,Founder & Managing Director,https://www.linkedin.com/in/annaalmonte/
Impact Partner,Lance,lance@bbaoregon.org,Black Business Association of Oregon,Executive Director,https://www.linkedin.com/in/lance-j-randall-a741b88/
Impact Partner,Marquita Jaramillo,marquita@bbaoregon.org,Black Business Association of Oregon,Business Retention & Expansion Director,https://www.linkedin.com/in/marquita-jaramillo/
Impact Partner,Nick Triska,nick.triska@greaterportlandinc.com,Greater Portland Inc,"Senior Manager&comma; Business Development",https://www.linkedin.com/in/nick-triska-6761241a/
Impact Partner,Mary Peveto,mary@neighborsforcleanair.org,Neighbors for Clean Air,Co-Director,None
Attendee,Christopher Butler,chris@evolvecollab.com,Evolve Collaborative,Co-Founder,https://www.linkedin.com/in/chrisbutlerlondon/
Attendee,Kellen Moody,kel@alluviumgatherings.com,Alluvium Gatherings,Founder and Director,https://www.linkedin.com/in/kellen-moody-aa068239/
Team,Gillian Wildfire,gillianwildfire@gmail.com,Volunteering,Na,https://www.linkedin.com/in/gillianwildfire?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app
Attendee,Kaya Kachigian,kayakachigian@gmail.com,N/A,Climate Tech,https://www.linkedin.com/in/kaya-kachigian
Attendee,Itanna Murphy,itanna.murphy@gmail.com,SHEBA,Founder,https://www.linkedin.com/in/itanna-murphy-pa-c-24086b142?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app
Attendee,Yosafe Murphy,yosafemurphyrt@gmail.com,SHEBA,Founder,https://www.linkedin.com/in/yosafe-murphy-918bb9183?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app
Attendee,Rachel Maas,rachel.maas@ccconcern.org,Central City Concern,Director of Climate Action,https://www.linkedin.com/in/rachel-maas-a7738616/
Attendee,Annie Murai,annie@measurepnw.com,United States,Partner,https://www.linkedin.com/in/annie-murai-sustainability/
Attendee,Colin Tomkins-Bergh,colintomkinsbergh@gmail.com,South Pole,Senior Climate Solutions Manager,https://www.linkedin.com/in/colin-tomkins-bergh/
Team,Laurie Ann (L.A.) Silberman,lasilberman@duck.com,N/A,Director of Unique Choices (LoL),https://www.linkedin.com/in/lasilberman
Attendee,Richard Tankersley,rtankers@pdx.edu,Portland State University - RGS,Vice President for Research & Graduate Studies,https://www.linkedin.com/in/richard-tankersley-2401a635
Attendee,Annie Lindgren,annie.lindgren@pdx.edu,Portland State University - RGS,Int. Associate VP for Research,https://www.linkedin.com/in/annie-lindgren-30656b15
Attendee,Erik M Gordon,egordon@percipiogroup.com,Percipio Consulting,Director,https://www.linkedin.com/in/erik-maximilian-gordon
Attendee,Mark Brady,mark.brady@biz.oregon.gov,Business Oregon,Innovation and Entrepreneurship Manager,https://www.linkedin.com/in/mark-brady-oregon
Attendee,Kelly Lyons,kelly@climbsmartstrategies.com,Climb Smart Strategies,Principal Consultant,https://www.linkedin.com/in/kelly-lyons-2713725a/
Attendee,Carmella West,carmella.m.west@gmail.com,"Carmella West Solutions&comma; LLC",Marketing Consultant,https://www.linkedin.com/in/carmellawest/
Attendee,Derron Coles,derron@drclearningsolutions.com,DRC Learning Solutions,Principal Consultant,NONE
Attendee,Dimitry Gershenson,dimitry@enduringplanet.com,Enduring Planet,CEO,https://linkedin.com/in/dgershenson
Attendee,Jess Kincaid,labonn@bpa.gov,Bonneville Power Administration,Director of Technology Innovation,NONE
Attendee,Liam Twight,liamt@uoregon.edu,University of Oregon,PhD Student,www.linkedin.com/in/liam-t-b178a0a3
Impact Partner,Dwindell Feeley,dwindell.feeley@freegeek.org,Free Geek,Manager of Business Development,https://www.linkedin.com/in/dwindell-feeley/
Impact Partner,"Juan Muro&comma; Jr.",j.muro@freegeek.org,Free Geek,Executive Director,https://www.linkedin.com/in/jmmurojr
Impact Partner,Amber Brink,amber.brink@freegeek.org,Free Geek,Director of Technology,https://www.linkedin.com/in/amber-brink-81b80557
Attendee,Ben Peterson,ben@think3thirds.com,United States,Head of Writing,https://www.linkedin.com/in/benpetersonpdx/
Attendee,David Tetrick,tanja.olson@oregonmetro.gov,Oregon Metro,Economic Development Planner,https://www.linkedin.com/in/david-t-125777121/
Attendee,Cassidy Moyer,casmoyer@pdx.edu,Portland State University,Student,linkedin.com/in/cassidy-moyer-210980225
Attendee,Kelson Redding,kredding@energy350.com,Energy Trust of Oregon,Industrial Outreach Manager,https://www.linkedin.com/in/kelson-redding-p-e-88120b48/
Attendee,Leon O. Wolf,leon.o.wolf@gmail.com,LEONWOLFCONSULTING,Principal,https://www.linkedin.com/in/leonwolf23
Attendee,Gunnar Vulpin,gunnar.knost@gmail.com,University of Oregon,Law Student,https://www.linkedin.com/in/gunnar-vulpin
Team,Julia Babcock,jjb@pdx.edu,PSU,Senior Project Manager,https://www.linkedin.com/in/juliajoanb
Speaker,Jocelyn Quarrell,jocelyn@boldreuse.com,Bold Reuse,CEO,https://www.linkedin.com/in/jocelyngaudiquarrell/
Speaker,Dexter Turner,dturner@opconnect.com,OpConnect,CEO,https://www.linkedin.com/in/dexterturner/
Speaker,Pat Crowley,pat@chapulfarms.com,Chapul Farms,CEO,https://www.linkedin.com/in/patrick-crowley-b43b131a/
Attendee,Sarah Strobl,sstrobl@pdx.edu,Portland State University,MBA Candidate,https://www.linkedin.com/in/sefstrobl/
Attendee,Sarah Brennan,sbren2@pdx.edu,Portland State University,Net Impact Chapter Co-President,https://www.linkedin.com/in/sarah-brennan-59211a133/
Attendee,Clark Brockman,clark@brockmanclimatestrategies.com,Brockman Climate Strategies LLC,Founder-Principal,https://www.linkedin.com/in/clark-brockman-83911b8/
Attendee,Daryl Lambert,dlambert@worksystems.org,"WORKSYSTEMS&comma; INC",Senior Project Manager - Clean Energy Sector Lead,www.linkedin.com/in/daryl-lambert-62395811
Attendee,Joseph Janda,janda@pdx.edu,Portland State University,Assistant Vice President for Innovation—Propel PSU,https://www.linkedin.com/in/joseph-janda-752a266/
Speaker,Keith Crossland,carbonegativesolutions@gmail.com,Carbon Negative Solutions,CEO/Co-Founder,https://www.linkedin.com/in/keith-crossland-022a0a26
Attendee,Ramsey McPhillips,ramseymcphillips@tainablelabs.com,Tainable Regenerative Agricultural Laboratory,Executive Director,tainablelabs@linkedin.com
Attendee,Eric King,eric.king@nike.com,Nike,"Director&comma; Sustainable Innovation",https://www.linkedin.com/in/eric-m-king/
Attendee,Daniel Ricardo Saa Zaniefski,dsaa@centrocultural.org,Centro Cultural,Grants Manager,https://www.linkedin.com/in/danielsaazaniefski-ri/
Attendee,Charles Letherwood,charles@tomdwyer.com,Tom Dwyer Automotive Services,Outreach Advisor,NONE
Attendee,Len Harris,lenwealth@icloud.com,Radical Ventures Group,Project Supervisor,None
Attendee,Amber Peoples,amber@earthrelationship.com,Earth Archetypes,Chief Relationship Officer,https://www.linkedin.com/in/ambermpeoples/
Team,Ashley Kmiecik,ashley.kmiecik@techoregon.org,Technology Association of Oregon,Director of Sponsorship & Events,https://www.linkedin.com/in/ashley-kmiecik/
Team,Becca Baugh,becca.baugh@techoregon.org,Technology Association of Oregon,Finance and Operations Manager,https://www.linkedin.com/in/rebecca-baugh-88a0a121a/
Attendee,Robert Bass,robert.bass@pdx.edu,Portland State Univesity,Professor,https://www.linkedin.com/in/robert-bass-993b0514/
Attendee,Abby Chroman,achroman@pdx.edu,Portland State University,Student,None
Attendee,Chelsea L. Nikirk,nikirk@pdx.edu,Portland State University,Employed - Graduate Student,https://www.linkedin.com/in/chelsea-l-nikirk/
Team,Geff Zamor,zamor@gmsmediaco.com,GMS Media and Advertising,,NONE
Team,Jonathan Gibson,jonathan.s.gibson@gmail.com,CREW,CREW,NONE
Team,Gabriel Lawler,lawler@goodmorningsoldier.com,GMS Media and Advertising,,None
Attendee,Penelope Harwood,pharwood@londonandpartners.com,London & Partners,SVP Business Development,https://www.linkedin.com/in/peharwood/
Team,Kaitlin Leonard,kaitlin.beauregard@techoregon.org,Technology Association of Oregon,Communications & PR Coordinator,https://www.linkedin.com/in/kaitlin-beauregard-leonard-a2b380130/
Attendee,Billy Afghan,billyafghan@geniiearth.com,Genii Earth,CEO,https://www.linkedin.com/in/billy-afghan-72831419/
Attendee,Michael Tank,1dream2create@gmail.com,FFA,Western Regional Design | Install Manager,https://www.linkedin.com/in/mftank
Sponsor,Sean Gestson,gesetson@up.edu,University of Portland,Assistant Professor in Civil and Environmental Engineering,https://www.linkedin.com/in/seangestson/
Attendee,Paul Kempler,pkempler@uoregon.edu,United States,Research Assistant Professor,https://www.linkedin.com/in/paulkempler/
Attendee,Christian Emeodi,eemeodi@uoregon.edu,University of Oregon,Grad Student,linkedin.com/in/christian-emeodi
Attendee,Nicole Sagui,nsagui@uoregon.edu,University of Oregon,PhD student,https://www.linkedin.com/in/nicoleasagui
Attendee,Elizabeth Asha Mackay,elizashamack@gmail.com,Volunteer,Volunteer,LinkedIn.com/in/elizabethashamackay
Attendee,Jonathan Fink,jon.fink@pdx.edu,Portland State University,Professor of Geology,https://www.linkedin.com/in/jonathanfink/
Attendee,Michael Jung,michael.jung@icf.com,ICF Climate Center,Executive Director,http://linkedin.com/in/mikejung
Attendee,Andrew Goldman,agol@uoregon.edu,University of Oregon,Graduate Researcher,https://www.linkedin.com/in/andrew-carl-goldman/
Sponsor,Dave Vernier,dvernier@vernier.com,Vernier Science Education,President,NONE
Attendee,Christy Chen,yingchieh05@gmail.com,N/A,N/A,https://www.linkedin.com/in/christy-ying-chieh-chen/
Speaker,James Metoyer,james@advancedenergyinspections.com,Executive Director,EnerCity Collaborative,https://www.linkedin.com/in/james-metoyer-iii-6452bb35/
Attendee,Thien-Kim Bui,thienkim.bui@gmail.com,Portland State University,PhD student,https://www.linkedin.com/in/thien-kim-bui-81957555
Sponsor,Rita Haberman,rita.haberman@deq.oregon.gov,Oregon Department of Environmental Quality,Natural Resource Specialist 4,https://www.linkedin.com/in/rita-haberman-05a33721/
Attendee,Kim Allchurch Flick,mightyepiphyte@duck.com,Mighty Epiphyte Consulting,Founder - Impacts Coach,https://linkedin.com/company/mightyepiphyte`
