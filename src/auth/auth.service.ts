import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(): { access_token: string; token_type: string } {
    // Simple token generation - no user management needed
    const payload = {
      sub: 'api-client', // Simple identifier
      type: 'api-access', // Token type
      permissions: ['read', 'write', 'delete'], // All permissions
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      token_type: 'Bearer',
    };
  }

  validateToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  validateUser(payload: any): any {
    // Simple validation - just return the payload
    // No database lookup needed since we don't manage users
    return {
      userId: payload.sub,
      type: payload.type,
      permissions: payload.permissions,
    };
  }
}
