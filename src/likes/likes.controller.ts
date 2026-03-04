import { Body, Controller, Get, Post, Delete, UseGuards, Param, Req } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('likes')
export class LikesController {
    constructor(private readonly likesService: LikesService) { }

    @Post(':post_id/add')
    @UseGuards(JwtAuthGuard)
    async addLikes(@Param("post_id") postId: string, @Req() req) {
        const userId = req.user.userId;
        return await this.likesService.addLikes(postId, userId);
    }

    @Delete(':post_id/delete')
    @UseGuards(JwtAuthGuard)
    async deleteLikes(@Param("post_id") postId: string, @Req() req) {
        const userId = req.user.userId;
        return await this.likesService.deleteLikes(postId, userId);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async findUserLikesPost(@Req() req) {
        const userId = req.user.userId;
        return await this.likesService.findUserLikesPost(userId);
    }

    @Get('me/number')
    @UseGuards(JwtAuthGuard)
    async findUserLikesNumber(@Req() req) {
        const userId = req.user.userId;
        return await this.likesService.findUserLikesNumber(userId);
    }
}