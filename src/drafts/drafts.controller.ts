import { Controller, Delete, Post, UseGuards, Param, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DraftsService } from 'src/drafts/drafts.service';

@Controller('drafts')
export class DraftsController {
    constructor(private readonly draftsService: DraftsService) { }

    @Post('add')
    @UseGuards(JwtAuthGuard)
    async addDrafts(@Body() body: { title: string, description: string, imageUrls?: string[] }, @Req() req) {
        const userId = req.user.userId;
        return await this.draftsService.addDrafts(userId, body.title, body.description, body.imageUrls);
    }

    @Delete('delete')
    @UseGuards(JwtAuthGuard)
    async deleteDrafts(@Body() body: { draftId: string }, @Req() req) {
        const userId = req.user.userId;
        return await this.draftsService.deleteDrafts(userId, body.draftId);
    }
}
