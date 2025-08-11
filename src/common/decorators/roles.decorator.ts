import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const ADMIN_ONLY = 'ADMIN_ONLY';
export const AdminOnly = () => SetMetadata(ADMIN_ONLY, true);
