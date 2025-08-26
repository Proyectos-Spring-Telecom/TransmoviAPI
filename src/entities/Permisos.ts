import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Modulos } from "./Modulos";
import { Roles } from "./Roles";

@Index("fk_permisos_modulo", ["idModulo"], {})
@Entity("Permisos", { schema: "TransmoviDev" })
export class Permisos {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  Id: number;

  @Column("varchar", { name: "Nombre", length: 100 })
  Nombre: string;

  @Column("varchar", { name: "Descripcion", nullable: true, length: 255 })
  Descripcion: string | null;

    @Column("tinyint", { name: "Estatus", nullable: true })
  Estatus: number | null;

  @ManyToOne(() => Modulos, (modulos) => modulos.permisos, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "idModulo", referencedColumnName: "id" }])
  IdModulo: number;

  @ManyToMany(() => Roles, (roles) => roles.Permisos)
  roles: Roles[];

  @ManyToOne(()=>Modulos, (modulo)=> modulo.permisos)
    @JoinColumn([{ name: "idModulo", referencedColumnName: "id" }])
  Modulo:Modulos;
}
