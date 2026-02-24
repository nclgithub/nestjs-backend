import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req) {
    const userId = req.user?.userId;
    return await this.postsService.findAll(userId);
  }

  @Get('post/:postId')
  @UseGuards(JwtAuthGuard)
  async findById(@Req() req, @Param('postId') postId: string) {
    const userId = req.user?.userId;
    return await this.postsService.findById(postId, userId);
  }

  @Get(':id/likes')
  async findPostLikes(@Param('id') id: string) {
    return await this.postsService.findPostLikes(id);
  }

  @Get(':id/likes/number')
  async findPostLikesNumber(@Param('id') id: string) {
    return await this.postsService.findPostLikesNumber(id);
  }

  @Get(':id/comments')
  async findPostComments(@Param('id') id: string) {
    return await this.postsService.findPostComments(id);
  }

  @Get(':id/comments/number')
  async findPostCommentsNumber(@Param('id') id: string) {
    return await this.postsService.findPostCommentsNumber(id);
  }

  @Get(':id/collections')
  async findPostCollections(@Param('id') id: string) {
    return await this.postsService.findPostCollections(id);
  }

  @Get(':id/collections/number')
  async findPostCollectionsNumber(@Param('id') id: string) {
    return await this.postsService.findPostCollectionsNumber(id);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createPost(@Req() req, @Body() body: { title: string; description: string }) {
    const userId = req.user?.userId;
    return await this.postsService.createPost(userId, body.title, body.description);
  }
}
