import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async findAll() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('likes')
            .select('*');

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return data;
    }

    async findLikesExist(post_id: string, user_id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('likes')
            .select('id')
            .eq('post_id', post_id)
            .eq('user_id', user_id)
            .maybeSingle();

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return data;
    }

    async addLikes(post_id: string, user_id: string) {
        const likesExist = await this.findLikesExist(post_id, user_id);
        if (likesExist) {
            throw new BadRequestException("You already like this post");
        }

        const { error } = await this.supabaseService
            .getClient()
            .from('likes')
            .insert({
                created_at: new Date().toISOString(),
                post_id: post_id,
                user_id: user_id,
            });

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

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
                    type: 'like',
                    post_id: post_id,
                });
            }
        }).catch(() => { /* silently ignore */ });

        return { message: 'Successfully add likes' };
    }

    async deleteLikes(post_id: string, user_id: string) {
        const likesExist = await this.findLikesExist(post_id, user_id);
        if (!likesExist) {
            throw new BadRequestException("You are not like this post");
        }

        const { error } = await this.supabaseService
            .getClient()
            .from('likes')
            .delete()
            .eq('post_id', post_id)
            .eq('user_id', user_id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return { message: 'Successfully delete likes' };
    }

    async findUserLikesPost(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('likes')
            .select(
                'posts:post_id (*, account:user_id (id, name, profile_image), likes!left (user_id), collections!left (user_id), likes_count:likes(count), collections_count:collections(count))',
            )
            .eq('user_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return (data || []).map(({ posts }: any) => {
            if (!posts) return null;
            const { likes, collections, likes_count, collections_count, ...rest } = posts;
            return {
                ...rest,
                isLiked: (likes || []).some((l: any) => l.user_id === id),
                isCollected: (collections || []).some((c: any) => c.user_id === id),
                favorite_num: (likes_count as any)?.[0]?.count ?? 0,
                saved_num: (collections_count as any)?.[0]?.count ?? 0,
            };
        }).filter((item: any) => item !== null);
    }

    async findUserLikesNumber(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { count, error } = await this.supabaseService
            .getClient()
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return count || 0;
    }
}
