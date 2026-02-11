import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ulid } from 'ulid';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AccountService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) { }

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account').select(
        '*',
      );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select(
        '*',
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findByEmail(email: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select(
        '*',
      )
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async validateUser({ email, password }: { email: string; password: string }) {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    const accessToken = this.jwtService.sign({ sub: user.id });

    const refreshTokenPlain = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);

    try {
      await this.updateRefreshToken(user.id, refreshTokenHash);
    } catch (err) {
      throw new Error('Fail to update refresh token');
    }

    return { user, accessToken };
  }

  async checkAccessToken({
    id,
    accessToken,
  }: {
    id: string;
    accessToken: string;
  }) {
    try {
      const payload = await this.jwtService.verifyAsync(accessToken);
      return { accessToken, expired: false };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        const user = await this.findById(id);

        if (!user) {
          throw new Error('User not login');
        }

        const now = new Date();

        if (now > user.token_expires_at) {
          try {
            const accessToken = await this.renewRefreshToken(id);
            return { user, accessToken, expired: true };
          } catch (error) {
            throw new Error(error.message);
          }
        } else {
          const accessToken = this.jwtService.sign({ sub: user.id });

          return { user, accessToken, expired: true };
        }
      }
    }
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    const now = new Date();
    const expired_date = new Date();
    expired_date.setDate(now.getDate() + 30);
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .update({
        refresh_token: refreshToken,
        token_expires_at: expired_date.toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async renewRefreshToken(id: string) {
    try {
      const newAccessToken = this.jwtService.sign({ sub: id });
      const newRefreshTokenPlain = crypto.randomBytes(64).toString('hex');
      const newRefreshTokenHash = await bcrypt.hash(newRefreshTokenPlain, 10);

      try {
        await this.updateRefreshToken(id, newRefreshTokenHash);
      } catch (error) {
        throw new Error('Refresh token update fail');
      }

      return { accessToken: newAccessToken };
    } catch (err) {
      throw new UnauthorizedException('Refresh token invalid');
    }
  }

  async registerUser({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }) {
    const user = await this.findByEmail(email);

    if (user) {
      throw new Error('Email in used');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await this.addAccount(
        ulid(),
        new Date().toISOString(),
        email,
        name,
        hashedPassword,
        '',
        1,
      );
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async addAccount(
    id: string,
    created_at: string,
    email: string,
    name: string,
    password: string,
    profile_image: string,
    status: number,
  ) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .insert({
        id,
        created_at,
        email,
        name,
        password,
        profile_image,
        status,
      })
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findUserPost(id: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('posts')
      .select('*, account:user_id (id, name, profile_image), likes!left (user_id)')
      .eq('user_id', id);

    if (error) {
      throw new Error(error.message);
    }

    const dataWithLikes = data.map(item => {
      return {
        ...item,
        isLiked: item.likes.length > 0,
      };
    });

    return dataWithLikes;
  }

  async findUserPostNumber(id: string) {
    const { count, error } = await this.supabaseService.getClient()
      .from('posts')
      .select('*', { count: "exact", head: true })
      .eq('user_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }

  async findUserFollower(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select(
        'account:follower_id (id, name, profile_image)',
      )
      .eq('followed_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(item => item.account);
  }

  async findUserFollowerNumber(id: string) {
    const { count, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return count;
  }

  async findUserFollowing(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select(
        'account:followed_id (id, name, profile_image)',
      )
      .eq('follower_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(item => item.account);
  }

  async findUserFollowingNumber(id: string) {
    const { count, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return count;
  }

  async findUserLikesPost(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('likes')
      .select('posts:post_id (*, account:user_id (id, name, profile_image))')
      .eq('user_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(item => { return { ...item.posts, isLiked: true } });
  }

  async findUserLikesNumber(id: string) {
    const { count, error } = await this.supabaseService
      .getClient()
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return count;
  }

  async findUserComments(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('comments')
      .select('posts:post_id (*, account:user_id (id, name, profile_image))')
      .eq('user_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(item => item.posts);
  }

  async findUserCommentsNumber(id: string) {
    const { count, error } = await this.supabaseService
      .getClient()
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return count;
  }

  async findUserCollections(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('collections')
      .select('posts:post_id (*, account:user_id (id, name, profile_image))')
      .eq('user_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data.map(item => item.posts);
  }

  async findUserCollectionsNumber(id: string) {
    const { count, error } = await this.supabaseService
      .getClient()
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return count;
  }
}
