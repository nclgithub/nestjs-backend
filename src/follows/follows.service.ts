import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class FollowsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async findAll() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('account')
            .select(
                'id, created_at, follower_id, followed_id, account:follower_id (id, name, profile_image)',
            );

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return data;
    }

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
}
