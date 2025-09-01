import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BluevoxService } from './bluevox.service';
import { CreateBluevoxDto } from './dto/create-bluevox.dto';
import { UpdateBluevoxDto } from './dto/update-bluevox.dto';

@Controller('bluevox')
export class BluevoxController {
  constructor(private readonly bluevoxService: BluevoxService) {}

  @Post()
  create(@Body() createBluevoxDto: CreateBluevoxDto) {
    return this.bluevoxService.create(createBluevoxDto);
  }

  @Get()
  findAll() {
    return this.bluevoxService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bluevoxService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBluevoxDto: UpdateBluevoxDto) {
    return this.bluevoxService.update(+id, updateBluevoxDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bluevoxService.remove(+id);
  }
}
