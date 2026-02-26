import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('follows')
export class FollowsController {
    constructor(private readonly followsService: FollowsService) { }

    @Post("follow")
    @UseGuards(JwtAuthGuard)
    async addFollowing(@Body() followInfo: { followed_id: string }, @Req() req) {
        const userId = req.user.userId;
        return await this.followsService.addFollowing(userId, followInfo.followed_id);
    }

    @Delete("unfollow")
    @UseGuards(JwtAuthGuard)
    async deleteFollowing(@Body() followInfo: { followed_id: string }, @Req() req) {
        const userId = req.user.userId;
        return await this.followsService.deleteFollowing(userId, followInfo.followed_id);
    }

    @Get("isfollowed/:id")
    @UseGuards(JwtAuthGuard)
    async checkIsFollowed(@Req() req, @Param('id') id: string) {
        const userId = req.user.userId;
        return await this.followsService.checkIsFollowed(userId, id);
    }
}
