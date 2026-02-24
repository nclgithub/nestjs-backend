import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class LikesService {
    constructor(private readonly supabaseService: SupabaseService) { }

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
}
