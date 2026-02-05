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
}
