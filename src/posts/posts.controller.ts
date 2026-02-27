import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';

interface UploadedFileType {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
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

  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadImage(@UploadedFile() file: UploadedFileType) {
    const url = await this.postsService.uploadImage(file);
    return { url };
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createPost(@Req() req, @Body() body: { title: string; description: string; post_image?: string[] }) {
    const userId = req.user?.userId;
    return await this.postsService.createPost(userId, body.title, body.description, body.post_image);
  }
}
