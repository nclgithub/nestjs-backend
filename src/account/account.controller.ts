import {
  BadRequestException,
  Body,
  ConsoleLogger,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountService } from './account.service';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @Get()
  async findAll() {
    try {
      const account = await this.accountService.findAll();
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    try {
      const account = await this.accountService.findById(id);
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Post('login')
  async validateUser(@Body() loginInfo) {
    try {
      const account = await this.accountService.validateUser(loginInfo);
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Post('register')
  async registerUser(@Body() userInfo) {
    try {
      await this.accountService.registerUser(userInfo);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Post('checktoken')
  async checkAccessToken(@Body() userInfo) {
    try {
      const result = await this.accountService.checkAccessToken(userInfo);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/posts')
  async findUserPost(@Param('id') id: string) {
    try {
      const post = await this.accountService.findUserPost(id);
      return { success: true, data: post };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/posts/number')
  async findUserPostNumber(@Param('id') id: string) {
    try {
      const post = await this.accountService.findUserPostNumber(id);
      return { success: true, data: post };
    } catch (err) {
      return { success: false, error: err.message, data: 0 };
    }
  }

  @Get(':id/followers')
  async findUserFollower(@Param('id') id: string) {
    try {
      const account = await this.accountService.findUserFollower(id);
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/followers/number')
  async findUserFollowerNumber(@Param('id') id: string) {
    try {
      const account = await this.accountService.findUserFollowerNumber(id);
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message, data: 0 };
    }
  }

  @Get(':id/following')
  async findUserFollowing(@Param('id') id: string) {
    try {
      const account = await this.accountService.findUserFollowing(id);
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/following/number')
  async findUserFollowingNumber(@Param('id') id: string) {
    try {
      const account = await this.accountService.findUserFollowingNumber(id);
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message, data: 0 };
    }
  }

  @Get(':id/likes')
  async findUserLikesPost(@Param('id') id: string) {
    try {
      const likes = await this.accountService.findUserLikesPost(id);
      return { success: true, data: likes };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/likes/number')
  async findUserLikesNumber(@Param('id') id: string) {
    try {
      const likes = await this.accountService.findUserLikesNumber(id);
      return { success: true, data: likes };
    } catch (err) {
      return { success: false, error: err.message, data: 0 };
    }
  }

  @Get(':id/comments')
  async findUserComments(@Param('id') id: string) {
    try {
      const comments = await this.accountService.findUserComments(id);
      return { success: true, data: comments };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/comments/number')
  async findUserCommentsNumber(@Param('id') id: string) {
    try {
      const comments = await this.accountService.findUserCommentsNumber(id);
      return { success: true, data: comments };
    } catch (err) {
      return { success: false, error: err.message, data: 0 };
    }
  }

  @Get(':id/collections')
  async findUserCollections(@Param('id') id: string) {
    try {
      const collections = await this.accountService.findUserCollections(id);
      return { success: true, data: collections };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/collections/number')
  async findUserCollectionsNumber(@Param('id') id: string) {
    try {
      const collections = await this.accountService.findUserCollectionsNumber(id);
      return { success: true, data: collections };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
