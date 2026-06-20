import { Injectable, Logger, OnModuleInit } from '@nestjs/common'; 
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { HfInference } from '@huggingface/inference';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { XMLParser } from 'fast-xml-parser';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RedditScraperService implements OnModuleInit { 
  private readonly logger = new Logger(RedditScraperService.name);
  private hf: HfInference;
  private parser: XMLParser;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    const hfToken = this.configService.get<string>('HF_TOKEN');
    this.hf = new HfInference(hfToken);
    this.parser = new XMLParser();
  }

  // 🚀 This runs automatically as soon as the application initializes
  async onModuleInit() {
    this.logger.log('🚀 App started: Triggering an immediate manual database cleanup test...');
    await this.handleDatabaseCleanup();
  }

  // Automatically triggers every 6 hours to sync our target topics
  @Cron(CronExpression.EVERY_6_HOURS) 
  async handleAutomaticSync() {
    this.logger.log('Starting automated background sync for target subreddits...');
    
    const targetSubreddits = [
  // Frontend & UI
  'reactjs', 
  'typescript', 
  'javascript', 
  'nextjs', 
  'vuejs', 
  'angular', 
  'tailwindcss',

  // Backend & Runtimes
  'nestjs', 
  'nodejs', 
  'golang', 
  'rust', 
  'python', 
  'java',

  // Databases & Infrastructure
  'postgresql', 
  'supabase', 
  'docker', 
  'aws',

  // General Software Engineering & Architecture
  'webdev', 
  'softwareengineering', 
  'ProgrammerHumor' // Optional: if you want your bot to understand developer inside jokes!
];
    
    for (const subreddit of targetSubreddits) {
      try {
        this.logger.log(`Syncing latest threads from r/${subreddit}...`);
        const newChunksCount = await this.runIngestionPipeline(subreddit, 15);
        this.logger.log(`Successfully completed sync for r/${subreddit}. Added ${newChunksCount} new chunks.`);
      } catch (error: any) {
        this.logger.error(`Failed automatic sync for r/${subreddit}: ${error.message}`);
      }
    }
  }

  async runIngestionPipeline(subreddit: string, limit = 15): Promise<number> {
    let chunksSavedCount = 0;
    try {
      const rawChunks = await this.fetchSubredditRSS(subreddit, limit);
      
      if (rawChunks.length === 0) {
        this.logger.warn(`No valid content chunks extracted from r/${subreddit}. Pipeline stopping.`);
        return 0;
      }

      this.logger.log(`Generating embeddings and saving ${rawChunks.length} chunks to Supabase...`);

      for (const chunk of rawChunks) {
        const embeddingResult = await this.hf.featureExtraction({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: chunk.content,
        });

        const embeddingVector = (Array.isArray(embeddingResult) 
          ? embeddingResult.flat(Infinity) 
          : Object.values(embeddingResult)) as number[];

        const { error } = await this.supabaseService.getClient()
          .from('reddit_chunks')
          .insert({
            content: chunk.content,
            metadata: chunk.metadata,
            embedding: embeddingVector,
          });

        if (error) {
          this.logger.error(`Supabase Insert Error: ${error.message}`);
        } else {
          chunksSavedCount++;
        }
      }

      this.logger.log(`🎉 Success! Ingested and embedded data from r/${subreddit}.`);
      return chunksSavedCount;

    } catch (err: any) {
      this.logger.error(`Pipeline execution failed: ${err.message}`);
      return chunksSavedCount;
    }
  }

  private async fetchSubredditRSS(subreddit: string, limit: number): Promise<Array<{ content: string; metadata: any }>> {
    const url = `https://www.reddit.com/r/${subreddit}/hot/.rss`;
    
    this.logger.log(`Fetching RSS data stream from r/${subreddit}...`);
    
    const response = await firstValueFrom<any>(
      this.httpService.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
    );

    const jsonObj = this.parser.parse(response.data);
    const entries = jsonObj.feed?.entry || [];
    const chunksToEmbed: Array<{ content: string; metadata: any }> = [];

    const loopLimit = Math.min(entries.length, limit);

    for (let i = 0; i < loopLimit; i++) {
      const entry = entries[i];
      
      const title = entry.title || 'Untitled Post';
      let rawContent = entry.content || '';

      if (typeof rawContent === 'object') {
        rawContent = rawContent['#text'] || '';
      }
      const cleanContent = rawContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

      if (!cleanContent || cleanContent.length < 30) continue;

      const fullText = `Title: ${title}\n\nDiscussion Content: ${cleanContent}`;
      const chunks = this.simpleTextChunker(fullText, 500);

      for (const chunk of chunks) {
        chunksToEmbed.push({
          content: chunk,
          metadata: {
            title: title,
            subreddit: subreddit,
            url: entry.link?.['@_href'] || entry.id || `https://reddit.com/r/${subreddit}`,
            author: entry.author?.name || 'Anonymous',
          },
        });
      }
    }

    return chunksToEmbed;
  }

  private simpleTextChunker(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.substring(i, i + chunkSize));
      i += chunkSize - 50;
    }
    return chunks;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDatabaseCleanup() {
    this.logger.log('🧹 Running automated database maintenance and cleanup...');

    // Calculate the cutoff date (Change '30' to your preferred retention window)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 👈 Fixed this value back to 30 days
    const cutoffIsoString = cutoffDate.toISOString();

    try {
      const { data, error, count } = await this.supabaseService.getClient()
        .from('reddit_chunks')
        .delete({ count: 'exact' })
        .lt('created_at', cutoffIsoString);

      if (error) {
        throw error;
      }

      this.logger.log(`✅ Cleanup complete. Permanently purged ${count || 0} old chunks older than ${cutoffIsoString}.`);
    } catch (error: any) {
      this.logger.error(`❌ Database cleanup pipeline failed: ${error.message}`);
    }
  }
}