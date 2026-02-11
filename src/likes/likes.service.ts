import { Injectable } from '@nestjs/common';
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
            throw new Error(error.message);
        }

        return data;
    }

    async addLikes({ post_id, user_id }: { post_id: string; user_id: string }) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('likes')
            .insert({
                created_at: new Date().toISOString(),
                post_id: post_id,
                user_id: user_id,
            });

        if (error) {
            throw new Error(error.message);
        }
    }

    async deleteLikes({ post_id, user_id }: { post_id: string; user_id: string }) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('likes')
            .delete()
            .eq('post_id', post_id)
            .eq('user_id', user_id);

        if (error) {
            throw new Error(error.message);
        }
    }
}
