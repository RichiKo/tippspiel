import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AuthGuard } from '../guards/auth.guard';
import { ArchiveEntryEntity } from './archive-entry.entity';
import { ArchiveService } from './archive.service';
import { CreateArchiveEntryDto } from './dto/create-archive-entry.dto';
import { UpdateArchiveEntryDto } from './dto/update-archive-entry.dto';

@Controller('archive')
@UseGuards(AuthGuard)
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  @Get()
  findAll(): Promise<ArchiveEntryEntity[]> {
    return this.archiveService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ArchiveEntryEntity> {
    return this.archiveService.findOne(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreateArchiveEntryDto): Promise<ArchiveEntryEntity> {
    return this.archiveService.create(dto);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @UsePipes(new ValidationPipe())
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArchiveEntryDto,
  ): Promise<ArchiveEntryEntity> {
    return this.archiveService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string): Promise<void> {
    return this.archiveService.remove(id);
  }
}
