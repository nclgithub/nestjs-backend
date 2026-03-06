import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import Redis from 'ioredis';

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
    private readonly redis: Redis | null;

    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly notificationsService: NotificationsService,
    ) {
        try {
            this.redis = new Redis({
                host: '127.0.0.1',
                port: 6379,
                retryStrategy: (times) => {
                    // Stop retrying after 3 times
                    if (times > 3) {
                        return null;
                    }
                    return Math.min(times * 50, 2000);
                },
                maxRetriesPerRequest: 1, // Fail fast if Redis is down instead of hanging
            });

            // Attach error listener to prevent unhandled rejections/events from crashing the app
            this.redis.on('connect', () => {
                //console.log('Redis connected');
            });

            this.redis.on('ready', () => {
                //console.log('Redis ready');
            });

            this.redis.on('error', (err) => {
                //console.error('Redis error:', err.message);
            });
        } catch (e) {
            this.redis = null;
        }
    }

    async getPostFeed(userId?: string, lastPostId?: number) {
        const cacheKey = `post_feed:${userId || 'anonymous'}:${lastPostId || 'null'}`;

        try {
            if (this.redis) {
                const cachedData = await this.redis.get(cacheKey);

                if (cachedData) {
                    return JSON.parse(cachedData);
                }
            }
        } catch (err) {
            // Suppress Redis error and gracefully fallback to querying Supabase
            //console.warn('[Cache] Redis get failed, fetching from DB...');
        }

        const client = this.supabaseService.getClient();

        // Get total posts count
        const { count: totalPosts } = await client
            .from('posts')
            .select('*', { count: 'exact', head: true });

        const { data: posts, error: postsError } = await client
            .from('posts')
            .select(`*,account:user_id (id, name, profile_image)`,)
            .order('created_at', { ascending: false })
            .limit(60);

        if (postsError) {
            throw new InternalServerErrorException('Unable to fetch posts');
        }

        if (!posts?.length) return { posts: [], nextCursor: null, totalPosts: totalPosts || 0 };

        let startIndex = 0;
        if (lastPostId) {
            const index = posts.findIndex(p => p.id === lastPostId);
            startIndex = index + 1;
        }

        let nextPosts = posts.slice(startIndex, startIndex + 15);

        nextPosts = nextPosts.sort(() => Math.random() - 0.5);

        const nextCursor = nextPosts.length ? nextPosts[nextPosts.length - 1].id : null;

        const postIds = nextPosts.map((p) => p.id);

        const { data: likeCounts } = await client
            .from('likes')
            .select('post_id')
            .in('post_id', postIds);

        const { data: collectionCounts } = await client
            .from('collections')
            .select('post_id')
            .in('post_id', postIds);

        let userLikesMap = new Set<number>();
        let userCollectionsMap = new Set<number>();

        if (userId) {
            const { data: userLikes } = await client
                .from('likes')
                .select('post_id')
                .eq('user_id', userId)
                .in('post_id', postIds);

            const { data: userCollections } = await client
                .from('collections')
                .select('post_id')
                .eq('user_id', userId)
                .in('post_id', postIds);

            userLikesMap = new Set(userLikes?.map((l) => l.post_id));
            userCollectionsMap = new Set(userCollections?.map((c) => c.post_id));
        }

        const result = nextPosts.map((post) => ({
            ...post,
            isLiked: userLikesMap.has(post.id),
            isCollected: userCollectionsMap.has(post.id),
            favorite_num:
                likeCounts?.filter((l) => l.post_id === post.id)?.length ?? 0,
            saved_num:
                collectionCounts?.filter((c) => c.post_id === post.id)?.length ?? 0,
        }));

        const resultData = {
            posts: result,
            nextCursor,
            totalPosts: totalPosts || 0,
        };

        try {
            if (this.redis) {
                // Cache the feed for 60 seconds to reduce database load
                await this.redis.set(cacheKey, JSON.stringify(resultData), 'EX', 60);
            }
        } catch (err) {
            // Ignore map error, fail silently
        }

        return resultData;
    }

    async findById(postId: string, id?: string) {
        const client = this.supabaseService.getClient();

        const { data: post, error: postError } = await client
            .from('posts')
            .select('*, account:user_id (id, name, profile_image)')
            .eq('id', postId)
            .single();

        if (postError) {
            throw new InternalServerErrorException('Unable to fetch post');
        }

        const { data: likeCounts } = await client
            .from('likes')
            .select('post_id')
            .eq('post_id', postId);

        const { data: collectionCounts } = await client
            .from('collections')
            .select('post_id')
            .eq('post_id', postId);

        let isLiked = false;
        let isCollected = false;

        if (id) {
            const { data: userLikes } = await client
                .from('likes')
                .select('post_id')
                .eq('user_id', id)
                .eq('post_id', postId);

            const { data: userCollections } = await client
                .from('collections')
                .select('post_id')
                .eq('user_id', id)
                .eq('post_id', postId);

            isLiked = !!userLikes?.length;
            isCollected = !!userCollections?.length;
        }

        return {
            ...post,
            isLiked,
            isCollected,
            favorite_num: likeCounts?.length ?? 0,
            saved_num: collectionCounts?.length ?? 0,
        };
    }

    async findUserPost(id: string) {
        const client = this.supabaseService.getClient();

        const { data: posts, error: postsError } = await client
            .from('posts')
            .select('*, account:user_id (id, name, profile_image)')
            .eq('user_id', id)
            .order('created_at', { ascending: false });

        if (postsError) {
            throw new InternalServerErrorException(postsError.message);
        }

        if (!posts?.length) return [];

        const postIds = posts.map((p) => p.id);

        const { data: likeCounts } = await client
            .from('likes')
            .select('post_id')
            .in('post_id', postIds);

        const { data: collectionCounts } = await client
            .from('collections')
            .select('post_id')
            .in('post_id', postIds);

        let userLikesMap = new Set<number>();
        let userCollectionsMap = new Set<number>();

        if (id) {
            const { data: userLikes } = await client
                .from('likes')
                .select('post_id')
                .eq('user_id', id)
                .in('post_id', postIds);

            const { data: userCollections } = await client
                .from('collections')
                .select('post_id')
                .eq('user_id', id)
                .in('post_id', postIds);

            userLikesMap = new Set(userLikes?.map((l) => l.post_id));
            userCollectionsMap = new Set(userCollections?.map((c) => c.post_id));
        }

        return posts.map((post) => ({
            ...post,
            isLiked: userLikesMap.has(post.id),
            isCollected: userCollectionsMap.has(post.id),
            favorite_num:
                likeCounts?.filter((l) => l.post_id === post.id)?.length ?? 0,
            saved_num:
                collectionCounts?.filter((c) => c.post_id === post.id)?.length ?? 0,
        }));
    }

    async findUserPostNumber(id: string) {
        if (!id) {
            throw new BadRequestException('ID must be provided');
        }

        const { count, error } = await this.supabaseService
            .getClient()
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return count || 0;
    }

    async findPostLikes(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('likes')
            .select('user_id, account:user_id (id, name, profile_image)')
            .eq('post_id', id);

        if (error) {
            throw new InternalServerErrorException('Unable to fetch post likes');
        }

        return data.map((item) => item.account);
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
            .select(
                'id, created_at, comment, post_id, user_id, account:user_id (id, name, profile_image)',
            )
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
            .select('user_id, account:user_id (id, name, profile_image)')
            .eq('post_id', id);

        if (error) {
            throw new InternalServerErrorException(
                'Unable to fetch post collections',
            );
        }

        return data.map((item) => item.account);
    }

    async findPostCollectionsNumber(id: string) {
        const { count, error } = await this.supabaseService
            .getClient()
            .from('collections')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', id);

        if (error) {
            throw new InternalServerErrorException(
                'Unable to count post collections',
            );
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

        const { error } = await this.supabaseService
            .getClient()
            .storage.from(POST_IMAGES_BUCKET)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            throw new InternalServerErrorException('Image upload failed');
        }

        const { data } = this.supabaseService
            .getClient()
            .storage.from(POST_IMAGES_BUCKET)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    async createPost(
        userId: string,
        title: string,
        description: string,
        imageUrls?: string[],
    ) {
        const insertPayload: Record<string, any> = {
            created_at: new Date(),
            title,
            description,
            user_id: userId,
        };
        if (imageUrls && imageUrls.length > 0) {
            // Supabase JS client does not support raw arrays as column values.
            // Serialize to a JSON string and parse it back on the frontend.
            insertPayload['post_image'] = JSON.stringify(imageUrls);
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('posts')
            .insert(insertPayload)
            .select('*')
            .single();

        if (error) {
            throw new InternalServerErrorException('Unable to create post');
        }

        // ── Fire notification to all followers asynchronously ──────────────────
        (async () => {
            try {
                const { data: followers, error: fError } = await this.supabaseService
                    .getClient()
                    .from('follows')
                    .select('follower_id')
                    .eq('followed_id', userId);

                if (fError || !followers) return;

                for (const f of followers) {
                    await this.notificationsService.createNotification({
                        sender_id: userId,
                        receiver_id: f.follower_id,
                        type: 'new_post',
                        post_id: data.id,
                    });
                }
            } catch (err) {
                // silently ignore errors to prevent them from crashing or bubbling up
            }
        })();

        return data;
    }

    async updatePost(
        userId: string,
        postId: string,
        title: string,
        description: string,
        imageUrls?: string[],
    ) {
        const updatePayload: Record<string, any> = {
            title,
            description,
            modified_at: new Date().toISOString(),
        };
        if (imageUrls && imageUrls.length > 0) {
            updatePayload['post_image'] = JSON.stringify(imageUrls);
        } else if (imageUrls && imageUrls.length === 0) {
            updatePayload['post_image'] = null;
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('posts')
            .update(updatePayload)
            .eq('id', postId)
            .eq('user_id', userId)
            .select('*')
            .single();

        if (error) {
            throw new InternalServerErrorException('Unable to update post');
        }

        return data;
    }

    async deletePost(userId: string, postId: string) {
        const { error } = await this.supabaseService
            .getClient()
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', userId);

        if (error) {
            throw new InternalServerErrorException('Unable to delete post');
        }

        return { success: true };
    }

    async searchPosts(keyword: string, userId?: string, limit = 20) {
        if (!keyword || keyword.trim().length === 0) {
            return [];
        }

        const client = this.supabaseService.getClient();

        const { data: posts, error } = await client
            .from('posts')
            .select('*, account:user_id (id, name, profile_image)')
            .or(`title.ilike.%${keyword.trim()}%,description.ilike.%${keyword.trim()}%`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw new InternalServerErrorException('Unable to search posts');
        }

        if (!posts?.length) return [];

        const postIds = posts.map((p) => p.id);

        const { data: likeCounts } = await client
            .from('likes')
            .select('post_id')
            .in('post_id', postIds);

        const { data: collectionCounts } = await client
            .from('collections')
            .select('post_id')
            .in('post_id', postIds);

        let userLikesMap = new Set<number>();
        let userCollectionsMap = new Set<number>();

        if (userId) {
            const { data: userLikes } = await client
                .from('likes')
                .select('post_id')
                .eq('user_id', userId)
                .in('post_id', postIds);

            const { data: userCollections } = await client
                .from('collections')
                .select('post_id')
                .eq('user_id', userId)
                .in('post_id', postIds);

            userLikesMap = new Set(userLikes?.map((l) => l.post_id));
            userCollectionsMap = new Set(userCollections?.map((c) => c.post_id));
        }

        return posts.map((post) => ({
            ...post,
            isLiked: userLikesMap.has(post.id),
            isCollected: userCollectionsMap.has(post.id),
            favorite_num: likeCounts?.filter((l) => l.post_id === post.id)?.length ?? 0,
            saved_num: collectionCounts?.filter((c) => c.post_id === post.id)?.length ?? 0,
        }));
    }

    async getFollowersPostFeed(userId: string, lastPostId?: number) {
        const client = this.supabaseService.getClient();

        const { data: following } = await client
            .from('follows')
            .select('followed_id')
            .eq('follower_id', userId);

        const followingIds = following?.map((f) => f.followed_id) ?? [];

        const { data: posts, error: postsError } = await client
            .from('posts')
            .select(`*,account:user_id (id, name, profile_image)`)
            .in('user_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(60);

        if (postsError) {
            throw new InternalServerErrorException('Unable to fetch posts');
        }

        const totalPosts = posts.length;

        if (!posts?.length) return { posts: [], nextCursor: null, totalPosts: 0 };

        let startIndex = 0;
        if (lastPostId) {
            const index = posts.findIndex(p => p.id === lastPostId);
            startIndex = index + 1;
        }

        let nextPosts = posts.slice(startIndex, startIndex + 15);

        nextPosts = nextPosts.sort(() => Math.random() - 0.5);

        const nextCursor = nextPosts.length ? nextPosts[nextPosts.length - 1].id : null;

        const postIds = nextPosts.map((p) => p.id);

        const { data: likeCounts } = await client
            .from('likes')
            .select('post_id')
            .in('post_id', postIds);

        const { data: collectionCounts } = await client
            .from('collections')
            .select('post_id')
            .in('post_id', postIds);

        let userLikesMap = new Set<number>();
        let userCollectionsMap = new Set<number>();

        if (userId) {
            const { data: userLikes } = await client
                .from('likes')
                .select('post_id')
                .eq('user_id', userId)
                .in('post_id', postIds);

            const { data: userCollections } = await client
                .from('collections')
                .select('post_id')
                .eq('user_id', userId)
                .in('post_id', postIds);

            userLikesMap = new Set(userLikes?.map((l) => l.post_id));
            userCollectionsMap = new Set(userCollections?.map((c) => c.post_id));
        }

        const result = nextPosts.map((post) => ({
            ...post,
            isLiked: userLikesMap.has(post.id),
            isCollected: userCollectionsMap.has(post.id),
            favorite_num:
                likeCounts?.filter((l) => l.post_id === post.id)?.length ?? 0,
            saved_num:
                collectionCounts?.filter((c) => c.post_id === post.id)?.length ?? 0,
        }));

        return { posts: result, nextCursor, totalPosts };
    }
}
