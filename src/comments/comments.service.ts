import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async findAll() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('comments')
            .select('*');

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return data;
    }

    async addComment(post_id: string, user_id: string, comment: string) {
        const { data: insertedRows, error } = await this.supabaseService
            .getClient()
            .from('comments')
            .insert({
                created_at: new Date().toISOString(),
                post_id: post_id,
                user_id: user_id,
                comment: comment,
            })
            .select('id')     // get the new comment id for the notification
            .single();

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        const comment_id: string | null = insertedRows?.id ?? null;

        // ── Fetch the post's author and fire a notification (fire-and-forget) ──
        void Promise.resolve(
            this.supabaseService
                .getClient()
                .from('posts')
                .select('user_id')
                .eq('id', post_id)
                .maybeSingle()
        ).then(({ data: post }) => {
            if (post?.user_id) {
                this.notificationsService.createNotification({
                    sender_id: user_id,
                    receiver_id: post.user_id,
                    type: 'comment',
                    post_id: post_id,
                    comment_id: comment_id,
                });
            }
        }).catch(() => { /* silently ignore */ });

        return { message: 'Successfully add comment' };
    }

    async deleteComment(post_id: string, user_id: string, comment: string) {
        const { error } = await this.supabaseService
            .getClient()
            .from('comments')
            .delete()
            .eq('post_id', post_id)
            .eq('user_id', user_id)
            .eq('comment', comment);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return { message: 'Successfully delete comment' };
    }

    async findUserComments(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('comments')
            .select('posts:post_id (*, account:user_id (id, name, profile_image))')
            .eq('user_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return (data || []).map(({ posts }) => posts);
    }

    async findUserCommentsNumber(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { count, error } = await this.supabaseService
            .getClient()
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return count || 0;
    }
}
