import { Body, Controller, Get, Post, Delete } from '@nestjs/common';
import { LikesService } from './likes.service';

@Controller('likes')
export class LikesController {
    constructor(private readonly likesService: LikesService) { }

    @Get()
    async findAll() {
        try {
            const likes = await this.likesService.findAll();
            return { success: true, data: likes };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    @Post('add')
    async addLikes(@Body() likeInfo) {
        try {
            await this.likesService.addLikes(likeInfo);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    @Delete('delete')
    async deleteLikes(@Body() likeInfo) {
        try {
            await this.likesService.deleteLikes(likeInfo);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}