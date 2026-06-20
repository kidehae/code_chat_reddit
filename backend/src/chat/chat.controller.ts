// import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
// import { ChatService } from './chat.service';

// @Controller('chat')
// export class ChatController {
//   constructor(private readonly chatService: ChatService) {}

//   @Get()
//   async ask(@Query('question') question: string) {
//     if (!question) {
//       throw new BadRequestException('Query parameter "question" is required.');
//     }
//     const answer = await this.chatService.answerQuestion(question);
//     return { question, answer };
//   }
// }

import { Controller, Get, Query, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatQueryDto } from './dto/chat-query.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,        // Automatically strip out properties that are not on the DTO
      transform: true,        // Automatically transform primitive types to match DTO definitions
    }),
  )
  async getChatResponse(@Query() query: ChatQueryDto) {
    // 1. Extra fallback safety check in case query query object extraction runs dry
    if (!query || !query.question) {
      throw new BadRequestException('Query parameter "question" is required.');
    }

    // 2. Call the exact service method handling your LLM + vector lookup logic
    const answer = await this.chatService.answerQuestion(query.question);
    
    // 3. Return a clean, formatted object structure back to your user or frontend client
    return {
      question: query.question,
      answer: answer,
    };
  }
}