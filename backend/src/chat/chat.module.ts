// import { Module } from '@nestjs/common';
// import { ChatService } from './chat.service';
// import { ChatController } from './chat.controller';
// import { SupabaseService } from '../supabase/supabase.service';

// @Module({
//   controllers: [ChatController],
//   providers: [ChatService, SupabaseService],
// })
// export class ChatModule {}


import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SupabaseService } from '../supabase/supabase.service'; // 👈 Import the SERVICE directly instead of a module

@Module({
  imports: [
    ConfigModule, // Grants access to your environment variables
  ],
  controllers: [ChatController],
  providers: [
    ChatService, 
    SupabaseService, // 👈 Register the service directly as a provider here!
  ],
})
export class ChatModule {}