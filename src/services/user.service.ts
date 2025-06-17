import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
}

export class UserService {
  private users: Map<string, User> = new Map();

  createUser(name: string, email: string): User {
    console.log('Creating new user:', name, email);
    const user: User = {
      id: uuidv4(),
      name,
      email
    };
    
    this.users.set(user.id, user);
    console.log('New user created:', user);
    return user;
  }

  getUserById(id: string): User | null {
    console.log('Getting user by ID:', id);
    const user = this.users.get(id) || null;
    console.log('User found:', user);
    return user;
  }
}