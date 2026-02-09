import { Controller, Get, Param } from '@nestjs/common';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async findAll() {
    try {
      const post = await this.postService.findAll();
      return { success: true, data: post };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    try {
      const post = await this.postService.findById(id);
      return { success: true, data: post };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get('/user/:id')
  async findByUserId(@Param('id') id: string) {
    try {
      const post = await this.postService.findByUserId(id);
      return { success: true, data: post };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get('/user/:id/number')
  async findUserPostNumber(@Param('id') id: string) {
    try {
      const post = await this.postService.findUserPostNumber(id);
      return { success: true, data: post };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
