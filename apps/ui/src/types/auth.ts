export interface UserData {
  userID: string,
  name: string,
  email: string,
  isAdmin: boolean,
}

export interface Credentials {
  email: string, 
  password: string
}

export interface AuthProps {
  token: string,
  user: UserData | null,
  login: (credentials: Credentials) => Promise<UserData>,
  logout: () => void,
  isAuthenticated: boolean,
}
