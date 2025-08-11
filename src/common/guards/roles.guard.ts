import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, ADMIN_ONLY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check for admin only access
    const isAdminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check for specific roles
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !isAdminOnly) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    if (isAdminOnly) {
      return user.role === 'ADMIN';
    }

    if (requiredRoles) {
      return requiredRoles.some((role) => user.role === role);
    }

    return true;
  }
}
