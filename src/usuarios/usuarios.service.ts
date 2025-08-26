//Servicio usuario
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuarios } from 'src/entities/Usuarios';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateUsuarioEstatusDto } from './dto/update-usuario-estatus.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuarios)
    private readonly usuarioService: Repository<Usuarios>,
  ) { }
  //Obtener todos los usuarios
  async getAllUsuario() {
    try {
      const Usuarios = await this.usuarioService.find();
      if (Usuarios.length === 0) {
        throw new NotFoundException('Usuarios no encontrados');
      }
      //Falta el apartado de la bitacora
      const usuariosSinPassword = Usuarios.map(({ Password, ...rest }) => rest);
      return usuariosSinPassword;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException({ message: 'Error al obtener Usuarios' });
    }
  }
  //Obtener el usuario por ID
  async getUsuarioByID(id: number) {
    try {
      //Cambiamos el id a number
      const user = await this.usuarioService.findOne({
        where: { Id:id },
      });
      if (!user) {
        throw new NotFoundException(`Usuario con ID:${id} no encontrado`);
      }
      //Falta el apartado de la bitacora
      const { Password: _, ...usuarioSinPassword } = user;
      return usuarioSinPassword;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Error al obtener Usuario',
      });
    }
  }
  //Creacion de un usuario
  async createUsuario(createUsuarioDto: CreateUsuarioDto) {
    try {
      /*const {
        UserName,
        Password,
          EmailConfirmed,
        Telefono,
        Nombre,
        ApellidoPaterno,
        ApellidoMaterno,
        Estatus,
        IdRol,
        IdCliente,
      } = createUsuarioDto;*/
      const existUsuario = await this.usuarioService.findOne({
        where: { UserName:createUsuarioDto.UserName },
      });
      if (existUsuario) {
        throw new BadRequestException('El usuario ya existe');
      }

      const hashedPassword = await bcrypt.hash(createUsuarioDto.Password, 10);
      createUsuarioDto.Password = hashedPassword;
      const newUser = this.usuarioService.create(createUsuarioDto);

      await this.usuarioService.save(newUser);
      //Falta el apartado de la bitacora
      const { Password: _, ...usuarioSinPassword } = newUser;
      return {
        message: 'Usuario creado exitosamente',
        User: usuarioSinPassword,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }

  //Actualizar usuario
  async updateUsuario(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    try {
      const usuario = await this.usuarioService.findOne({ where: { Id: id } });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID:${id} no encontrado`);
      }

      if (updateUsuarioDto.Password) {
        updateUsuarioDto.Password = await bcrypt.hash(
          updateUsuarioDto.Password,
          10,
        );
      }

      await this.usuarioService.update(id, updateUsuarioDto);
      const newUser = await this.usuarioService.findOne({ where: { Id: id } });
      if (!newUser) {
        throw new NotFoundException(`Usuario con ID:${id} no encontrado`);
      }
      const { Password: _, ...usuarioSinPassword } = newUser;
      return usuarioSinPassword;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Error al actualizar usuario',
      });
    }
  }

  //Actualizar Estatus
  async updateUsuarioEstatus(
    id: number,
    updateUsuarioEstatusDto: UpdateUsuarioEstatusDto,
  ) {
    try {
      const usuario = await this.usuarioService.findOne({ where: { Id: id } });
      if (!usuario) {
        throw new NotFoundException(`Usuario con ID:${id} no encontrado`);
      }
      const { estatus } = updateUsuarioEstatusDto;

      const result = await this.usuarioService.update(id, { estatus });

      if (result.affected === 0) {
        throw new NotFoundException(`Usuario con ID:${id} no encontrado`);
      }
      //Falta bitacora
      return { message: `Estatus actualizado correctamente a ${estatus}` };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Error al actualizar estatus',
      });
    }
  }

  //Eliminamos usuario
  async deleteUsuario(id: number) {
    try {
      const usuario = await this.usuarioService.findOne({ where: { Id: id } });
      if (!usuario) {
        throw new NotFoundException(`Usuario con ${id} no encontrado`);
      }
      await this.usuarioService.remove(usuario);
      //Falta el apartado de la bitacora
      return `Usuario con ${id} eliminado exitosamente`;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el usuario');
    }
  }
}
