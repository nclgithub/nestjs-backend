import { Controller, Get, Param } from '@nestjs/common';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Get()
    async findAll() {
        return this.postService.findAll();
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.postService.findById(id);
    }
}
