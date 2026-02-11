import { Controller, Get, Param } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
    constructor(private readonly collectionsService: CollectionsService) { }

    @Get()
    async findAll() {
        try {
            const collections = await this.collectionsService.findAll();
            return { success: true, data: collections };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}
