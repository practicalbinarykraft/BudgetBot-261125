/**
 * User test fixtures
 */

export interface MockUser {
  id: number;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
}

export const mockUser: MockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: '$2a$10$hashedpassword',
  createdAt: new Date('2024-01-01'),
};

export const mockUsers: MockUser[] = [
  mockUser,
  {
    id: 2,
    email: 'admin@example.com',
    name: 'Admin User',
    password: '$2a$10$adminhashedpw',
    createdAt: new Date('2024-01-02'),
  },
];

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    ...mockUser,
    id: Math.floor(Math.random() * 10000),
    ...overrides,
  };
}
