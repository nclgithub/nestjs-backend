import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AccountModule } from './account/account.module';
import { PostModule } from './post/post.module';
import { ConfigModule } from '@nestjs/config';
import { FollowersModule } from './followers/followers.module';

@Module({
  imports: [SupabaseModule, AccountModule, PostModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FollowersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
