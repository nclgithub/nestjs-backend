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

    @Get('me/followers')
    @UseGuards(JwtAuthGuard)
    async findUserFollower(@Req() req) {
        const userId = req.user.userId;
        return await this.followsService.findUserFollower(userId);
    }

    @Get('me/followers/number')
    @UseGuards(JwtAuthGuard)
    async findUserFollowerNumber(@Req() req) {
        const userId = req.user.userId;
        return await this.followsService.findUserFollowerNumber(userId);
    }

    @Get('me/following')
    @UseGuards(JwtAuthGuard)
    async findUserFollowing(@Req() req) {
        const userId = req.user.userId;
        return await this.followsService.findUserFollowing(userId);
    }

    @Get('me/following/number')
    @UseGuards(JwtAuthGuard)
    async findUserFollowingNumber(@Req() req) {
        const userId = req.user.userId;
        return await this.followsService.findUserFollowingNumber(userId);
    }

    @Get('user/:id/followers/number')
    @UseGuards(JwtAuthGuard)
    async findUserFollowerNumberById(@Param('id') id: string) {
        return await this.followsService.findUserFollowerNumber(id);
    }

    @Get('user/:id/following/number')
    @UseGuards(JwtAuthGuard)
    async findUserFollowingNumberById(@Param('id') id: string) {
        return await this.followsService.findUserFollowingNumber(id);
    }
}
