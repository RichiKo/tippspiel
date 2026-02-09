import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateChampionshipDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  image: string;

  @IsBoolean()
  isPublic: boolean;

  @IsBoolean()
  isActive: boolean;
}
