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
  constructor(private readonly accountService: AccountService) {}

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
}
