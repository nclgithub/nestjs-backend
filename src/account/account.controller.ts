import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @Post('add')
  async addAccount(@Body() userInfo) {
    return await this.accountService.addAccount(userInfo);
  }

  @Get('posts')
  @UseGuards(JwtAuthGuard)
  async findUserPost(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserPost(userId);
  }

  @Get('posts/number')
  @UseGuards(JwtAuthGuard)
  async findUserPostNumber(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserPostNumber(userId);
  }

  @Get('followers')
  @UseGuards(JwtAuthGuard)
  async findUserFollower(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserFollower(userId);
  }

  @Get('followers/number')
  @UseGuards(JwtAuthGuard)
  async findUserFollowerNumber(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserFollowerNumber(userId);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  async findUserFollowing(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserFollowing(userId);
  }

  @Get('following/number')
  @UseGuards(JwtAuthGuard)
  async findUserFollowingNumber(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserFollowingNumber(userId);
  }

  @Get('likes')
  @UseGuards(JwtAuthGuard)
  async findUserLikesPost(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserLikesPost(userId);
  }

  @Get('likes/number')
  @UseGuards(JwtAuthGuard)
  async findUserLikesNumber(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserLikesNumber(userId);
  }

  @Get('comments')
  @UseGuards(JwtAuthGuard)
  async findUserComments(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserComments(userId);
  }

  @Get('comments/number')
  @UseGuards(JwtAuthGuard)
  async findUserCommentsNumber(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserCommentsNumber(userId);
  }

  @Get('collections')
  @UseGuards(JwtAuthGuard)
  async findUserCollections(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserCollections(userId);
  }

  @Get('collections/number')
  @UseGuards(JwtAuthGuard)
  async findUserCollectionsNumber(@Req() req) {
    const userId = req.user.userId;
    return await this.accountService.findUserCollectionsNumber(userId);
  }

  /**
   * GET /account/:id — returns public profile info of any user by ID.
   * Protected so only authenticated users can look up profiles.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    return await this.accountService.findPublicById(id);
  }

  @Post('update')
  @UseGuards(JwtAuthGuard)
  async updateAccount(@Req() req, @Body() updateInfo: { name?: string; profile_description?: string; profile_image?: string }) {
    const userId = req.user.userId;
    return await this.accountService.updateAccount(userId, updateInfo);
  }
}
