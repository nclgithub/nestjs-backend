import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { AccountService } from '../account/account.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private jwtService: JwtService,
        private readonly accountService: AccountService,
    ) { }

    async login(email: string, password: string) {
        const user = await this.accountService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const accessToken = this.generateAccessToken(user.id);
        const refreshToken = this.generateRefreshToken(user.id);

        await this.updateRefreshToken(user.id, refreshToken);

        // Never expose password hash or refresh_token to the client
        const { password: _pw, refresh_token: _rt, ...safeUser } = user;

        return { user: safeUser, accessToken, refreshToken };
    }

    async loginWithGoogle(idToken: string) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const client = new OAuth2Client(clientId);

        let payload: any;
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: clientId,
            });
            payload = ticket.getPayload();
        } catch {
            throw new UnauthorizedException('Invalid Google token');
        }

        if (!payload?.email) {
            throw new UnauthorizedException('Google token missing email');
        }

        const { email, name, picture } = payload;

        const user = await this.accountService.findOrCreateGoogleAccount({
            email,
            name: name ?? email,
            profile_image: picture ?? '',
        });

        if (!user) throw new UnauthorizedException('Failed to create account');

        const accessToken = this.generateAccessToken(user.id);
        const refreshToken = this.generateRefreshToken(user.id);
        await this.updateRefreshToken(user.id, refreshToken);

        const { password: _pw, refresh_token: _rt, ...safeUser } = user;
        return { user: safeUser, accessToken, refreshToken };
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });

            const user = await this.accountService.findById(payload.sub);

            if (!user) throw new UnauthorizedException('User not found');

            const isMatch = await bcrypt.compare(refreshToken, user.refresh_token);
            if (!isMatch) throw new UnauthorizedException('Refresh token mismatch');

            const newAccessToken = this.generateAccessToken(user.id);
            const newRefreshToken = this.generateRefreshToken(user.id);

            await this.updateRefreshToken(user.id, newRefreshToken);

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        } catch (err) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(userId: string) {
        const { error } = await this.supabaseService
            .getClient()
            .from('account')
            .update({
                refresh_token: null,
            })
            .eq('id', userId);

        if (error) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return { message: 'Logged out' };
    }

    generateAccessToken(userId: string) {
        return this.jwtService.sign(
            { sub: userId },
            { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
        );
    }

    generateRefreshToken(userId: string) {
        return this.jwtService.sign(
            { sub: userId },
            { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '30d' },
        );
    }

    async updateRefreshToken(userId: string, refreshTokenPlain: string) {
        const hashed = await bcrypt.hash(refreshTokenPlain, 10);
        const { error } = await this.supabaseService
            .getClient()
            .from('account')
            .update({ refresh_token: hashed })
            .eq('id', userId);

        if (error) throw new Error(error.message);
    }
}
