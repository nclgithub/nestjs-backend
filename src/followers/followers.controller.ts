import { Controller, Get, Param } from '@nestjs/common';
import { FollowersService } from './followers.service';

@Controller('followers')
export class FollowersController {
  constructor(private readonly followersService: FollowersService) {}

  @Get()
  async findAll() {
    try {
      const account = await this.followersService.findAll();
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/follower')
  async findFollower(@Param('id') id: string) {
    try {
      const account = await this.followersService.findFollower(id);
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/follower/number')
  async findFollowerNumber(@Param('id') id: string) {
    try {
      const account = await this.followersService.findFollowerNumber(id);
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/following')
  async findFollowing(@Param('id') id: string) {
    try {
      const account = await this.followersService.findFollowing(id);
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/following/number')
  async findFollowingNumber(@Param('id') id: string) {
    try {
      const account = await this.followersService.findFollowingNumber(id);
      return { success: true, data: account };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
