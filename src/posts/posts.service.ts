import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

const POST_IMAGES_BUCKET = 'post-images';

const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
];

interface UploadedFile {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
}

@Injectable()
export class PostsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async findAll(id?: string) {
        const { data, error } = await this.supabaseService.getClient()
            .from('posts')
            .select('*, account:user_id (id, name, profile_image), likes!left (user_id), collections!left (user_id), likes_count:likes(count), collections_count:collections(count)');

        if (error) {
            throw new InternalServerErrorException('Unable to fetch posts');
        }

        const dataWithLikes = data.map(({ likes, collections, likes_count, collections_count, ...rest }) => {
            return {
                ...rest,
                isLiked: id ? likes.some(like => like.user_id === id) : false,
                isCollected: id ? collections.some(collection => collection.user_id === id) : false,
                favorite_num: (likes_count as any)?.[0]?.count ?? 0,
                saved_num: (collections_count as any)?.[0]?.count ?? 0,
            };
        });

        const shuffledData = dataWithLikes.sort(() => Math.random() - 0.5);

        return shuffledData;
    }

    async findById(postId: string, id?: string) {
        const { data, error } = await this.supabaseService.getClient()
            .from('posts')
            .select('*, account:user_id (id, name, profile_image), likes!left (user_id), collections!left (user_id), likes_count:likes(count), collections_count:collections(count)')
            .eq('id', postId)
            .single();

        if (error) {
            throw new InternalServerErrorException('Unable to fetch post');
        }

        const { likes, collections, likes_count, collections_count, ...rest } = data as any;
        const dataWithLikes = {
            ...rest,
            isLiked: id ? likes.some(like => like.user_id === id) : false,
            isCollected: id ? collections.some(collection => collection.user_id === id) : false,
            favorite_num: (likes_count as any)?.[0]?.count ?? 0,
            saved_num: (collections_count as any)?.[0]?.count ?? 0,
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
            throw new InternalServerErrorException('Unable to fetch post likes');
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
            throw new InternalServerErrorException('Unable to count post likes');
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
            throw new InternalServerErrorException('Unable to fetch post comments');
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
            throw new InternalServerErrorException('Unable to count post comments');
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
            throw new InternalServerErrorException('Unable to fetch post collections');
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
            throw new InternalServerErrorException('Unable to count post collections');
        }

        return count;
    }

    async uploadImage(file: UploadedFile): Promise<string> {
        // Validate MIME type — only allow actual image types
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Unsupported file type. Only JPEG, PNG, GIF, WebP, HEIC and HEIF images are allowed.`,
            );
        }

        const ext = file.originalname.split('.').pop() ?? 'jpg';
        const fileName = `post_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await this.supabaseService.getClient()
            .storage
            .from(POST_IMAGES_BUCKET)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            throw new InternalServerErrorException('Image upload failed');
        }

        const { data } = this.supabaseService.getClient()
            .storage
            .from(POST_IMAGES_BUCKET)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    async createPost(userId: string, title: string, description: string, imageUrls?: string[]) {
        const insertPayload: Record<string, any> = { created_at: new Date(), title, description, user_id: userId };
        if (imageUrls && imageUrls.length > 0) {
            // Supabase JS client does not support raw arrays as column values.
            // Serialize to a JSON string and parse it back on the frontend.
            insertPayload['post_image'] = JSON.stringify(imageUrls);
        }

        const { data, error } = await this.supabaseService.getClient()
            .from('posts')
            .insert(insertPayload)
            .select('*')
            .single();

        if (error) {
            throw new InternalServerErrorException('Unable to create post');
        }

        return data;
    }
}
