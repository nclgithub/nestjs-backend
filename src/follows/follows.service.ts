import { Injectable } from '@nestjs/common';
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
            throw new Error(error.message);
        }

        return data;
    }
}
