import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

export type NotificationType = 'like' | 'comment' | 'follow';

@Injectable()
export class NotificationsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    // ── Public helper called by other services ────────────────────────────────
    async createNotification(opts: {
        sender_id: string;
        receiver_id: string;
        type: NotificationType;
        post_id?: string | null;
        comment_id?: string | null;
    }): Promise<void> {
        // Never notify users about their own actions
        if (opts.sender_id === opts.receiver_id) return;

        const { error } = await this.supabaseService
            .getClient()
            .from('notifications')
            .insert({
                sender_id: opts.sender_id,
                receiver_id: opts.receiver_id,
                type: opts.type,
                post_id: opts.post_id ?? null,
                comment_id: opts.comment_id ?? null,
                is_read: false,
                created_at: new Date().toISOString(),
            });

        if (error) {
            // Log but don't throw — notification failure should never break the main action
            console.error('[Notifications] Failed to create notification:', error.message);
        }
    }

    // ── GET /notifications/me ─────────────────────────────────────────────────
    async getNotifications(userId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('notifications')
            .select(`
                id,
                type,
                post_id,
                comment_id,
                is_read,
                created_at,
                account:sender_id (
                    id,
                    name,
                    profile_image
                )
            `)
            .eq('receiver_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    // ── PATCH /notifications/me/read-all ──────────────────────────────────────
    async markAllRead(userId: string) {
        const { error } = await this.supabaseService
            .getClient()
            .from('notifications')
            .update({ is_read: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return { success: true };
    }
}

