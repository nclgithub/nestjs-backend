import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class ConversationsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    // ─── Deterministic conversation_id ────────────────────────────────────────────
    // Sorted UUIDs joined by '_' (URL-safe) so both sides always map to same thread.
    private buildConversationId(userA: string, userB: string): string {
        return [userA, userB].sort().join('_');
    }

    // ─── List conversations for a user ───────────────────────────────────────────
    async getMyConversations(userId: string) {
        // Step 1: fetch messages for this user, latest first
        const { data: rows, error } = await this.supabaseService.getClient()
            .from('conversations')
            .select('id, conversation_id, sender_id, receiver_id, content, created_at')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw new InternalServerErrorException(error.message);

        // Step 2: deduplicate — keep only the latest message per conversation_id
        const convMap = new Map<string, any>();
        for (const row of (rows || [])) {
            if (!convMap.has(row.conversation_id)) {
                convMap.set(row.conversation_id, row);
            }
        }

        if (convMap.size === 0) return [];

        // Step 3: collect the unique other-user IDs
        const otherUserIds = Array.from(convMap.values()).map(row =>
            row.sender_id === userId ? row.receiver_id : row.sender_id
        );

        // Step 4: batch-fetch account info for those users
        const { data: accounts, error: accErr } = await this.supabaseService.getClient()
            .from('account')
            .select('id, name, profile_image')
            .in('id', otherUserIds);

        if (accErr) throw new InternalServerErrorException(accErr.message);

        const accountMap = new Map((accounts || []).map(a => [a.id, a]));

        // Step 5: shape the result
        return Array.from(convMap.values()).map(row => {
            const isMe = row.sender_id === userId;
            const otherUserId = isMe ? row.receiver_id : row.sender_id;
            return {
                conversation_id: row.conversation_id,
                other_user: accountMap.get(otherUserId) ?? { id: otherUserId, name: 'Unknown', profile_image: '' },
                last_message: row.content,
                last_time: row.created_at,
                from_me: isMe,
            };
        });
    }

    // ─── Get all messages in a conversation ───────────────────────────────────────
    async getMessages(userId: string, conversationId: string) {
        const { data, error } = await this.supabaseService.getClient()
            .from('conversations')
            .select('id, conversation_id, sender_id, receiver_id, content, created_at')
            .eq('conversation_id', conversationId)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: true });

        if (error) throw new InternalServerErrorException(error.message);
        return data || [];
    }

    // ─── Send a message ───────────────────────────────────────────────────────────
    async sendMessage(senderId: string, receiverId: string, content: string) {
        const conversationId = this.buildConversationId(senderId, receiverId);

        const { data, error } = await this.supabaseService.getClient()
            .from('conversations')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                receiver_id: receiverId,
                content,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    // ─── Get conversation info (used when opening a chat from a profile) ──────────
    async getOrCreateConversation(userId: string, otherUserId: string) {
        const conversationId = this.buildConversationId(userId, otherUserId);

        const { data: otherUser, error } = await this.supabaseService.getClient()
            .from('account')
            .select('id, name, profile_image')
            .eq('id', otherUserId)
            .single();

        if (error) throw new NotFoundException('User not found');

        return {
            conversation_id: conversationId,
            other_user: otherUser,
        };
    }
}
