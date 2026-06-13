// // import { Module } from '@nestjs/common';
// // import { RedditScraperService } from './reddit-scraper.service';

// // @Module({
// //   providers: [RedditScraperService]
// // })
// // export class RedditScraperModule {}


// import { Module } from '@nestjs/common';
// import { HttpModule } from '@nestjs/axios';
// import { RedditScraperService } from './reddit-scraper.service';

// @Module({
//   imports: [HttpModule], // 👈 This allows us to use HttpService to make requests
//   providers: [RedditScraperService],
//   exports: [RedditScraperService],
// })
// export class RedditScraperModule {}


import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RedditScraperService } from './reddit-scraper.service';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  imports: [HttpModule],
  providers: [RedditScraperService, SupabaseService], // 👈 Added SupabaseService here
  exports: [RedditScraperService],
})
export class RedditScraperModule {}