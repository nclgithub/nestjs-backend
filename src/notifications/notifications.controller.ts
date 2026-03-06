import { Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getNotifications(@Req() req) {
        const userId = req.user.userId;
        return this.notificationsService.getNotifications(userId);
    }

    @Get('me/unread-count')
    @UseGuards(JwtAuthGuard)
    async getUnreadCount(@Req() req) {
        const userId = req.user.userId;
        return this.notificationsService.getUnreadCount(userId);
    }

    @Patch('me/read-all')
    @UseGuards(JwtAuthGuard)
    async markAllRead(@Req() req) {
        const userId = req.user.userId;
        return this.notificationsService.markAllRead(userId);
    }
}
