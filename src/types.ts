export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  timestamp: number;
  user?: User;
}
