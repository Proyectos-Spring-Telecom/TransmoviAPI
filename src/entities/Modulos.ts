import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Permisos } from "./Permisos";

@Entity("Modulos", { schema: "Transmovi" })
export class Modulos {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  id: string;

  @Column("varchar", { name: "Nombre", length: 100 })
  nombre: string;

  @Column("varchar", { name: "Descripcion", nullable: true, length: 255 })
  descripcion: string | null;

  @ManyToMany(() => Permisos, (permisos) => permisos.modulos)
  @JoinTable({
    name: "ModuloPermisos",
    joinColumns: [{ name: "IdModulo", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "IdPermiso", referencedColumnName: "id" }],
    schema: "Transmovi",
  })
  permisos: Permisos[];
}
