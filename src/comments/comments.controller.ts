import { Controller, Get, Param } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Get()
    async findAll() {
        try {
            const comments = await this.commentsService.findAll();
            return { success: true, data: comments };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}
