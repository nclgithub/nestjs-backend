import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AccountModule } from './account/account.module';
import { PostsModule } from './posts/posts.module';
import { ConfigModule } from '@nestjs/config';
import { CommentsModule } from './comments/comments.module';
import { FollowsModule } from './follows/follows.module';
import { CollectionsModule } from './collections/collections.module';
import { LikesModule } from './likes/likes.module';
import { AuthModule } from './auth/auth.module';
import { DraftsModule } from './drafts/drafts.module';
import { ConversationsModule } from './conversations/conversations.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AccountModule,
    AuthModule,
    PostsModule,
    LikesModule,
    CommentsModule,
    FollowsModule,
    CollectionsModule,
    DraftsModule,
    ConversationsModule,
    NotificationsModule,   // ← exports NotificationsService for other modules
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
