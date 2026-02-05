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
    return this.accountService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.accountService.findById(id);
  }

  @Post('login')
  async validateUser(@Body() loginInfo) {
    try {
        const tokens = await this.accountService.validateUser(loginInfo);
        return { success: true, ...tokens };
    }
    catch (err)
    {
        throw new BadRequestException(err.message);
    }
  }

  @Post('register')
  async registerUser(@Body() userInfo) {
    try {
        const tokens = await this.accountService.registerUser(userInfo);
        return { success: true, ...tokens };
    }
    catch (err)
    {
        throw new BadRequestException(err.message);
    }
  }
}
