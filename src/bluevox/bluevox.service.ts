import { Injectable } from '@nestjs/common';
import { CreateBluevoxDto } from './dto/create-bluevox.dto';
import { UpdateBluevoxDto } from './dto/update-bluevox.dto';

@Injectable()
export class BluevoxService {
  create(createBluevoxDto: CreateBluevoxDto) {
    return 'This action adds a new bluevox';
  }

  findAll() {
    return `This action returns all bluevox`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bluevox`;
  }

  update(id: number, updateBluevoxDto: UpdateBluevoxDto) {
    return `This action updates a #${id} bluevox`;
  }

  remove(id: number) {
    return `This action removes a #${id} bluevox`;
  }
}
