

// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   // Ingestion complete! We commented this out so it doesn't run on every single code save.
//   // const scraper = app.get(RedditScraperService);
//   // await scraper.runIngestionPipeline('reactjs', 10); 
  
//   await app.listen(3000);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔓 Enable Cross-Origin Resource Sharing (CORS) so your frontend can access it
  app.enableCors({
    origin: '*', // Allow requests from any origin (perfect for Lovable/v0 staging URLs)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();