import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err, user, info) {
        // If there is an explicit error (e.g. token expired/invalid), throw it so the client can refresh.
        // `info` is populated by passport-jwt when the token is missing or invalid.
        // If the token is simply missing, `info.message` is typically 'No auth token'.
        if (err || (info && info.message !== 'No auth token')) {
            throw err || new UnauthorizedException(info?.message || 'Unauthorized');
        }

        // Return user if present, otherwise return null
        return user || null;
    }
}
