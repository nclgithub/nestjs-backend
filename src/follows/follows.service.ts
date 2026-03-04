import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowsService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async findFollowExist(follower_id: string, followed_id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('follows')
            .select('id')
            .eq('follower_id', follower_id)
            .eq('followed_id', followed_id)
            .maybeSingle();

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return data;
    }

    async addFollowing(follower_id: string, followed_id: string) {
        if (follower_id === followed_id) {
            throw new BadRequestException("You cannot follow yourself");
        }

        const followExist = await this.findFollowExist(follower_id, followed_id);
        if (followExist) {
            throw new BadRequestException("You already follow this user");
        }

        const { error } = await this.supabaseService
            .getClient()
            .from('follows')
            .insert({
                created_at: new Date().toISOString(),
                follower_id: follower_id,
                followed_id: followed_id,
            });

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        // ── Fire a 'follow' notification (fire-and-forget) ────────────────────
        // receiver = the person being followed; no post/comment context needed
        this.notificationsService.createNotification({
            sender_id: follower_id,
            receiver_id: followed_id,
            type: 'follow',
        }).catch(() => { /* silently ignore */ });

        return { message: 'Successfully follow' };
    }

    async deleteFollowing(follower_id: string, followed_id: string) {
        if (follower_id === followed_id) {
            throw new BadRequestException("You cannot unfollow yourself");
        }

        const followExist = await this.findFollowExist(follower_id, followed_id);
        if (!followExist) {
            throw new BadRequestException("You are not following this user");
        }

        const { error } = await this.supabaseService
            .getClient()
            .from('follows')
            .delete()
            .eq('follower_id', follower_id)
            .eq('followed_id', followed_id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return { message: 'Successfully unfollow' };
    }

    async checkIsFollowed(follower_id: string, followed_id: string) {
        const followExist = await this.findFollowExist(follower_id, followed_id);
        return !!followExist;
    }

    async findUserFollower(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('follows')
            .select('account:follower_id (id, name, profile_image)')
            .eq('followed_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return (data || []).map(({ account }) => account);
    }

    async findUserFollowerNumber(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { count, error } = await this.supabaseService
            .getClient()
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('followed_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return count || 0;
    }

    async findUserFollowing(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('follows')
            .select('account:followed_id (id, name, profile_image)')
            .eq('follower_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return (data || []).map(({ account }) => account);
    }

    async findUserFollowingNumber(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { count, error } = await this.supabaseService
            .getClient()
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return count || 0;
    }
}
