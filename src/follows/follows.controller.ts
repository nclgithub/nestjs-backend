import { Controller, Get, Param } from '@nestjs/common';
import { FollowsService } from './follows.service';

@Controller('follows')
export class FollowsController {
    constructor(private readonly followsService: FollowsService) { }

    @Get()
    async findAll() {
        try {
            const account = await this.followsService.findAll();
            return { success: true, data: account };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}
