import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Get()
    async findAll() {
        return await this.commentsService.findAll();
    }

    @Post("add")
    @UseGuards(JwtAuthGuard)
    async addComment(@Body() commentInfo: { post_id: string, comment: string }, @Req() req) {
        const userId = req.user.userId;
        return await this.commentsService.addComment(commentInfo.post_id, userId, commentInfo.comment);
    }

    @Delete("delete")
    @UseGuards(JwtAuthGuard)
    async deleteComment(@Body() commentInfo: { post_id: string, comment: string }, @Req() req) {
        const userId = req.user.userId;
        return await this.commentsService.deleteComment(commentInfo.post_id, userId, commentInfo.comment);
    }
}
