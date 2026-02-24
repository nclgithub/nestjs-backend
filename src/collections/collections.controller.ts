import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('collections')
export class CollectionsController {
    constructor(private readonly collectionsService: CollectionsService) { }

    @Get()
    async findAll() {
        return await this.collectionsService.findAll();
    }

    @Post(":post_id/add")
    @UseGuards(JwtAuthGuard)
    async addCollection(@Param("post_id") post_id: string, @Req() req) {
        const userId = req.user.userId;
        return await this.collectionsService.addCollection(post_id, userId);
    }

    @Delete(":post_id/delete")
    @UseGuards(JwtAuthGuard)
    async deleteCollection(@Param("post_id") post_id: string, @Req() req) {
        const userId = req.user.userId;
        return await this.collectionsService.deleteCollection(post_id, userId);
    }
}
