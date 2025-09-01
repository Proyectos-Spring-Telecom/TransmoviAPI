import { Module } from '@nestjs/common';
import { BluevoxService } from './bluevox.service';
import { BluevoxController } from './bluevox.controller';

@Module({
  controllers: [BluevoxController],
  providers: [BluevoxService],
})
export class BluevoxModule {}
