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
      .select('id, created_at, email, name, profile_image, profile_description, gender, birthday, location, status');

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
      .select('id, created_at, name, profile_image, profile_description, gender, birthday, location, status')
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
      .select('id, email, password, refresh_token, name, profile_image, profile_description, gender, birthday, location, status')
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

  async updateAccount(id: string, updateInfo: { name?: string; profile_description?: string; profile_image?: string; gender?: string; birthday?: string; location?: string }) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .update(updateInfo)
      .eq('id', id)
      .select('id, created_at, name, profile_image, profile_description, gender, birthday, location, status')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to process request');
    }

    return data;
  }

  /** Search accounts by name (case-insensitive partial match). Returns public fields only. */
  async searchAccounts(keyword: string, limit = 20) {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('account')
      .select('id, name, profile_image, profile_description')
      .ilike('name', `%${keyword.trim()}%`)
      .limit(limit);

    if (error) {
      throw new InternalServerErrorException('Unable to search accounts');
    }

    return data ?? [];
  }
}
