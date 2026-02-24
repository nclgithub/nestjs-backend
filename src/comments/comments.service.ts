import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class CommentsService {
    constructor(private readonly supabaseService: SupabaseService) { }

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
        const { error } = await this.supabaseService
            .getClient()
            .from('comments')
            .insert({
                created_at: new Date().toISOString(),
                post_id: post_id,
                user_id: user_id,
                comment: comment,
            });

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

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
}
