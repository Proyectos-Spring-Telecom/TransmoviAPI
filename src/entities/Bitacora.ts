import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("Bitacora", { schema: "TransmoviDev" })
export class Bitacora {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  Id: number;

  @Column("varchar", { name: "Modulo", nullable: true, length: 100 })
  Modulo: string | null;

  @Column("varchar", { name: "Descripcion", nullable: true, length: 250 })
  Descripcion: string | null;

  @Column("varchar", { name: "Accion", nullable: true, length: 45 })
  Accion: string | null;

  @Column("datetime", { name: "Fecha", nullable: true })
  Fecha: Date | null;

  @Column("varchar", { name: "Query", nullable: true, length: 1000 })
  Query: string | null;

  @Column("bigint", { name: "IdUsuario" })
  IdUsuario: number;
}
