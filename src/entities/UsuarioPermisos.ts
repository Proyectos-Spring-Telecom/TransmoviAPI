import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("FK_Usuarios", ["idUsuario"], {})
@Entity("UsuariosPermisos", { schema: "TransmoviDev" })
export class UsuarioPermisos {
  @Column("bigint", { name: "IdUsuario" })
  IdUsuario: number;

  @Column("bigint", { name: "IdPermiso" })
  IdPermiso: number;

  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  Id: number;
}
