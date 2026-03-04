import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
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
            throw new BadRequestException('You already added this post to your collection');
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
            throw new BadRequestException('This post is not in your collection');
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

    async findUserCollections(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('collections')
            .select('posts:post_id (*, account:user_id (id, name, profile_image), likes!left (user_id), collections!left (user_id), likes_count:likes(count), collections_count:collections(count))')
            .eq('user_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return (data || []).map(({ posts }: any) => {
            if (!posts) return null;
            const { likes, collections, likes_count, collections_count, ...rest } = posts;
            return {
                ...rest,
                isLiked: (likes || []).some((l: any) => l.user_id === id),
                isCollected: (collections || []).some((c: any) => c.user_id === id),
                favorite_num: (likes_count as any)?.[0]?.count ?? 0,
                saved_num: (collections_count as any)?.[0]?.count ?? 0,
            };
        }).filter((item: any) => item !== null);
    }

    async findUserCollectionsNumber(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { count, error } = await this.supabaseService
            .getClient()
            .from('collections')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return count || 0;
    }
}
