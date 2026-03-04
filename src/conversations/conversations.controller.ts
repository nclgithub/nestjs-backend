import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('conversations')
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) { }

    // IMPORTANT: Static routes MUST come before dynamic (:param) routes in NestJS.

    // GET /conversations/me  — list all conversations for the current user
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMyConversations(@Req() req) {
        const userId = req.user.userId;
        return this.conversationsService.getMyConversations(userId);
    }

    // GET /conversations/with/:otherUserId — get or create a conversation
    // (must be before the :conversationId/messages route)
    @Get('with/:otherUserId')
    @UseGuards(JwtAuthGuard)
    async getOrCreateConversation(@Param('otherUserId') otherUserId: string, @Req() req) {
        const userId = req.user.userId;
        return this.conversationsService.getOrCreateConversation(userId, otherUserId);
    }

    // POST /conversations/send — send a message
    @Post('send')
    @UseGuards(JwtAuthGuard)
    async sendMessage(
        @Body() body: { receiver_id: string; content: string },
        @Req() req,
    ) {
        const userId = req.user.userId;
        return this.conversationsService.sendMessage(userId, body.receiver_id, body.content);
    }

    // GET /conversations/:conversationId/messages — fetch messages in a thread
    // (dynamic route comes last to avoid swallowing static routes above)
    @Get(':conversationId/messages')
    @UseGuards(JwtAuthGuard)
    async getMessages(@Param('conversationId') conversationId: string, @Req() req) {
        const userId = req.user.userId;
        return this.conversationsService.getMessages(userId, conversationId);
    }
}
