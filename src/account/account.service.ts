import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ulid } from 'ulid';

@Injectable()
export class AccountService {
  constructor(private readonly supabaseService: SupabaseService) { }

  /** Internal-only: returns public columns for all accounts (never expose via a route). */
  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select('id, created_at, email, name, profile_image, profile_description, status');

    if (error) {
      throw new InternalServerErrorException('Unable to process request');
    }

    if (!data) {
      return null;
    }

    return data;
  }

  /**
   * Internal use only (auth layer). Returns full row including hashed password
   * and refresh_token. Never send this data directly to the client.
   */
  async findById(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to process request');
    }

    if (!data) {
      return null;
    }

    return data;
  }

  /** Client-safe: returns only public profile fields for any user by ID. */
  async findPublicById(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select('id, created_at, name, profile_image, profile_description, status')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to process request');
    }

    if (!data) {
      return null;
    }

    return data;
  }

  /**
   * Internal use only (auth layer). Returns full row so the caller can verify
   * the hashed password. Never forward this data to the client.
   */
  async findByEmail(email: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select('id, email, password, refresh_token, name, profile_image, profile_description, status')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to process request');
    }

    if (!data) {
      return null;
    }

    return data;
  }

  async addAccount({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }) {
    if (!email || !password || !name) {
      throw new BadRequestException('Email, password, and name must be provided');
    }

    const user = await this.findByEmail(email);

    if (user) {
      throw new ConflictException('Email in used');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await this.supabaseService
      .getClient()
      .from('account')
      .insert({
        id: ulid(),
        created_at: new Date().toISOString(),
        email,
        name,
        password: hashedPassword,
        profile_image: '',
        status: 1,
      })
      .select();

    if (error) {
      throw new InternalServerErrorException('Unable to process request');
    }

    return { message: 'Account created successfully' };
  }

  /**
   * Finds an existing account by email or creates a new "Google" account.
   * Google accounts are given a random locked password they can never use
   * for regular email/password sign-in.
   */
  async findOrCreateGoogleAccount({
    email,
    name,
    profile_image,
  }: {
    email: string;
    name: string;
    profile_image: string;
  }) {
    const existing = await this.findByEmail(email);
    if (existing) return existing;

    // Random locked password — Google users authenticate via OAuth only
    const lockedPassword = await bcrypt.hash(
      crypto.randomBytes(32).toString('hex'),
      10,
    );

    const { error } = await this.supabaseService
      .getClient()
      .from('account')
      .insert({
        id: ulid(),
        created_at: new Date().toISOString(),
        email,
        name: name || email,
        password: lockedPassword,
        profile_image: profile_image || '',
        status: 1,
      })
      .select();

    if (error) {
      throw new InternalServerErrorException('Unable to process request');
    }

    return this.findByEmail(email);
  }

  async findUserPost(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('posts')
      .select(
        '*, account:user_id (id, name, profile_image), likes!left (user_id), collections!left (user_id), likes_count:likes(count), collections_count:collections(count)',
      )
      .eq('user_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data || []).map(({ likes, collections, likes_count, collections_count, ...rest }: any) => {
      return {
        ...rest,
        isLiked: likes.length > 0,
        isCollected: collections.length > 0,
        favorite_num: (likes_count as any)?.[0]?.count ?? 0,
        saved_num: (collections_count as any)?.[0]?.count ?? 0,
      };
    });
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

  async findUserFollower(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('follows')
      .select('account:follower_id (id, name, profile_image)')
      .eq('followed_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data || []).map(({ account }) => account);
  }

  async findUserFollowerNumber(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const { count, error } = await this.supabaseService
      .getClient()
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return count || 0;
  }

  async findUserFollowing(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('follows')
      .select('account:followed_id (id, name, profile_image)')
      .eq('follower_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data || []).map(({ account }) => account);
  }

  async findUserFollowingNumber(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const { count, error } = await this.supabaseService
      .getClient()
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return count || 0;
  }

  async findUserLikesPost(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('likes')
      .select(
        'posts:post_id (*, account:user_id (id, name, profile_image), likes!left (user_id), collections!left (user_id), likes_count:likes(count), collections_count:collections(count))',
      )
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

  async findUserLikesNumber(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const { count, error } = await this.supabaseService
      .getClient()
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return count || 0;
  }

  async findUserComments(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('comments')
      .select('posts:post_id (*, account:user_id (id, name, profile_image))')
      .eq('user_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data || []).map(({ posts }) => posts);
  }

  async findUserCommentsNumber(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const { count, error } = await this.supabaseService
      .getClient()
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return count || 0;
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
  async updateAccount(id: string, updateInfo: { name?: string; profile_description?: string; profile_image?: string }) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .update(updateInfo)
      .eq('id', id)
      .select('id, created_at, name, profile_image, profile_description, status')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to process request');
    }

    return data;
  }
}
