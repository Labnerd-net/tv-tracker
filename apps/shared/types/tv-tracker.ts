export type Role = "user" | "admin";

export interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationData extends Credentials {
  displayName: string;
}

export interface RegistrationFormData extends RegistrationData {
  confirmPassword: string;
}

export interface JwtData {
  sub: number;
  email: string;
  displayName: string;
  roles: Role[];
  exp: number;
}

export interface ProfileData {
  userId: number;
  email: string;
  displayName: string;
  roles: Role[];
}

export interface UserData extends ProfileData {
  passwordHash: string;
}

export interface UserDbData extends UserData {
  createdAt: Date;
}

export interface ShowData {
  showId: number;
  userId: number;
  title: string;
  tvMazeId: number;
  platform: string | null;
  status: string | null;
  scheduleDay: string | null;
  scheduleTime: string | null;
  prevEpisode: string | null;
  nextEpisode: string | null;
  imageLink: string | null;
}

export type TvShows = ShowData[]
