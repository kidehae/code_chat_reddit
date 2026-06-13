
// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { RedditScraperModule } from './reddit-scraper/reddit-scraper.module';
// import { SupabaseService } from './supabase/supabase.service';

// @Module({
//   imports: [
//     ConfigModule.forRoot({ isGlobal: true }), // 👈 Loads our .env file app-wide
//     RedditScraperModule,
//   ],
//   providers: [SupabaseService],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedditScraperModule } from './reddit-scraper/reddit-scraper.module';

@Module({
  imports: [
    // 1. Force the environmental variables to load FIRST globally
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env' // Explicitly tell it where the file is
    }), 
    // 2. Load your feature modules second
    RedditScraperModule,
  ],
})
export class AppModule {}
