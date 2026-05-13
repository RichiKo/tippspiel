import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { ArchiveController } from './archive.controller';
import { ArchiveEntryEntity } from './archive-entry.entity';
import { ArchiveService } from './archive.service';

@Module({
  imports: [TypeOrmModule.forFeature([ArchiveEntryEntity, UserEntity])],
  controllers: [ArchiveController],
  providers: [ArchiveService],
})
export class ArchiveModule {}
