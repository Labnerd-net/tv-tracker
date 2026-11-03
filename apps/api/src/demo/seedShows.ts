// Static snapshot of popular shows used to seed ephemeral demo users.
// Episode dates are intentionally empty here; they are refreshed from TVMaze
// right after the demo user is created (see refreshDemoShows).
export const DEMO_EMAIL_DOMAIN = 'demo.invalid';
export const DEMO_DISPLAY_NAME = 'Demo Guest';
export const MAX_DEMO_USERS = 200;
export const DEMO_TTL_MS = 24 * 60 * 60 * 1000;
// Max time the demo route waits for the TVMaze refresh before responding with the snapshot.
export const DEMO_REFRESH_WAIT_MS = 3000;

export type SeedShow = {
  title: string;
  tvMazeId: number;
  platform: string;
  status: string;
  scheduleDay: string[];
  scheduleTime: string;
  imageLink: string;
};

export const SEED_SHOWS: SeedShow[] = [
  { title: 'Severance', tvMazeId: 44933, platform: 'Apple TV', status: 'Running', scheduleDay: ['Friday'], scheduleTime: '', imageLink: 'https://static.tvmaze.com/uploads/images/medium_portrait/548/1371406.jpg' },
  { title: 'The Bear', tvMazeId: 54198, platform: 'Hulu', status: 'Ended', scheduleDay: [], scheduleTime: '', imageLink: 'https://static.tvmaze.com/uploads/images/medium_portrait/629/1574642.jpg' },
  { title: 'Andor', tvMazeId: 52341, platform: 'Disney+', status: 'Ended', scheduleDay: ['Tuesday'], scheduleTime: '', imageLink: 'https://static.tvmaze.com/uploads/images/medium_portrait/564/1411766.jpg' },
  { title: 'Slow Horses', tvMazeId: 45039, platform: 'Apple TV', status: 'Running', scheduleDay: ['Wednesday'], scheduleTime: '', imageLink: 'https://static.tvmaze.com/uploads/images/medium_portrait/641/1604425.jpg' },
  { title: 'The Pitt', tvMazeId: 75632, platform: 'HBO Max', status: 'Running', scheduleDay: ['Thursday'], scheduleTime: '', imageLink: 'https://static.tvmaze.com/uploads/images/medium_portrait/606/1516776.jpg' },
  { title: 'Abbott Elementary', tvMazeId: 55350, platform: 'ABC', status: 'Running', scheduleDay: ['Wednesday'], scheduleTime: '20:30', imageLink: 'https://static.tvmaze.com/uploads/images/medium_portrait/644/1611887.jpg' },
  { title: 'Only Murders in the Building', tvMazeId: 48830, platform: 'Hulu', status: 'Running', scheduleDay: ['Tuesday'], scheduleTime: '', imageLink: 'https://static.tvmaze.com/uploads/images/medium_portrait/586/1466415.jpg' },
];
