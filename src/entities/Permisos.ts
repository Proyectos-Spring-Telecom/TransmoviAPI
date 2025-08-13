import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Modulos } from "./Modulos";
import { Roles } from "./Roles";

@Entity("Permisos", { schema: "Transmovi" })
export class Permisos {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  id: string;

  @Column("varchar", { name: "Nombre", length: 100 })
  nombre: string;

  @Column("varchar", { name: "Descripcion", nullable: true, length: 255 })
  descripcion: string | null;

  @ManyToMany(() => Modulos, (modulos) => modulos.permisos)
  modulos: Modulos[];

  @ManyToMany(() => Roles, (roles) => roles.permisos)
  roles: Roles[];
}
