import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class CollectionsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async findAll() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('collections')
            .select('*');

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return data;
    }

    async findCollectionExist(post_id: string, user_id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('collections')
            .select('*')
            .eq('user_id', user_id)
            .eq('post_id', post_id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return data;
    }

    async addCollection(post_id: string, user_id: string) {
        const collectionExist = await this.findCollectionExist(post_id, user_id);
        if (collectionExist.length > 0) {
            throw new InternalServerErrorException('You already add this collection');
        }

        const { error } = await this.supabaseService
            .getClient()
            .from('collections')
            .insert({
                created_at: new Date().toISOString(),
                user_id: user_id,
                post_id: post_id,
            });

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return { message: 'Successfully add collection' };
    }

    async deleteCollection(post_id: string, user_id: string) {
        const collectionExist = await this.findCollectionExist(post_id, user_id);
        if (collectionExist.length === 0) {
            throw new InternalServerErrorException('You not add this collection');
        }

        const { error } = await this.supabaseService
            .getClient()
            .from('collections')
            .delete()
            .eq('user_id', user_id)
            .eq('post_id', post_id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return { message: 'Successfully delete collection' };
    }
}
