export interface CurrentUserResponse {
  user: CurrentUserInterface;
}

export interface CurrentUserInterface {
  id: number;
  username: string;
  email: string;
  role: string;
  image: string | null;
  token: string;
}
