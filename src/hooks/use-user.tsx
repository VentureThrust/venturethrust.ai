'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  name: string;
  firstName: string;
  email: string;
  avatarUrl: string;
}

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// A mock user object. In a real app, this would come from an authentication provider.
const defaultUser: User = {
  name: '',
  firstName: '',
  email: '',
  avatarUrl: 'https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc2ODAwOTA4MHww&ixlib=rb-4.1.0&q=80&w=1080',
};


export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
