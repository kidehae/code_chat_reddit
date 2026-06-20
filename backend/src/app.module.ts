
// import { Module } from '@nestjs/common';
// import { ScheduleModule } from '@nestjs/schedule';
// import { ChatModule } from './chat/chat.module';
// import { RedditScraperModule } from './reddit-scraper/reddit-scraper.module';

// @Module({
//   imports: [
//     ScheduleModule.forRoot(), // 👈 Activates the internal task runner
//     ChatModule,
//     RedditScraperModule,
//   ],
// })
// export class AppModule {}


import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from './chat/chat.module';
import { RedditScraperModule } from './reddit-scraper/reddit-scraper.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 👈 MUST BE FIRST! Reads your .env file immediately
    ScheduleModule.forRoot(),
    ChatModule,
    RedditScraperModule,
  ],
})
export class AppModule {}