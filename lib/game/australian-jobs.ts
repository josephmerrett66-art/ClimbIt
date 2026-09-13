import { makeClimb, type ClimbSpec } from './campaign';
import routes from './australian-routes.json';

// Route coordinates are authored against the new scene PNGs (1600 × 1000).
export const AUSTRALIAN_SPECS: Omit<
  ClimbSpec,
  'route' | 'target' | 'braces'
>[] = [
  {
    slug: 'prawn',
    id: 'big-prawn-thong',
    href: '/prawn',
    name: 'De-thong the Big Prawn',
    client: 'Kev · North Coast, NSW',
    pay: 220,
    briefing:
      'Kev tried to prove he could throw a thong over the prawn. The prawn won. Work around the kiosk and up the sculpture.',
    success: 'Thong recovered. Kev has been banned from demonstrating things.',
  },
  {
    slug: 'surf-club',
    id: 'surf-croc',
    href: '/surf-club',
    name: 'A croc above the surf club',
    client: 'Shaz · Sunshine Coast, QLD',
    pay: 240,
    briefing:
      'The inflatable croc escaped the sausage sizzle. Follow the verandah gutters and work around the roof to its tether.',
    success: 'Croc secured. The sausage sizzle can resume.',
  },
  {
    slug: 'drive-in',
    id: 'drive-in-trolley',
    href: '/drive-in',
    name: 'Trolley at the drive-in',
    client: 'Dazza · Riverina, NSW',
    pay: 280,
    briefing:
      'Nobody knows how the trolley got up there. Cross the rear frame and climb the diagonal braces to secure it.',
    success: 'Trolley secured. The mystery remains unsolved.',
  },
  {
    slug: 'queenslander',
    id: 'summer-santa',
    href: '/queenslander',
    name: 'Santa has heatstroke',
    client: 'Deb · Ipswich, QLD',
    pay: 250,
    briefing:
      'It is February. Deb wants her inflatable Santa down. Traverse the verandahs and work around the roofline to the tie-down.',
    success: 'Santa secured for removal. Christmas is officially over.',
  },
  {
    slug: 'railway',
    id: 'signal-esky',
    href: '/railway',
    name: 'Last drinks at platform two',
    client: 'Macca · Mallee, VIC',
    pay: 290,
    briefing:
      'The station esky has made an unscheduled departure. Follow the awnings and signal frame to secure its handle.',
    success: 'Esky secured. The ice was a lost cause.',
  },
  {
    slug: 'showground',
    id: 'golden-bin-chicken',
    href: '/showground',
    name: 'Crown the bin chicken',
    client: 'Baz · Regional show, SA',
    pay: 310,
    briefing:
      'The golden ibis needs a final tightening before judging. Work around the fairground frame to its mounting bolt.',
    success: 'Bin chicken secured. A proud day for Australian art.',
  },
  {
    slug: 'opal-mine',
    id: 'opal-disco',
    href: '/opal-mine',
    name: 'Disco at the opal mine',
    client: 'Nev · Coober Pedy, SA',
    pay: 340,
    briefing:
      'Nev has confused mining equipment with a dance floor. Traverse the timber gantry and secure the disco-ball hanger.',
    success: 'Disco ball secured. Nev is calling it an underground movement.',
  },
  {
    slug: 'grandstand',
    id: 'prize-pumpkin',
    href: '/grandstand',
    name: 'The pumpkin has won',
    client: 'Cheryl · Country show, TAS',
    pay: 360,
    briefing:
      'The prize pumpkin is now heavier than the announcer booth. Follow the stepped grandstand roof and secure its restraint.',
    success:
      'Pumpkin secured. Cheryl is entering it in the heavyweight division.',
  },
];
export const AUSTRALIAN_JOBS = AUSTRALIAN_SPECS.map((spec) =>
  makeClimb({
    ...spec,
    ...(
      routes as unknown as Record<
        string,
        Pick<ClimbSpec, 'route' | 'target' | 'braces'>
      >
    )[spec.slug],
  }),
);
