import { Controller, Get, Param } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Get(':id')
  async findAll(@Param('id') id: string) {
    try {
      const post = await this.postsService.findAll(id);
      return { success: true, data: post };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/post/:postId')
  async findById(@Param('id') id: string, @Param('postId') postId: string) {
    try {
      const post = await this.postsService.findById(id, postId);
      return { success: true, data: post };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/likes')
  async findPostLikes(@Param('id') id: string) {
    try {
      const likes = await this.postsService.findPostLikes(id);
      return { success: true, data: likes };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/likes/number')
  async findPostLikesNumber(@Param('id') id: string) {
    try {
      const likes = await this.postsService.findPostLikesNumber(id);
      return { success: true, data: likes };
    } catch (err) {
      return { success: false, error: err.message, data: 0 };
    }
  }

  @Get(':id/comments')
  async findPostComments(@Param('id') id: string) {
    try {
      const comments = await this.postsService.findPostComments(id);
      return { success: true, data: comments };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/comments/number')
  async findPostCommentsNumber(@Param('id') id: string) {
    try {
      const comments = await this.postsService.findPostCommentsNumber(id);
      return { success: true, data: comments };
    } catch (err) {
      return { success: false, error: err.message, data: 0 };
    }
  }

  @Get(':id/collections')
  async findPostCollections(@Param('id') id: string) {
    try {
      const collections = await this.postsService.findPostCollections(id);
      return { success: true, data: collections };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  @Get(':id/collections/number')
  async findPostCollectionsNumber(@Param('id') id: string) {
    try {
      const collections = await this.postsService.findPostCollectionsNumber(id);
      return { success: true, data: collections };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
