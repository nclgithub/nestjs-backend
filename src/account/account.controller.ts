import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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

  @Get('search')
  async searchAccounts(@Query('q') q: string) {
    return await this.accountService.searchAccounts(q);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    return await this.accountService.findPublicById(id);
  }

  @Post('update')
  @UseGuards(JwtAuthGuard)
  async updateAccount(@Req() req, @Body() updateInfo: { name?: string; profile_description?: string; profile_image?: string; gender?: string; birthday?: string; location?: string }) {
    const userId = req.user.userId;
    return await this.accountService.updateAccount(userId, updateInfo);
  }
}
