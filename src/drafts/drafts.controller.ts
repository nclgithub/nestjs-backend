import { Controller, Delete, Post, UseGuards, Param, Req, Body, Get } from '@nestjs/common';
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

    @Delete(':draftId/delete')
    @UseGuards(JwtAuthGuard)
    async deleteDrafts(@Param('draftId') draftId: string, @Req() req) {
        const userId = req.user.userId;
        return await this.draftsService.deleteDrafts(userId, draftId);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getDrafts(@Req() req) {
        const userId = req.user.userId;
        return await this.draftsService.findUserDrafts(userId);
    }

    @Get('me/number')
    @UseGuards(JwtAuthGuard)
    async getDraftsNumber(@Req() req) {
        const userId = req.user.userId;
        return await this.draftsService.findUserDraftsNumber(userId);
    }
}
