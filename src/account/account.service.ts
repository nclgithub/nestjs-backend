import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import { ulid } from 'ulid';

@Injectable()
export class AccountService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select('*');

    if (error) {
      throw new InternalServerErrorException('Unable to process request');
    }

    if (!data) {
      return null;
    }

    return data;
  }

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

  async findByEmail(email: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
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
      throw new InternalServerErrorException(error.message);
    }

    return 'Successfully add account';
  }

  async findUserPost(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('posts')
      .select(
        '*, account:user_id (id, name, profile_image), likes!left (user_id), collections!left (user_id)',
      )
      .eq('user_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data || []).map(({ likes, collections, ...rest }) => {
      return {
        ...rest,
        isLiked: likes.length > 0,
        isCollected: collections.length > 0,
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
        'posts:post_id (*, account:user_id (id, name, profile_image))',
      )
      .eq('user_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data || []).map(({ posts }) => {
      if (!posts) return null;
      return {
        ...posts,
        isLiked: true,
        isCollected: false,
      };
    }).filter((item) => item !== null);
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
      .select('posts:post_id (*, account:user_id (id, name, profile_image))')
      .eq('user_id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data || []).map(({ posts }) => posts);
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
      .select()
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }
}
