import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class ChatQueryDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 500)
  // Prevent obvious script tags or malicious characters if desired
  @Matches(/^[^<>]*$/, { message: 'HTML tags and angle brackets are not allowed in the question.' })
  question!: string;
}