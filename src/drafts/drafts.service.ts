import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class DraftsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async addDrafts(userId: string, title: string, description: string, imageUrls?: string[]) {
        const { error } = await this.supabaseService
            .getClient()
            .from('drafts')
            .insert({
                created_at: new Date().toISOString(),
                user_id: userId,
                title: title,
                description: description,
                post_image: imageUrls,
            });

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return { message: 'Successfully add draft' };
    }

    async deleteDrafts(userId: string, draftId: string) {
        const { error } = await this.supabaseService
            .getClient()
            .from('drafts')
            .delete()
            .eq('user_id', userId)
            .eq('draft_id', draftId);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return { message: 'Successfully delete draft' };
    }
}
