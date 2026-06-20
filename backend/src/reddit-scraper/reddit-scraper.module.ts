import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedditScraperService } from './reddit-scraper.service';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule, // Grants access to your HF_TOKEN config
  ],
  controllers: [], // 👈 Kept completely empty since you don't have a scraper controller!
  providers: [
    RedditScraperService,
    SupabaseService, // Directly injects your database utility
  ],
})
export class RedditScraperModule {}