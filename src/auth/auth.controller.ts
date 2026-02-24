import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(
        @Body() body: { email: string; password: string },
    ) {
        return this.authService.login(body.email, body.password);
    }

    @Post('refresh')
    async refresh(@Body() body: { refreshToken: string }) {
        if (!body.refreshToken) {
            throw new UnauthorizedException('Refresh token required');
        }

        return this.authService.refreshToken(body.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@Req() req) {
        const userId = req.user.userId;
        return this.authService.logout(userId);
    }
}
