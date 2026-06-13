

// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { RedditScraperService } from './reddit-scraper/reddit-scraper.service';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
  
//   // --- TEMPORARY INGESTION TEST ---
//   const scraper = app.get(RedditScraperService);
//   console.log('--- WAKING UP PIPELINE PIPES ---');
//   await scraper.runIngestionPipeline('reactjs', 10); 
//   // ---------------------------------

//   await app.listen(3000);
// }
// bootstrap();


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Ingestion complete! We commented this out so it doesn't run on every single code save.
  // const scraper = app.get(RedditScraperService);
  // await scraper.runIngestionPipeline('reactjs', 10); 
  
  await app.listen(3000);
}
bootstrap();