import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class PostsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async findAll(id?: string) {
        const { data, error } = await this.supabaseService.getClient()
            .from('posts')
            .select('*, account:user_id (id, name, profile_image), likes!left (user_id), collections!left (user_id)');

        if (error) {
            throw new Error(error.message);
        }

        const dataWithLikes = data.map(({ likes, collections, ...rest }) => {
            return {
                ...rest,
                isLiked: id ? likes.some(like => like.user_id === id) : false,
                isCollected: id ? collections.some(collection => collection.user_id === id) : false,
            };
        });

        const shuffledData = dataWithLikes.sort(() => Math.random() - 0.5);

        return shuffledData;
    }

    async findById(postId: string, id?: string) {
        const { data, error } = await this.supabaseService.getClient()
            .from('posts')
            .select('*, account:user_id (id, name, profile_image), likes!left (user_id), collections!left (user_id)')
            .eq('id', postId)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        const { likes, collections, ...rest } = data;
        const dataWithLikes = {
            ...rest,
            isLiked: id ? likes.some(like => like.user_id === id) : false,
            isCollected: id ? collections.some(collection => collection.user_id === id) : false,
        };

        return dataWithLikes;
    }

    async findPostLikes(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('likes')
            .select('posts:post_id (*, account:user_id (id, name, profile_image))')
            .eq('post_id', id);

        if (error) {
            throw new Error(error.message);
        }

        return data.map(item => item.posts);
    }

    async findPostLikesNumber(id: string) {
        const { count, error } = await this.supabaseService
            .getClient()
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', id);

        if (error) {
            throw new Error(error.message);
        }

        return count;
    }

    async findPostComments(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('comments')
            .select('id, created_at, comment, post_id, user_id, account:user_id (id, name, profile_image)')
            .eq('post_id', id);

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async findPostCommentsNumber(id: string) {
        const { count, error } = await this.supabaseService
            .getClient()
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', id);

        if (error) {
            throw new Error(error.message);
        }

        return count;
    }

    async findPostCollections(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('collections')
            .select('posts:post_id (*, account:user_id (id, name, profile_image))')
            .eq('post_id', id);

        if (error) {
            throw new Error(error.message);
        }

        return data.map(item => item.posts);
    }

    async findPostCollectionsNumber(id: string) {
        const { count, error } = await this.supabaseService
            .getClient()
            .from('collections')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', id);

        if (error) {
            throw new Error(error.message);
        }

        return count;
    }

    async createPost(userId: string, title: string, description: string) {
        const { data, error } = await this.supabaseService.getClient()
            .from('posts')
            .insert({ user_id: userId, title, description })
            .select('*')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}
