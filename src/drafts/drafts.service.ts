import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
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
            .eq('id', draftId);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return { message: 'Successfully delete draft' };
    }

    async findUserDrafts(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('drafts')
            .select('*')
            .eq('user_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return data || [];
    }

    async findUserDraftsNumber(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { count, error } = await this.supabaseService
            .getClient()
            .from('drafts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return count || 0;
    }
}
