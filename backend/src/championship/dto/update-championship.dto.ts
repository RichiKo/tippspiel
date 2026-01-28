// If @nestjs/mapped-types is not available, use @nestjs/swagger or define PartialType manually
// import { PartialType } from '@nestjs/swagger';
import { CreateChampionshipDto } from './create-championship.dto';

type PartialType<T> = {
  [P in keyof T]?: T[P];
};

export class UpdateChampionshipDto
  implements PartialType<CreateChampionshipDto>
{
  name?: string;
  description?: string;
  image?: string;
  isPublic?: boolean;
  isActive?: boolean;
  createdByUserId?: string;
}
