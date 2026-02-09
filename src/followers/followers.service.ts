import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class FollowersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select(
        'id, created_at, follower_id, followed_id, account:follower_id (id, name, profile_image)',
      );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findFollower(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select(
        'id, created_at, follower_id, followed_id, account:follower_id (id, name, profile_image)',
      )
      .eq('followed_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findFollowerNumber(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('count(account)')
      .select(
        'id, created_at, follower_id, followed_id, account:follower_id (id, name, profile_image)',
      )
      .eq('followed_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findFollowing(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select(
        'id, created_at, follower_id, followed_id, account:followed_id (id, name, profile_image)',
      )
      .eq('follower_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findFollowingNumber(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
