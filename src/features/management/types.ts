import { Profile } from '@/types/domain';

export type Employee = Pick<Profile, 'id' | 'name' | 'email' | 'active'>;

export type CreateEmployeeInput = {
  name: string;
  email: string;
  password: string;
};
