import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],   // ← allows other modules to inject this
})
export class NotificationsModule { }

