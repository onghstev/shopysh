import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      role: string;
      firstName: string;
      lastName: string;
      tenantName: string;
      tenantCurrency: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    role: string;
    firstName: string;
    lastName: string;
    tenantName: string;
    tenantCurrency: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    tenantId: string;
    role: string;
    firstName: string;
    lastName: string;
    tenantName: string;
    tenantCurrency: string;
  }
}
