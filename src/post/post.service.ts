import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class PostService {
    constructor(private readonly supabaseService: SupabaseService) {}

    async findAll() {
        const { data, error } = await this.supabaseService.getClient()
            .from('post')
            .select('id, created_at, title, description, post_image, favorite_num, saved_num, account:user_id (id, name, profile_image)');
        
        if (error) {
            throw new Error(error.message);
        }

        const shuffledData = data.sort(() => Math.random() - 0.5);

        return shuffledData;
    }

    async findById(id: string) {
        const { data, error } = await this.supabaseService.getClient()
            .from('post')
            .select('id, created_at, title, description, post_image, favorite_num, saved_num, account:user_id (id, name, profile_image)')
            .eq('id', id)
            .single();

        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    }

    async findByUserId(id: string) {
        const { data, error } = await this.supabaseService.getClient()
            .from('post')
            .select('id, created_at, title, description, post_image, favorite_num, saved_num, account:user_id (id, name, profile_image)')
            .eq('user_id', id);

        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    }

    async findUserPostNumber(id: string) {
        const { count, error } = await this.supabaseService.getClient()
            .from('post')
            .select('*', { count: "exact", head: true })
            .eq('user_id', id);

        if (error) {
            throw new Error(error.message);
        }
        
        return count;
    }
}
