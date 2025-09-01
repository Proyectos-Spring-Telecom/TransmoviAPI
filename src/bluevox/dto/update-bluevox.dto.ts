import { PartialType } from '@nestjs/swagger';
import { CreateBluevoxDto } from './create-bluevox.dto';

export class UpdateBluevoxDto extends PartialType(CreateBluevoxDto) {}
