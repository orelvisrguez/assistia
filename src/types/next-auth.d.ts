import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: 'admin' | 'professor' | 'student';
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'professor' | 'student';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'professor' | 'student';
  }
}
